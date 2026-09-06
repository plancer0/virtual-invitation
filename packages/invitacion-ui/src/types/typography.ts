/**
 * Escala tipografica: un rol por nombre, no un tamano. Mismo patron que
 * `src/types/palette.ts` aplica a color; ver AGENTS.md (regla D2) para el
 * criterio de nombrado: el nombre es la propiedad mas estable del valor.
 *
 * `subtitle-alt` y `title-alt` son candidatos a fusion de Stage 2 (ver
 * design.md, decision D4): existen porque `Title` necesita una union cerrada
 * y total sobre sus sitios de uso, y esos dos valores aun no encajan
 * exactamente en `subtitle`/`title`.
 */
export type TextToken =
  | "caption"
  | "body"
  | "lead"
  | "subtitle"
  | "subtitle-alt"
  | "emphasis"
  | "figure"
  | "title"
  | "title-alt"
  | "title-lg"
  | "heading"
  | "name"
  | "name-lg"
  | "body-lg"
  | "display";

/**
 * `Title` acepta cualquier token, no solo los que usa hoy: ya se usa para
 * todos los niveles de encabezado del sitio, y una union mas angosta
 * rechazaria un tamano legitimo sin ganar nada a cambio.
 */
export type TitleSize = TextToken;
