import { describe, expect, it } from "vitest";
import { parseClassifications } from "../src/classify";
import { canSpend, costUsd } from "../src/claude";
import { renderDigest } from "../src/email";
import { mapEntries, parseFeed, SOURCES, type FeedSource } from "../src/sources";
import { isoWeek, parseSynthesis, rankNiches, type NicheRow } from "../src/synth";
import { momentum, normalizeNiche, whitespaceScore } from "../src/taxonomy";

const RSS = `<?xml version="1.0"?><rss version="2.0"><channel><title>x</title>
<item><title>Robot data startup raises $60M</title><link>https://ex.com/a</link><pubDate>Thu, 29 Oct 2026 11:00:35 +0000</pubDate><description><![CDATA[<p>A <b>humanoid</b> &amp; teleoperation company</p>]]></description></item>
<item><title>Series B funding is up</title><link>https://ex.com/b</link><pubDate>Thu, 29 Oct 2026 10:00:00 +0000</pubDate><description>Fintech rounds</description></item>
<item><title>Old robot news</title><link>https://ex.com/c</link><pubDate>Mon, 01 Jan 2024 10:00:00 +0000</pubDate><description>robot</description></item>
<item><title>Cut off`; // feed truncado, como el de Hugging Face

const ATOM = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>World model paper</title><link rel="alternate" href="https://ex.com/w"/><published>2026-10-28T10:00:00Z</published><summary>embodied agents</summary></entry></feed>`;

const src = (keywords: string[]): FeedSource => ({ key: "t", label: "t", family: "inversion", url: "https://ex.com", keywords });
const NOW = new Date("2026-10-30T12:00:00Z");

describe("feeds", () => {
  it("parsea RSS con CDATA y entidades, y tolera ítems truncados", () => {
    const e = parseFeed(RSS);
    expect(e).toHaveLength(3);
    expect(e[0]!.text).toBe("A humanoid & teleoperation company");
    expect(e[0]!.publishedAt).toBe("2026-10-29T11:00:35.000Z");
  });
  it("parsea Atom", () => {
    const e = parseFeed(ATOM);
    expect(e[0]!.link).toBe("https://ex.com/w");
  });
  it("filtra por palabras y por ventana inicial de 14 días", () => {
    const items = mapEntries(src(["humanoid", "robot"]), parseFeed(RSS), null, NOW);
    expect(items.map((i) => i.url)).toEqual(["https://ex.com/a"]);
  });
  it("respeta el cursor", () => {
    const items = mapEntries(src([]), parseFeed(RSS), "2026-10-29T10:30:00.000Z", NOW);
    expect(items.map((i) => i.url)).toEqual(["https://ex.com/a"]);
  });
  it("todas las fuentes usan https y claves únicas", () => {
    expect(new Set(SOURCES.map((s) => s.key)).size).toBe(SOURCES.length);
    expect(SOURCES.every((s) => s.url.startsWith("https://"))).toBe(true);
  });
});

describe("clasificación", () => {
  it("valida enumeraciones, descarta refs desconocidas y normaliza el nicho", () => {
    const text = `ok {"items":[
      {"ref":1,"relevance":3,"layer":"datos","vertical":"logistica","signal":"financiacion","niche":"Datos Teleoperación / Manipulación","amount_usd":60000000,"entities":["Mecka AI"],"open_source":false,"region":"US","pain":"","summary":"s","language":"en"},
      {"ref":2,"relevance":0,"layer":"datos","niche":"x-y"},
      {"ref":99,"relevance":3},
      {"ref":3,"relevance":7,"layer":"inventada","signal":"rumor","niche":"ok-nicho"}]}`;
    const c = parseClassifications(text, new Set([1, 2, 3]));
    expect(c).toHaveLength(3);
    expect(c[0]).toMatchObject({ layer: "datos", signal: "financiacion", niche: "datos-teleoperacion-manipulacion", amountUsd: 60000000 });
    expect(c[1]).toMatchObject({ relevance: 0, layer: null, niche: null });
    expect(c[2]).toMatchObject({ relevance: 3, layer: null, signal: null, niche: "ok-nicho" });
  });
  it("JSON roto devuelve vacío", () => {
    expect(parseClassifications('{"items":[{"ref":1', new Set([1]))).toEqual([]);
  });
});

describe("métricas", () => {
  it("hueco y momentum", () => {
    expect(whitespaceScore({ demand: 6, supply: 1 })).toBe(3);
    expect(momentum({ thisWeek: 4, prevWeeklyAvg: 1 })).toBe(4);
    expect(momentum({ thisWeek: 2, prevWeeklyAvg: 0 })).toBe(9.99);
    expect(normalizeNiche("ab")).toBeNull();
  });
  it("semana ISO", () => {
    expect(isoWeek(new Date("2026-11-02T11:30:00Z"))).toBe("2026-W45");
    expect(isoWeek(new Date("2027-01-01T00:00:00Z"))).toBe("2026-W53");
  });
});

describe("presupuesto USD 5", () => {
  const caps = { daily: 0.4, monthly: 5, synthReserve: 0.5 };
  it("la clasificación no toca la reserva de la síntesis", () => {
    expect(canSpend({ today: 0, month: 4.49 }, caps, 0.005, "classify")).toBe(true);
    expect(canSpend({ today: 0, month: 4.5 }, caps, 0.005, "classify")).toBe(false);
    expect(canSpend({ today: 0.4, month: 4.5 }, caps, 0.05, "synth")).toBe(true);
    expect(canSpend({ today: 0, month: 4.99 }, caps, 0.05, "synth")).toBe(false);
  });
  it("un mes típico entra holgado", () => {
    // 150 lotes de Haiku (~4k tokens entrada, ~2k salida) + 4 síntesis de Sonnet (~12k entrada, 3k salida)
    const month = 150 * costUsd("claude-haiku-5-5", 4000, 2000) + 4 * costUsd("claude-sonnet-5-5", 12000, 3000);
    expect(month).toBeLessThan(1);
  });
  it("modelo desconocido se cotiza caro", () => {
    expect(costUsd("otro", 1e6, 0)).toBe(15);
  });
});

describe("síntesis y mail", () => {
  const niches: NicheRow[] = [
    { niche: "datos-teleoperacion", layer: "datos", n: 5, demand: 6, supply: 1, fundingUsd: 60e6, thisWeek: 4, prevWeeklyAvg: 0.25, whitespace: 3, momentum: 16, isNew: false },
    { niche: "humanoides-logistica", layer: "plataformas", n: 8, demand: 1, supply: 7, fundingUsd: 2e9, thisWeek: 1, prevWeeklyAvg: 2, whitespace: 0.13, momentum: 0.5, isNew: false },
  ];
  const ev = [{ id: 7, niche: "datos-teleoperacion", signal: "financiacion", relevance: 3, title: "Mecka <AI>", url: "https://ex.com/a", summary: "s", pain: "", entities: "[]", amount_usd: 60e6 }];

  it("descarta refs inventadas", () => {
    const s = parseSynthesis('{"titular":"T","lectura":"a\\n\\nb","huecos":[{"niche":"datos-teleoperacion","por_que":"p","que_construiria":"q","refs":[7,8]}],"preguntas":["?"]}', new Set([7]));
    expect(s!.huecos[0]!.refs).toEqual([7]);
    expect(s!.calientes).toEqual([]);
  });
  it("arma el mail escapando HTML y con tabla", () => {
    const s = parseSynthesis('{"titular":"T","lectura":"x","huecos":[{"niche":"n","por_que":"p","refs":[7]}]}', new Set([7]));
    const d = renderDigest("2026-W45", s, rankNiches(niches), ev, { items: 12, sources: 10, spendMonth: 0.12 });
    expect(d.html).toContain("Mecka &lt;AI&gt;");
    expect(d.html).toContain("USD 2.0 B");
    expect(d.subject).toBe("Radar Physical AI 2026-W45: T");
    expect(d.text).toContain("https://ex.com/a");
  });
  it("sin síntesis igual manda los números", () => {
    const d = renderDigest("2026-W45", null, niches, [], { items: 0, sources: 10, spendMonth: 0 });
    expect(d.subject).toContain("solo números");
    expect(d.html).toContain("datos-teleoperacion");
  });
});
