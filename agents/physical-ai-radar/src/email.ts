// Armado del mail semanal (HTML con estilos en línea + texto plano).
import type { Evidence, NicheRow, Synthesis, SynthPoint } from "./synth";

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const usd = (n: number): string =>
  n >= 1e9 ? `USD ${(n / 1e9).toFixed(1)} B` : n >= 1e6 ? `USD ${(n / 1e6).toFixed(0)} M` : n > 0 ? `USD ${Math.round(n / 1e3)} k` : "—";

export interface Digest {
  subject: string;
  html: string;
  text: string;
}

export function renderDigest(week: string, synth: Synthesis | null, niches: NicheRow[], evidence: Evidence[], stats: { items: number; sources: number; spendMonth: number }): Digest {
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const refLinks = (refs: number[]) =>
    refs
      .map((r) => byId.get(r))
      .filter((e): e is Evidence => Boolean(e))
      .map((e) => `<a href="${esc(e.url)}" style="color:#0b5cad">${esc(e.title.slice(0, 70))}</a>`)
      .join(" · ");
  const refText = (refs: number[]) =>
    refs.map((r) => byId.get(r)).filter((e): e is Evidence => Boolean(e)).map((e) => `  - ${e.title} — ${e.url}`).join("\n");

  const section = (title: string, pts: SynthPoint[]): string =>
    pts.length === 0
      ? ""
      : `<h2 style="font-size:16px;margin:24px 0 8px">${title}</h2>` +
        pts
          .map(
            (p) =>
              `<div style="margin:0 0 14px"><div style="font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#555">${esc(p.niche)}</div>` +
              `<div>${esc(p.por_que)}</div>` +
              (p.que_construiria ? `<div style="margin-top:4px"><b>Qué construiría:</b> ${esc(p.que_construiria)}</div>` : "") +
              (p.refs.length ? `<div style="font-size:13px;margin-top:4px">${refLinks(p.refs)}</div>` : "") +
              `</div>`,
          )
          .join("");
  const sectionText = (title: string, pts: SynthPoint[]): string =>
    pts.length === 0
      ? ""
      : `\n${title.toUpperCase()}\n` +
        pts.map((p) => `* ${p.niche}: ${p.por_que}${p.que_construiria ? `\n  Qué construiría: ${p.que_construiria}` : ""}${p.refs.length ? `\n${refText(p.refs)}` : ""}`).join("\n");

  const top = niches.slice(0, 15);
  const tableHtml = top.length
    ? `<h2 style="font-size:16px;margin:24px 0 8px">Tabla de nichos (5 semanas)</h2>
<table style="border-collapse:collapse;font-size:13px;width:100%">
<tr style="text-align:left;border-bottom:1px solid #ccc"><th>Nicho</th><th>Semana</th><th>Momentum</th><th>Demanda</th><th>Oferta</th><th>Hueco</th><th>Rondas</th></tr>
${top
  .map(
    (n) =>
      `<tr style="border-bottom:1px solid #eee"><td style="font-family:ui-monospace,Menlo,monospace">${esc(n.niche)}${n.isNew ? " 🆕" : ""}</td><td>${n.thisWeek}</td><td>${n.momentum === 9.99 ? "nuevo" : n.momentum}</td><td>${n.demand}</td><td>${n.supply}</td><td><b>${n.whitespace}</b></td><td>${usd(n.fundingUsd)}</td></tr>`,
  )
  .join("\n")}
</table>
<p style="font-size:12px;color:#666">Hueco = demanda / (1 + oferta). Demanda = dolor×2 + investigación + adopción. Oferta = lanzamientos + rondas.</p>`
    : "";

  const titular = synth?.titular ?? "Radar de Physical AI — solo números (sin síntesis esta semana)";
  const lectura = synth?.lectura ? synth.lectura.split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join("") : "";
  const preguntas = synth?.preguntas.length
    ? `<h2 style="font-size:16px;margin:24px 0 8px">Para mirar la semana que viene</h2><ul>${synth.preguntas.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>`
    : "";
  const footer = `<p style="font-size:12px;color:#666;margin-top:28px">${stats.items} ítems nuevos de ${stats.sources} fuentes · gasto del mes en Claude: USD ${stats.spendMonth.toFixed(2)} · physical-ai-radar (solo escucha)</p>`;

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:680px;color:#1a1a1a;line-height:1.45">
<div style="font-size:12px;color:#666">Radar de Physical AI · ${esc(week)}</div>
<h1 style="font-size:20px;margin:6px 0 12px">${esc(titular)}</h1>
${lectura}
${section("Huecos (demanda sin oferta)", synth?.huecos ?? [])}
${section("Calientes", synth?.calientes ?? [])}
${section("Emergentes", synth?.emergentes ?? [])}
${section("Saturados", synth?.saturados ?? [])}
${preguntas}
${tableHtml}
${footer}
</div>`;

  const text = [
    `Radar de Physical AI · ${week}`,
    titular,
    "",
    synth?.lectura ?? "",
    sectionText("Huecos (demanda sin oferta)", synth?.huecos ?? []),
    sectionText("Calientes", synth?.calientes ?? []),
    sectionText("Emergentes", synth?.emergentes ?? []),
    sectionText("Saturados", synth?.saturados ?? []),
    synth?.preguntas.length ? `\nPARA MIRAR\n${synth.preguntas.map((q) => `* ${q}`).join("\n")}` : "",
    top.length ? `\nNICHOS\n${top.map((n) => `${n.niche}: semana ${n.thisWeek}, hueco ${n.whitespace}, rondas ${usd(n.fundingUsd)}`).join("\n")}` : "",
    `\n${stats.items} ítems nuevos de ${stats.sources} fuentes · gasto del mes USD ${stats.spendMonth.toFixed(2)}`,
  ].join("\n");

  return { subject: `Radar Physical AI ${week}: ${titular}`.slice(0, 180), html, text };
}
