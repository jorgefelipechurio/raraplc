// Taxonomía para mapear nichos de oportunidad en Physical AI.
// Ejes fijos (capa de la pila, vertical, tipo de señal) + una etiqueta de nicho libre que
// el modelo reutiliza entre corridas. La oportunidad sale de cruzar demanda contra oferta.

export const LAYERS = {
  modelos: "Modelos fundacionales para robots (VLA, políticas generalistas)",
  datos: "Datos: teleoperación, captura humana, datasets, etiquetado",
  simulacion: "Simulación, world models, gemelos digitales, sim-to-real",
  hardware: "Hardware: actuadores, manos, sensores táctiles, baterías",
  computo_borde: "Cómputo de borde y chips para inferencia en el robot",
  plataformas: "Plataformas robóticas: humanoides, brazos, AMR, drones, vehículos",
  integracion: "Integración con plantas existentes, brownfield, middleware, interoperabilidad",
  seguridad: "Seguridad funcional, certificación, evaluación, regulación",
  herramientas: "Herramientas para desarrolladores: frameworks, MLOps de robots, observabilidad",
  servicios: "Modelos de negocio: RaaS, operación remota, mantenimiento, financiamiento",
} as const;

export const VERTICALS = [
  "manufactura", "logistica", "agro", "salud", "construccion", "hogar", "retail",
  "mineria_energia", "defensa", "laboratorio", "movilidad", "transversal",
] as const;

export const SIGNALS = {
  financiacion: "Ronda de inversión, valuación, fondo",
  lanzamiento: "Producto o servicio lanzado o disponible",
  investigacion: "Paper, modelo o resultado técnico nuevo",
  adopcion: "Caso real de despliegue en un cliente",
  dolor: "Problema, cuello de botella o fracaso descrito explícitamente",
  regulacion: "Norma, ley, estándar o política pública",
  alianza: "Alianza, adquisición, cierre o salida del mercado",
  tendencia: "Opinión, pronóstico o análisis de tendencia",
} as const;

export type Layer = keyof typeof LAYERS;
export type Vertical = (typeof VERTICALS)[number];
export type Signal = keyof typeof SIGNALS;

export const isLayer = (s: unknown): s is Layer => typeof s === "string" && s in LAYERS;
export const isVertical = (s: unknown): s is Vertical => typeof s === "string" && (VERTICALS as readonly string[]).includes(s);
export const isSignal = (s: unknown): s is Signal => typeof s === "string" && s in SIGNALS;

/** Normaliza una etiqueta de nicho a kebab-case corto y estable. */
export function normalizeNiche(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const n = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return n.length >= 3 ? n : null;
}

export interface NicheStats {
  niche: string;
  layer: string;
  n: number;
  /** Señales de demanda: dolor (pesa doble), investigación, adopción. */
  demand: number;
  /** Señales de oferta: lanzamientos y rondas. */
  supply: number;
  fundingUsd: number;
  /** Ítems de esta semana contra el promedio semanal de las 4 anteriores. */
  thisWeek: number;
  prevWeeklyAvg: number;
}

/**
 * Hueco = demanda que la oferta todavía no cubre. Determinístico y auditable:
 * el modelo interpreta los números, no los inventa.
 */
export function whitespaceScore(s: Pick<NicheStats, "demand" | "supply">): number {
  return Math.round((s.demand / (1 + s.supply)) * 100) / 100;
}

/** Momentum: >1 crece, <1 se enfría. Con historia vacía se toma la semana como nueva. */
export function momentum(s: Pick<NicheStats, "thisWeek" | "prevWeeklyAvg">): number {
  if (s.prevWeeklyAvg <= 0) return s.thisWeek > 0 ? 9.99 : 0;
  return Math.round((s.thisWeek / s.prevWeeklyAvg) * 100) / 100;
}
