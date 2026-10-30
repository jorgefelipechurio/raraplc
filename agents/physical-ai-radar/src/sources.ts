// Fuentes de escucha de Physical AI. Solo lectura, con User-Agent identificable.
// Feeds verificados el 30-oct-2026 (HTTP 200, ítems recientes) salvo donde se indica.

export interface FeedSource {
  key: string;
  label: string;
  family: "investigacion" | "inversion" | "analisis";
  url: string;
  /**
   * Filtro previo sin costo de Claude: solo entran ítems cuyo título o texto contenga
   * alguna de estas palabras. Vacío = entra todo (feeds ya temáticos).
   */
  keywords: string[];
}

/** Vocabulario de Physical AI para filtrar feeds generales. */
export const PHYSICAL_AI_KEYWORDS = [
  "physical ai", "embodied", "robot", "robotic", "humanoid", "manipulat", "dexterous",
  "vision-language-action", " vla", "world model", "sim-to-real", "sim2real", "teleoperat",
  "autonomous mobile", " amr ", "cobot", "foundation model for robot", "gripper", "actuator",
  "lerobot", "isaac", "ros 2", "ros2", "drone", "autonomous vehicle", "self-driving",
  "warehouse automation", "exoskeleton", "legged", "quadruped",
];

/** Más estricto para arXiv cs.RO (~100 artículos/día): solo la frontera de Physical AI. */
export const ARXIV_KEYWORDS = [
  "vision-language-action", "vla", "foundation model", "world model", "embodied",
  "generalist", "large-scale robot", "robot learning", "imitation learning", "diffusion policy",
  "teleoperation data", "sim-to-real", "humanoid", "dexterous", "cross-embodiment",
];

export const SOURCES: FeedSource[] = [
  // --- Investigación ---
  // arXiv recomienda RSS para lectura diaria; el feed se publica de lunes a viernes.
  { key: "arxiv:cs.RO", label: "arXiv · cs.RO", family: "investigacion", url: "https://rss.arxiv.org/rss/cs.RO", keywords: ARXIV_KEYWORDS },
  { key: "hf-blog", label: "Hugging Face blog", family: "investigacion", url: "https://huggingface.co/blog/feed.xml", keywords: PHYSICAL_AI_KEYWORDS },
  { key: "nvidia-robotics", label: "NVIDIA blog · Robotics", family: "investigacion", url: "https://blogs.nvidia.com/blog/category/robotics/feed/", keywords: [] },
  { key: "deepmind", label: "Google DeepMind blog", family: "investigacion", url: "https://deepmind.google/blog/rss.xml", keywords: PHYSICAL_AI_KEYWORDS },
  // --- Inversión y startups ---
  { key: "techcrunch-robotics", label: "TechCrunch · Robotics", family: "inversion", url: "https://techcrunch.com/category/robotics/feed/", keywords: [] },
  { key: "crunchbase-news", label: "Crunchbase News", family: "inversion", url: "https://news.crunchbase.com/feed/", keywords: PHYSICAL_AI_KEYWORDS },
  { key: "roboticstomorrow", label: "RoboticsTomorrow · News", family: "inversion", url: "https://www.roboticstomorrow.com/rss/news.php", keywords: PHYSICAL_AI_KEYWORDS },
  // --- Análisis de industria ---
  { key: "ieee-robotics", label: "IEEE Spectrum · Robotics", family: "analisis", url: "https://spectrum.ieee.org/feeds/topic/robotics.rss", keywords: [] },
  { key: "mit-tr-ai", label: "MIT Technology Review · AI", family: "analisis", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", keywords: PHYSICAL_AI_KEYWORDS },
  { key: "import-ai", label: "Import AI (Jack Clark)", family: "analisis", url: "https://importai.substack.com/feed", keywords: PHYSICAL_AI_KEYWORDS },
];

/** Previstas, sin leer todavía. */
export const PENDING_SOURCES = [
  "The Robot Report (therobotreport.com/feed) — rechazó la lectura el 30-oct-2026; probar desde el worker",
  "arXiv API (export.arxiv.org/api) — permite búsquedas por abstract; respetar 1 pedido cada 3 s",
  "Physical Intelligence, Figure, Skild, 1X — blogs sin RSS confirmado",
  "Hacker News (API Algolia) y GitHub — familia 'conversación técnica', no elegida por ahora",
];

export const USER_AGENT = "RARA-physical-ai-radar/0.1 (+https://github.com/jorgefelipechurio/raraplc; listen-only)";
const EXCERPT_CHARS = 600;
export const FIRST_RUN_LOOKBACK_DAYS = 14;

export interface RawItem {
  sourceKey: string;
  url: string;
  title: string;
  publishedAt: string;
  excerpt: string;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const clip = (s: string, n = EXCERPT_CHARS): string => (s.length > n ? s.slice(0, n) + "…" : s);

const decodeEntities = (s: string): string =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

function tagText(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  if (!m) return null;
  const raw = (m[1] ?? "").replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1");
  return decodeEntities(raw).trim();
}

function atomLink(block: string): string | null {
  const links = [...block.matchAll(/<link\b([^>]*)\/?>/gi)].map((m) => m[1] ?? "");
  const pick = links.find((a) => /rel=["']alternate["']/i.test(a)) ?? links.find((a) => !/rel=/i.test(a)) ?? links[0];
  const href = pick?.match(/href=["']([^"']+)["']/i)?.[1];
  return href ? decodeEntities(href) : null;
}

function toIso(date: string | null): string | null {
  if (!date) return null;
  const t = Date.parse(date);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export interface FeedEntry {
  title: string;
  link: string;
  publishedAt: string | null;
  text: string;
}

/** RSS 2.0 / Atom con expresiones acotadas (Workers no tiene DOMParser). Tolera feeds truncados. */
export function parseFeed(xml: string): FeedEntry[] {
  const out: FeedEntry[] = [];
  const isAtom = /<feed\b/i.test(xml) && !/<rss\b/i.test(xml);
  const blocks = isAtom ? xml.match(/<entry\b[\s\S]*?<\/entry>/gi) : xml.match(/<item\b[\s\S]*?<\/item>/gi);
  for (const b of blocks ?? []) {
    const title = stripHtml(tagText(b, "title") ?? "");
    const link = isAtom ? atomLink(b) : tagText(b, "link") ?? tagText(b, "guid");
    const date = isAtom
      ? tagText(b, "published") ?? tagText(b, "updated")
      : tagText(b, "pubDate") ?? tagText(b, "dc:date");
    const body = isAtom
      ? tagText(b, "summary") ?? tagText(b, "content")
      : tagText(b, "description") ?? tagText(b, "content:encoded");
    if (!link || !/^https?:\/\//i.test(link)) continue;
    out.push({ title: title || "(sin título)", link, publishedAt: toIso(date), text: stripHtml(decodeEntities(body ?? "")) });
  }
  return out;
}

export function matchesKeywords(entry: FeedEntry, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  const hay = ` ${entry.title} ${entry.text} `.toLowerCase();
  return keywords.some((k) => hay.includes(k.toLowerCase()));
}

export function sinceFor(cursor: string | null, now: Date = new Date()): string {
  if (cursor) return cursor;
  return new Date(now.getTime() - FIRST_RUN_LOOKBACK_DAYS * 86_400_000).toISOString();
}

export function mapEntries(src: FeedSource, entries: FeedEntry[], cursor: string | null, now: Date = new Date()): RawItem[] {
  const since = sinceFor(cursor, now);
  return entries
    .filter((e): e is FeedEntry & { publishedAt: string } => e.publishedAt !== null && e.publishedAt > since)
    .filter((e) => matchesKeywords(e, src.keywords))
    .map((e) => ({ sourceKey: src.key, url: e.link, title: e.title, publishedAt: e.publishedAt, excerpt: clip(e.text) }));
}

export async function fetchSource(src: FeedSource, cursor: string | null): Promise<RawItem[]> {
  const res = await fetch(src.url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8" },
  });
  if (!res.ok) throw new Error(`${src.key}: HTTP ${res.status}`);
  return mapEntries(src, parseFeed(await res.text()), cursor);
}

export function maxDate(items: RawItem[], previous: string | null): string | null {
  return items.reduce<string | null>((best, it) => (best === null || it.publishedAt > best ? it.publishedAt : best), previous);
}
