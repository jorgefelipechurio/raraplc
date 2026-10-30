// Clasificación por ítem con Haiku. La IA ubica cada noticia en el mapa; no decide nada del negocio.
import { extractJson } from "./claude";
import { LAYERS, SIGNALS, VERTICALS, isLayer, isSignal, isVertical, normalizeNiche, type Layer, type Signal, type Vertical } from "./taxonomy";

export const CLASSIFY_MAX_TOKENS = 4000;

export interface ItemForLlm {
  ref: number;
  title: string;
  url: string;
  source: string;
  excerpt: string;
}

export interface Classification {
  ref: number;
  relevance: 0 | 1 | 2 | 3;
  layer: Layer | null;
  vertical: Vertical | null;
  signal: Signal | null;
  niche: string | null;
  amountUsd: number | null;
  entities: string[];
  openSource: boolean;
  region: string;
  pain: string;
  summary: string;
  language: string;
}

export function buildClassifyPrompt(items: ItemForLlm[], knownNiches: string[]): { system: string; user: string } {
  const system = [
    "Sos un analista que escucha la conversación pública sobre Physical AI (IA que percibe y actúa en el mundo físico: robots, humanoides, vehículos, manipulación, simulación, world models).",
    "Tu trabajo es ubicar cada ítem en un mapa de nichos de oportunidad. Solo clasificás; no respondés a nadie.",
    "No es sobre PLCs ni automatización clásica, salvo que el texto los conecte con Physical AI.",
    "",
    "Capas (layer):",
    ...Object.entries(LAYERS).map(([k, v]) => `- ${k}: ${v}`),
    `Verticales (vertical): ${VERTICALS.join(" | ")}`,
    "Señal (signal):",
    ...Object.entries(SIGNALS).map(([k, v]) => `- ${k}: ${v}`),
    "",
    "niche: etiqueta corta en kebab-case, en español, que nombre un nicho concreto (capa + problema + vertical si aplica),",
    "por ejemplo 'datos-teleoperacion-manipulacion-fina' o 'humanoides-logistica-carga-descarga'.",
    "Reutilizá una etiqueta conocida si el ítem encaja; creá una nueva solo si ninguna encaja.",
    knownNiches.length ? `Etiquetas conocidas: ${knownNiches.join(", ")}` : "Todavía no hay etiquetas conocidas.",
    "",
    "Para cada ítem devolvé:",
    "- relevance: 0 (no es Physical AI) a 3. 1 = mención o noticia genérica; 2 = dato o caso concreto; 3 = evidencia fuerte de demanda, oferta o hueco en un nicho.",
    "- layer, vertical, signal, niche (como arriba; null si relevance 0).",
    "- amount_usd: monto de la ronda en dólares si es financiación y el texto lo dice; si no, null. No estimes.",
    "- entities: empresas, labs o productos nombrados (máximo 5).",
    "- open_source: true si el ítem trata de un modelo, dataset, hardware o software abierto.",
    "- region: país o región principal, o 'global'.",
    "- pain: si el texto describe un problema o cuello de botella, una frase en español; si no, cadena vacía.",
    "- summary: una o dos frases en español, con tus palabras, sin copiar frases del original.",
    "- language: código ISO 639-1 del original.",
    "No inventes datos. Si el texto no alcanza, relevance 0.",
    'Respondé SOLO con JSON válido: {"items":[{"ref":1,"relevance":2,"layer":"..","vertical":"..","signal":"..","niche":"..","amount_usd":null,"entities":[],"open_source":false,"region":"..","pain":"","summary":"..","language":".."}]}',
  ].join("\n");

  const user = items
    .map((it) => `### ref=${it.ref}\nFuente: ${it.source}\nTítulo: ${it.title}\nURL: ${it.url}\nTexto: ${it.excerpt || "(sin texto)"}`)
    .join("\n\n");
  return { system, user };
}

export function parseClassifications(text: string, validRefs: Set<number>): Classification[] {
  const raw = (extractJson(text) as { items?: unknown[] } | null)?.items;
  if (!Array.isArray(raw)) return [];
  const out: Classification[] = [];
  for (const r of raw) {
    const o = (r ?? {}) as Record<string, unknown>;
    const ref = Number(o.ref);
    if (!validRefs.has(ref)) continue;
    const relevance = Math.max(0, Math.min(3, Math.round(Number(o.relevance) || 0))) as Classification["relevance"];
    const relevant = relevance > 0;
    const amount = Number(o.amount_usd);
    out.push({
      ref,
      relevance,
      layer: relevant && isLayer(o.layer) ? o.layer : null,
      vertical: relevant && isVertical(o.vertical) ? o.vertical : null,
      signal: relevant && isSignal(o.signal) ? o.signal : null,
      niche: relevant ? normalizeNiche(o.niche) : null,
      amountUsd: Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null,
      entities: Array.isArray(o.entities) ? o.entities.map(String).map((s) => s.slice(0, 80)).slice(0, 5) : [],
      openSource: o.open_source === true,
      region: String(o.region ?? "").slice(0, 40),
      pain: String(o.pain ?? "").slice(0, 300),
      summary: String(o.summary ?? "").slice(0, 400),
      language: String(o.language ?? "").slice(0, 8),
    });
  }
  return out;
}
