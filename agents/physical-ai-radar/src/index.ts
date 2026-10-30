// Worker "physical-ai-radar": escucha qué se dice de Physical AI y arma un mapa semanal de nichos.
// Solo lee fuentes públicas; nunca publica ni responde.
import { readSpend } from "./claude";
import { runDigest, runListen, capsFrom, type Env } from "./run";
import { PENDING_SOURCES, SOURCES } from "./sources";
import { loadNicheStats, rankNiches } from "./synth";
import { LAYERS, SIGNALS, VERTICALS } from "./taxonomy";

/** Debe coincidir con wrangler.toml. */
export const CRON_LISTEN = "0 10 * * *"; // todos los días 07:00 Buenos Aires
export const CRON_DIGEST = "30 11 * * 1"; // lunes 08:30 Buenos Aires

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export function tokenMatches(header: string | null, expected: string | undefined): boolean {
  if (!expected || !header?.startsWith("Bearer ")) return false;
  const given = header.slice(7);
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export default {
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    if (event.cron === CRON_DIGEST) ctx.waitUntil(runDigest(env));
    else ctx.waitUntil(runListen(env));
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/health") return json({ ok: true, worker: "physical-ai-radar" });
    if (!tokenMatches(req.headers.get("authorization"), env.READ_TOKEN)) return json({ error: "unauthorized" }, 401);

    if (req.method === "GET" && url.pathname === "/config") {
      return json({ sources: SOURCES.map(({ key, label, family, url }) => ({ key, label, family, url })), pending: PENDING_SOURCES, layers: LAYERS, verticals: VERTICALS, signals: SIGNALS });
    }
    if (req.method === "GET" && url.pathname === "/niches") {
      return json(rankNiches(await loadNicheStats(env.DB, new Date()), 100));
    }
    if (req.method === "GET" && url.pathname === "/findings") {
      const niche = url.searchParams.get("niche");
      const minRel = Number(url.searchParams.get("min_relevance") ?? "2");
      const limit = Math.min(200, Number(url.searchParams.get("limit") ?? "50"));
      const where = ["status = 'classified'", "relevance >= ?"];
      const binds: (string | number)[] = [minRel];
      if (niche) {
        where.push("niche = ?");
        binds.push(niche);
      }
      const rows = await env.DB.prepare(
        `SELECT id, source, family, url, title, published_at, relevance, layer, vertical, signal, niche, amount_usd,
                entities, open_source, region, pain, summary FROM findings WHERE ${where.join(" AND ")}
         ORDER BY id DESC LIMIT ?`,
      )
        .bind(...binds, limit)
        .all();
      return json(rows.results);
    }
    if (req.method === "GET" && url.pathname === "/digest/latest") {
      const d = await env.DB.prepare("SELECT week, subject, html, sent_at, model, notes FROM digests ORDER BY week DESC LIMIT 1").first<{ html: string }>();
      if (!d) return json({ error: "todavía no hay digest" }, 404);
      if (url.searchParams.get("format") === "html") return new Response(d.html, { headers: { "content-type": "text/html; charset=utf-8" } });
      return json(d);
    }
    if (req.method === "GET" && url.pathname === "/budget") {
      return json({ classify: env.CLASSIFY_MODEL, synth: env.SYNTH_MODEL, caps: capsFrom(env), spend: await readSpend(env.DB) });
    }
    if (req.method === "GET" && url.pathname === "/runs") {
      return json((await env.DB.prepare("SELECT * FROM runs ORDER BY id DESC LIMIT 20").all()).results);
    }
    if (req.method === "POST" && url.pathname === "/run") return json(await runListen(env));
    if (req.method === "POST" && url.pathname === "/digest") return json(await runDigest(env, new Date(), url.searchParams.get("force") === "1"));
    return json({ error: "not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
