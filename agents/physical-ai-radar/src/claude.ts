// Llamadas a Claude y control de gasto (mismo esquema que rara-market-research).

/** USD por millón de tokens (precios tomados de rara-market-research, 29-oct-2026). */
export const PRICES: Record<string, { input: number; output: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
};

/** Modelo desconocido: se usa un precio alto para no subestimar el gasto. */
export const priceFor = (model: string) => PRICES[model] ?? { input: 15, output: 75 };

export const costUsd = (model: string, inTok: number, outTok: number): number => {
  const p = priceFor(model);
  return (inTok * p.input + outTok * p.output) / 1_000_000;
};

/** Estimación conservadora: ~3 caracteres por token y salida al máximo. */
export const estimateUsd = (model: string, promptChars: number, maxOut: number): number =>
  costUsd(model, Math.ceil(promptChars / 3), maxOut);

export interface Caps {
  daily: number;
  monthly: number;
  /** Parte del mes reservada para la síntesis semanal; la clasificación no la toca. */
  synthReserve: number;
}

export interface Spend {
  today: number;
  month: number;
}

export function canSpend(spend: Spend, caps: Caps, next: number, purpose: "classify" | "synth"): boolean {
  if (!(caps.daily > 0) || !(caps.monthly > 0)) return false;
  const monthLimit = purpose === "classify" ? caps.monthly - caps.synthReserve : caps.monthly;
  const dayOk = purpose === "synth" || spend.today + next <= caps.daily;
  return dayOk && spend.month + next <= monthLimit;
}

const utcDay = (d: Date) => d.toISOString().slice(0, 10);
const utcMonth = (d: Date) => d.toISOString().slice(0, 7);

export async function readSpend(db: D1Database, now: Date = new Date()): Promise<Spend> {
  const today = await db.prepare("SELECT COALESCE(SUM(usd),0) AS usd FROM usage_daily WHERE day = ?").bind(utcDay(now)).first<{ usd: number }>();
  const month = await db
    .prepare("SELECT COALESCE(SUM(usd),0) AS usd FROM usage_daily WHERE substr(day,1,7) = ?")
    .bind(utcMonth(now))
    .first<{ usd: number }>();
  return { today: today?.usd ?? 0, month: month?.usd ?? 0 };
}

export async function recordUsage(db: D1Database, model: string, inTok: number, outTok: number, now: Date = new Date()): Promise<number> {
  const usd = costUsd(model, inTok, outTok);
  await db
    .prepare(
      `INSERT INTO usage_daily (day, input_tokens, output_tokens, usd, calls) VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(day) DO UPDATE SET input_tokens = input_tokens + excluded.input_tokens,
         output_tokens = output_tokens + excluded.output_tokens, usd = usd + excluded.usd, calls = calls + 1`,
    )
    .bind(utcDay(now), inTok, outTok, usd)
    .run();
  return usd;
}

export interface ClaudeResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  stopReason: string | null;
}

export async function callClaude(apiKey: string, model: string, system: string, user: string, maxTokens: number): Promise<ClaudeResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`claude: HTTP ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300));
  const json = (await res.json()) as {
    content?: { type: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
    stop_reason?: string;
  };
  return {
    text: (json.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join(""),
    inputTokens: json.usage?.input_tokens ?? 0,
    outputTokens: json.usage?.output_tokens ?? 0,
    stopReason: json.stop_reason ?? null,
  };
}

/** Extrae el primer objeto JSON de una respuesta. */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
