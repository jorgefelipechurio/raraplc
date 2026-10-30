// Dos corridas: escucha diaria (leer + clasificar) y síntesis semanal (agregar + Sonnet + mail).
import { buildClassifyPrompt, CLASSIFY_MAX_TOKENS, parseClassifications, type ItemForLlm } from "./classify";
import { callClaude, canSpend, estimateUsd, readSpend, recordUsage, type Caps } from "./claude";
import { renderDigest } from "./email";
import { fetchSource, maxDate, SOURCES } from "./sources";
import { buildSynthPrompt, isoWeek, loadEvidence, loadNicheStats, parseSynthesis, rankNiches, sqlTime, SYNTH_MAX_TOKENS, type Synthesis } from "./synth";

/** Interfaz mínima del binding send_email de Cloudflare Email Service. */
export interface EmailBinding {
  send(msg: { from: string | { email: string; name?: string }; to: string; subject: string; html?: string; text?: string }): Promise<{ messageId?: string }>;
}

export interface Env {
  DB: D1Database;
  EMAIL?: EmailBinding;
  ANTHROPIC_API_KEY?: string;
  READ_TOKEN?: string;
  CLASSIFY_MODEL: string;
  SYNTH_MODEL: string;
  DAILY_USD_CAP: string;
  MONTHLY_USD_CAP: string;
  SYNTH_RESERVE_USD: string;
  MAX_ITEMS_PER_RUN: string;
  BATCH_SIZE: string;
  FROM_ADDRESS?: string;
  TO_ADDRESS?: string;
}

/** Plan Free: 50 subrequests por invocación. */
export const SUBREQUEST_BUDGET = 45;
const MAX_ATTEMPTS = 3;

export const capsFrom = (env: Env): Caps => ({
  daily: Number(env.DAILY_USD_CAP ?? "0"),
  monthly: Number(env.MONTHLY_USD_CAP ?? "0"),
  synthReserve: Number(env.SYNTH_RESERVE_USD ?? "0"),
});

export interface ListenReport {
  newItems: number;
  classified: number;
  stoppedBy: null | "budget" | "item_cap" | "subrequests" | "error";
  notes: string[];
}

export async function runListen(env: Env, now: Date = new Date()): Promise<ListenReport> {
  const report: ListenReport = { newItems: 0, classified: 0, stoppedBy: null, notes: [] };
  const run = await env.DB.prepare("INSERT INTO runs (kind) VALUES ('listen') RETURNING id").first<{ id: number }>();
  let subrequests = 0;
  try {
    // 1) Escuchar (sin costo de Claude).
    for (const src of SOURCES) {
      const cur = await env.DB.prepare("SELECT value FROM cursors WHERE source_key = ?").bind(src.key).first<{ value: string }>();
      try {
        const items = await fetchSource(src, cur?.value ?? null);
        subrequests++;
        for (const it of items) {
          const r = await env.DB.prepare(
            `INSERT OR IGNORE INTO findings (source, family, url, title, published_at, excerpt_for_llm) VALUES (?, ?, ?, ?, ?, ?)`,
          )
            .bind(src.key, src.family, it.url, it.title, it.publishedAt, it.excerpt)
            .run();
          report.newItems += r.meta.changes ?? 0;
        }
        const next = maxDate(items, cur?.value ?? null);
        if (next && next !== cur?.value) {
          await env.DB.prepare(
            `INSERT INTO cursors (source_key, value) VALUES (?, ?)
             ON CONFLICT(source_key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
          )
            .bind(src.key, next)
            .run();
        }
      } catch (e) {
        subrequests++;
        report.notes.push(String(e instanceof Error ? e.message : e));
      }
    }

    // 2) Clasificar dentro del presupuesto.
    if (!env.ANTHROPIC_API_KEY) {
      report.notes.push("Sin ANTHROPIC_API_KEY: los hallazgos quedan pendientes.");
      return report;
    }
    const caps = capsFrom(env);
    const batchSize = Math.max(1, Math.min(15, Number(env.BATCH_SIZE) || 10));
    let left = Math.max(0, Number(env.MAX_ITEMS_PER_RUN) || 0);
    const known = await env.DB.prepare("SELECT label FROM niches ORDER BY n DESC LIMIT 60").all<{ label: string }>();
    const knownNiches = (known.results ?? []).map((r) => r.label);
    let afterId = 0;

    while (left > 0) {
      if (subrequests >= SUBREQUEST_BUDGET) {
        report.stoppedBy = "subrequests";
        break;
      }
      const rows = await env.DB.prepare(
        `SELECT id, title, url, source, excerpt_for_llm FROM findings
         WHERE status = 'pending' AND attempts < ? AND id > ? ORDER BY id LIMIT ?`,
      )
        .bind(MAX_ATTEMPTS, afterId, Math.min(batchSize, left))
        .all<{ id: number; title: string; url: string; source: string; excerpt_for_llm: string | null }>();
      const batch = rows.results ?? [];
      if (batch.length === 0) break;
      afterId = batch[batch.length - 1]!.id;
      const items: ItemForLlm[] = batch.map((r) => ({ ref: r.id, title: r.title, url: r.url, source: r.source, excerpt: r.excerpt_for_llm ?? "" }));

      const { system, user } = buildClassifyPrompt(items, knownNiches);
      const estimate = estimateUsd(env.CLASSIFY_MODEL, system.length + user.length, CLASSIFY_MAX_TOKENS);
      if (!canSpend(await readSpend(env.DB, now), caps, estimate, "classify")) {
        report.stoppedBy = "budget";
        break;
      }
      const ids = items.map((i) => i.ref);
      const marks = ids.map(() => "?").join(",");
      await env.DB.prepare(`UPDATE findings SET attempts = attempts + 1 WHERE id IN (${marks})`).bind(...ids).run();

      subrequests++;
      let res;
      try {
        res = await callClaude(env.ANTHROPIC_API_KEY, env.CLASSIFY_MODEL, system, user, CLASSIFY_MAX_TOKENS);
      } catch (e) {
        report.notes.push(String(e instanceof Error ? e.message : e));
        continue;
      }
      await recordUsage(env.DB, env.CLASSIFY_MODEL, res.inputTokens, res.outputTokens, now);
      const parsed = parseClassifications(res.text, new Set(ids));
      if (res.stopReason === "max_tokens") report.notes.push(`lote ${ids[0]}-${ids.at(-1)} cortado por max_tokens`);
      if (parsed.length < ids.length) report.notes.push(`lote ${ids[0]}-${ids.at(-1)}: ${parsed.length}/${ids.length} clasificados`);

      for (const c of parsed) {
        await env.DB.prepare(
          `UPDATE findings SET status = ?, relevance = ?, layer = ?, vertical = ?, signal = ?, niche = ?, amount_usd = ?,
             entities = ?, open_source = ?, region = ?, pain = ?, summary = ?, language = ?, excerpt_for_llm = NULL,
             classified_at = datetime('now') WHERE id = ?`,
        )
          .bind(
            c.relevance === 0 ? "irrelevant" : "classified",
            c.relevance, c.layer, c.vertical, c.signal, c.niche, c.amountUsd,
            JSON.stringify(c.entities), c.openSource ? 1 : 0, c.region, c.pain, c.summary, c.language, c.ref,
          )
          .run();
        if (c.relevance > 0 && c.niche) {
          await env.DB.prepare(
            `INSERT INTO niches (label, first_seen, last_seen, n) VALUES (?, ?, ?, 1)
             ON CONFLICT(label) DO UPDATE SET last_seen = excluded.last_seen, n = n + 1`,
          )
            .bind(c.niche, sqlTime(now), sqlTime(now))
            .run();
          if (!knownNiches.includes(c.niche)) knownNiches.push(c.niche);
        }
      }
      await env.DB.prepare(`UPDATE findings SET status = 'failed' WHERE status = 'pending' AND attempts >= ? AND id IN (${marks})`)
        .bind(MAX_ATTEMPTS, ...ids)
        .run();
      report.classified += parsed.length;
      left -= items.length;
    }
    if (report.stoppedBy === null && left <= 0) report.stoppedBy = "item_cap";
  } catch (e) {
    report.stoppedBy = "error";
    report.notes.push(String(e instanceof Error ? e.message : e));
  } finally {
    await env.DB.prepare(`UPDATE runs SET finished_at = datetime('now'), new_items = ?, classified = ?, stopped_by = ?, notes = ? WHERE id = ?`)
      .bind(report.newItems, report.classified, report.stoppedBy, report.notes.join(" | ").slice(0, 2000), run?.id ?? 0)
      .run();
  }
  return report;
}

export interface DigestReport {
  week: string;
  model: string | null;
  sent: boolean;
  skipped?: string;
  notes: string[];
}

/** Síntesis semanal. Con `force` se regenera aunque ya exista la de la semana. */
export async function runDigest(env: Env, now: Date = new Date(), force = false): Promise<DigestReport> {
  const week = isoWeek(now);
  const report: DigestReport = { week, model: null, sent: false, notes: [] };
  const prev = await env.DB.prepare("SELECT sent_at FROM digests WHERE week = ?").bind(week).first<{ sent_at: string | null }>();
  if (prev?.sent_at && !force) return { ...report, skipped: "ya enviado esta semana" };

  const niches = rankNiches(await loadNicheStats(env.DB, now));
  const evidence = await loadEvidence(env.DB, now);
  const newItems = await env.DB.prepare("SELECT COUNT(*) AS n FROM findings WHERE created_at >= ?")
    .bind(sqlTime(new Date(now.getTime() - 7 * 86_400_000)))
    .first<{ n: number }>();

  let synth: Synthesis | null = null;
  if (!env.ANTHROPIC_API_KEY) report.notes.push("Sin ANTHROPIC_API_KEY: mail solo con números.");
  else if (niches.length === 0) report.notes.push("Sin nichos clasificados todavía.");
  else {
    const { system, user } = buildSynthPrompt(niches, evidence, week);
    // Sonnet si alcanza el presupuesto; si no, Haiku; si tampoco, solo números.
    for (const model of [env.SYNTH_MODEL, env.CLASSIFY_MODEL]) {
      const est = estimateUsd(model, system.length + user.length, SYNTH_MAX_TOKENS);
      if (!canSpend(await readSpend(env.DB, now), capsFrom(env), est, "synth")) {
        report.notes.push(`presupuesto insuficiente para ${model}`);
        continue;
      }
      try {
        const res = await callClaude(env.ANTHROPIC_API_KEY, model, system, user, SYNTH_MAX_TOKENS);
        await recordUsage(env.DB, model, res.inputTokens, res.outputTokens, now);
        synth = parseSynthesis(res.text, new Set(evidence.map((e) => e.id)));
        if (synth) {
          report.model = model;
          break;
        }
        report.notes.push(`${model}: respuesta sin JSON válido${res.stopReason === "max_tokens" ? " (cortada)" : ""}`);
      } catch (e) {
        report.notes.push(String(e instanceof Error ? e.message : e));
      }
    }
  }

  const spend = await readSpend(env.DB, now);
  const digest = renderDigest(week, synth, niches, evidence, { items: newItems?.n ?? 0, sources: SOURCES.length, spendMonth: spend.month });

  await env.DB.prepare(
    `INSERT INTO digests (week, subject, html, text, model, synthesis) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(week) DO UPDATE SET subject = excluded.subject, html = excluded.html, text = excluded.text,
       model = excluded.model, synthesis = excluded.synthesis, created_at = datetime('now')`,
  )
    .bind(week, digest.subject, digest.html, digest.text, report.model, synth ? JSON.stringify(synth) : null)
    .run();

  if (!env.EMAIL || !env.FROM_ADDRESS || !env.TO_ADDRESS) {
    report.notes.push("Mail no configurado (binding EMAIL, FROM_ADDRESS o TO_ADDRESS): el digest quedó en /digest/latest.");
  } else {
    try {
      await env.EMAIL.send({
        from: { email: env.FROM_ADDRESS, name: "Radar Physical AI" },
        to: env.TO_ADDRESS,
        subject: digest.subject,
        html: digest.html,
        text: digest.text,
      });
      await env.DB.prepare("UPDATE digests SET sent_at = datetime('now') WHERE week = ?").bind(week).run();
      report.sent = true;
    } catch (e) {
      report.notes.push(`mail: ${String(e instanceof Error ? e.message : e)}`);
    }
  }
  await env.DB.prepare("UPDATE digests SET notes = ? WHERE week = ?").bind(report.notes.join(" | ").slice(0, 2000), week).run();
  return report;
}
