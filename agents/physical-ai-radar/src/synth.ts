// Síntesis semanal: números determinísticos por nicho + lectura de Sonnet sobre esos números.
import { extractJson } from "./claude";
import { LAYERS, momentum, whitespaceScore, type NicheStats } from "./taxonomy";

export const SYNTH_MAX_TOKENS = 3000;
const WEEK_MS = 7 * 86_400_000;

/** Formato de datetime('now') de SQLite, para comparar texto con texto. */
export const sqlTime = (d: Date): string => d.toISOString().slice(0, 19).replace("T", " ");

/** Etiqueta ISO de semana, p. ej. 2026-W44. Sirve de clave para no mandar dos veces. */
export function isoWeek(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export interface NicheRow extends NicheStats {
  whitespace: number;
  momentum: number;
  isNew: boolean;
}

export async function loadNicheStats(db: D1Database, now: Date): Promise<NicheRow[]> {
  const weekStart = sqlTime(new Date(now.getTime() - WEEK_MS));
  const windowStart = sqlTime(new Date(now.getTime() - 5 * WEEK_MS));
  const rows = await db
    .prepare(
      `SELECT f.niche,
              (SELECT layer FROM findings g WHERE g.niche = f.niche AND g.layer IS NOT NULL
                 GROUP BY layer ORDER BY COUNT(*) DESC LIMIT 1) AS layer,
              COUNT(*) AS n,
              SUM(CASE f.signal WHEN 'dolor' THEN 2 WHEN 'investigacion' THEN 1 WHEN 'adopcion' THEN 1 ELSE 0 END) AS demand,
              SUM(CASE WHEN f.signal IN ('lanzamiento','financiacion') THEN 1 ELSE 0 END) AS supply,
              SUM(COALESCE(f.amount_usd, 0)) AS fundingUsd,
              SUM(CASE WHEN f.created_at >= ?1 THEN 1 ELSE 0 END) AS thisWeek,
              SUM(CASE WHEN f.created_at < ?1 THEN 1 ELSE 0 END) / 4.0 AS prevWeeklyAvg,
              (SELECT first_seen FROM niches x WHERE x.label = f.niche) >= ?1 AS isNew
       FROM findings f
       WHERE f.status = 'classified' AND f.niche IS NOT NULL AND f.created_at >= ?2
       GROUP BY f.niche`,
    )
    .bind(weekStart, windowStart)
    .all<NicheStats & { isNew: number }>();
  return (rows.results ?? []).map((r) => ({
    ...r,
    layer: r.layer ?? "",
    isNew: Boolean(r.isNew),
    whitespace: whitespaceScore(r),
    momentum: momentum(r),
  }));
}

export interface Evidence {
  id: number;
  niche: string;
  signal: string;
  relevance: number;
  title: string;
  url: string;
  summary: string;
  pain: string;
  entities: string;
  amount_usd: number | null;
}

export async function loadEvidence(db: D1Database, now: Date, limit = 60): Promise<Evidence[]> {
  const rows = await db
    .prepare(
      `SELECT id, niche, signal, relevance, title, url, summary, pain, entities, amount_usd
       FROM findings
       WHERE status = 'classified' AND relevance >= 2 AND created_at >= ?
       ORDER BY relevance DESC, id DESC LIMIT ?`,
    )
    .bind(sqlTime(new Date(now.getTime() - WEEK_MS)), limit)
    .all<Evidence>();
  return rows.results ?? [];
}

/** Nichos a mostrar: los de esta semana primero, después por hueco. */
export function rankNiches(rows: NicheRow[], max = 25): NicheRow[] {
  return [...rows]
    .filter((r) => r.n >= 1)
    .sort((a, b) => b.thisWeek - a.thisWeek || b.whitespace - a.whitespace || b.n - a.n)
    .slice(0, max);
}

export interface SynthPoint {
  niche: string;
  por_que: string;
  que_construiria?: string;
  refs: number[];
}

export interface Synthesis {
  titular: string;
  lectura: string;
  huecos: SynthPoint[];
  calientes: SynthPoint[];
  saturados: SynthPoint[];
  emergentes: SynthPoint[];
  preguntas: string[];
}

export function buildSynthPrompt(niches: NicheRow[], evidence: Evidence[], week: string): { system: string; user: string } {
  const system = [
    "Sos un analista de estrategia que busca nichos de oportunidad en Physical AI para un emprendedor de hardware y software abiertos en Argentina.",
    "Te paso números por nicho calculados a partir de lo que se publicó en las últimas 5 semanas, y la evidencia de esta semana.",
    "Definiciones: demand = dolor×2 + investigación + adopción; supply = lanzamientos + rondas; whitespace = demand/(1+supply) (alto = demanda sin oferta);",
    "momentum = ítems de esta semana / promedio semanal de las 4 anteriores (9.99 = nicho sin historia previa).",
    "Reglas: apoyate solo en los números y la evidencia que te paso; si la muestra es chica (n<3), decilo.",
    "No inventes empresas, montos ni enlaces. Citá evidencia solo por su id en refs.",
    "Escribí en español rioplatense, directo, sin relleno.",
    "",
    "Respondé SOLO con JSON válido con esta forma:",
    '{"titular":"una frase","lectura":"2 o 3 párrafos cortos separados por \\n\\n",',
    '"huecos":[{"niche":"..","por_que":"..","que_construiria":"producto o servicio concreto que llenaría el hueco","refs":[1,2]}],',
    '"calientes":[{"niche":"..","por_que":"..","refs":[]}],',
    '"saturados":[{"niche":"..","por_que":"..","refs":[]}],',
    '"emergentes":[{"niche":"..","por_que":"..","refs":[]}],',
    '"preguntas":["qué mirar la semana que viene"]}',
    "Máximos: 4 huecos, 4 calientes, 3 saturados, 4 emergentes, 3 preguntas. Las listas pueden quedar vacías.",
  ].join("\n");

  const table = niches
    .map(
      (n) =>
        `${n.niche} | capa=${n.layer || "?"} | n=${n.n} | demand=${n.demand} | supply=${n.supply} | whitespace=${n.whitespace} | momentum=${n.momentum} | semana=${n.thisWeek} | rondas_usd=${n.fundingUsd}${n.isNew ? " | NUEVO" : ""}`,
    )
    .join("\n");
  const ev = evidence
    .map(
      (e) =>
        `[${e.id}] ${e.niche} · ${e.signal} · rel ${e.relevance}${e.amount_usd ? ` · USD ${e.amount_usd}` : ""}\n${e.title}\n${e.summary}${e.pain ? `\nDolor: ${e.pain}` : ""}${e.entities && e.entities !== "[]" ? `\nActores: ${e.entities}` : ""}`,
    )
    .join("\n\n");
  const user = `Semana ${week}\n\n## Nichos (últimas 5 semanas)\n${table || "(sin datos)"}\n\n## Evidencia de esta semana\n${ev || "(sin evidencia de relevancia ≥ 2)"}`;
  return { system, user };
}

function points(raw: unknown, validRefs: Set<number>, max: number): SynthPoint[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, max).flatMap((p) => {
    const o = (p ?? {}) as Record<string, unknown>;
    const niche = String(o.niche ?? "").slice(0, 80);
    const por_que = String(o.por_que ?? "").slice(0, 600);
    if (!niche || !por_que) return [];
    const refs = Array.isArray(o.refs) ? o.refs.map(Number).filter((r) => validRefs.has(r)).slice(0, 6) : [];
    const que = o.que_construiria ? String(o.que_construiria).slice(0, 400) : undefined;
    return [{ niche, por_que, refs, ...(que ? { que_construiria: que } : {}) }];
  });
}

export function parseSynthesis(text: string, validRefs: Set<number>): Synthesis | null {
  const o = extractJson(text) as Record<string, unknown> | null;
  if (!o || typeof o.titular !== "string") return null;
  return {
    titular: o.titular.slice(0, 200),
    lectura: String(o.lectura ?? "").slice(0, 3000),
    huecos: points(o.huecos, validRefs, 4),
    calientes: points(o.calientes, validRefs, 4),
    saturados: points(o.saturados, validRefs, 3),
    emergentes: points(o.emergentes, validRefs, 4),
    preguntas: Array.isArray(o.preguntas) ? o.preguntas.map(String).map((s) => s.slice(0, 300)).slice(0, 3) : [],
  };
}

export const layerLabel = (k: string): string => (k in LAYERS ? LAYERS[k as keyof typeof LAYERS] : k || "—");
