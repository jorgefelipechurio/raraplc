# physical-ai-radar

Agente de escucha en Cloudflare Workers que lee qué se publica sobre **Physical AI** (IA que percibe y actúa en el mundo físico) y manda cada lunes un mail con el **mapa de nichos de oportunidad**: dónde hay demanda sin oferta, qué se calienta, qué está saturado y qué aparece nuevo.

No es sobre PLCs: mira la capa de arriba (modelos, datos, simulación, hardware, plataformas, integración, seguridad, herramientas, modelos de negocio). Solo lee fuentes públicas; nunca publica ni responde.

## Cómo funciona

```
todos los días 07:00 ART                         lunes 08:30 ART
──────────────────────────                       ─────────────────────────────────────
10 feeds RSS/Atom ──► filtro por palabras ──►    D1: métricas por nicho (5 semanas)
  (sin costo de Claude)          │                  demanda, oferta, hueco, momentum
                                 ▼                            │
                    D1 findings (pending)                     ▼
                                 │               Sonnet 5.5 lee números + evidencia
                                 ▼                 → huecos, calientes, emergentes,
                Haiku 5.5 clasifica en lotes         saturados, preguntas
                capa · vertical · señal · nicho               │
                monto · actores · dolor · resumen             ▼
                                                 mail (Cloudflare Email Service)
                                                 + copia en /digest/latest
```

**Ejes fijos** (`src/taxonomy.ts`): 10 capas de la pila, 12 verticales y 8 tipos de señal (financiación, lanzamiento, investigación, adopción, dolor, regulación, alianza, tendencia).
**Nicho**: etiqueta libre en kebab-case que el modelo reutiliza entre corridas (se le pasan las 60 más usadas), así los nichos se consolidan solos.

**Métricas determinísticas** (el modelo las interpreta, no las inventa):

| Métrica | Fórmula |
|---|---|
| Demanda | dolor × 2 + investigación + adopción |
| Oferta | lanzamientos + rondas |
| Hueco | demanda / (1 + oferta) — alto = demanda que nadie cubre |
| Momentum | ítems de esta semana / promedio semanal de las 4 anteriores |

## Fuentes (verificadas el 30-oct-2026)

| Familia | Fuente | Filtro |
|---|---|---|
| Investigación | arXiv cs.RO (RSS) | estricto: VLA, world models, embodied, humanoides… |
| | Hugging Face blog | vocabulario Physical AI |
| | NVIDIA blog · Robotics | todo |
| | Google DeepMind blog | vocabulario Physical AI |
| Inversión | TechCrunch · Robotics | todo |
| | Crunchbase News | vocabulario Physical AI |
| | RoboticsTomorrow | vocabulario Physical AI |
| Análisis | IEEE Spectrum · Robotics | todo |
| | MIT Technology Review · AI | vocabulario Physical AI |
| | Import AI | vocabulario Physical AI |

Pendientes: The Robot Report (rechazó la lectura), arXiv API, blogs de Physical Intelligence / Figure / Skild / 1X sin RSS, Hacker News y GitHub.

## Presupuesto: USD 5/mes

Tres capas de tope en `wrangler.toml`: USD 5 al mes, USD 0,40 por día y USD 0,50 reservados para la síntesis de los lunes (la clasificación no puede comérsela). Si no alcanza para Sonnet, la síntesis baja a Haiku; si tampoco, el mail sale solo con números. Un mes típico (≈150 lotes de Haiku + 4 síntesis de Sonnet) cuesta menos de USD 1. Conviene además fijar un límite de gasto en la consola de Anthropic.

## Puesta en marcha

La base D1 `physical-ai-radar` ya está creada y con el esquema aplicado (`database_id` en `wrangler.toml`).

1. **Mail** (una sola vez, en el panel de Cloudflare):
   - Tener un dominio en Cloudflare DNS → *Compute → Email Service* → activar Email Routing.
   - Agregar tu casilla como *destination address* y confirmar el mail de verificación.
   - Poner en `FROM_ADDRESS` una dirección de ese dominio (p. ej. `radar@tudominio.com`).
2. **Secretos y deploy**:
   ```bash
   cd agents/physical-ai-radar
   npm install
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put READ_TOKEN      # cualquier cadena larga al azar
   npx wrangler secret put TO_ADDRESS      # tu casilla verificada
   npm test && npm run deploy
   ```
3. **Primera corrida** (no hace falta esperar al cron; la primera mira 14 días atrás):
   ```bash
   curl -X POST -H "Authorization: Bearer $READ_TOKEN" https://physical-ai-radar.<tu-subdominio>.workers.dev/run
   curl -X POST -H "Authorization: Bearer $READ_TOKEN" "https://physical-ai-radar.<tu-subdominio>.workers.dev/digest?force=1"
   ```

Sin dominio todavía, todo funciona igual: el digest queda en `/digest/latest?format=html`.

## Endpoints (todos con `Authorization: Bearer READ_TOKEN`, salvo `/health`)

| Método | Ruta | Qué devuelve |
|---|---|---|
| GET | `/health` | estado |
| GET | `/config` | fuentes, pendientes y taxonomía |
| GET | `/niches` | métricas por nicho (5 semanas) |
| GET | `/findings?niche=&min_relevance=2&limit=50` | evidencia clasificada |
| GET | `/digest/latest[?format=html]` | último digest |
| GET | `/budget`, `/runs` | gasto y corridas |
| POST | `/run` | escucha + clasificación ahora |
| POST | `/digest[?force=1]` | síntesis + mail ahora |

## Desarrollo

```bash
npm test          # parsers, validación de la salida del modelo, métricas, presupuesto, mail
npm run typecheck
```

Mismo diseño de base que `rara-market-research` (cursores por fuente, reintentos acotados, tope de subrequests del plan Free).
