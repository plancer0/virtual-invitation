import type { TitleSize } from "../types/typography";

/**
 * Token -> clase de Tailwind que aplica ese tamano. Mismo patron que
 * `src/lib/palette.ts`: una tabla en vez de una funcion, porque no hay
 * ningun calculo que hacer, solo mapear un nombre cerrado a su clase.
 */
export const TITLE_SIZE_CLASS: Record<TitleSize, string> = {
  caption: "text-caption",
  body: "text-body",
  lead: "text-lead",
  subtitle: "text-subtitle",
  "subtitle-alt": "text-subtitle-alt",
  emphasis: "text-emphasis",
  figure: "text-figure",
  title: "text-title",
  "title-alt": "text-title-alt",
  "title-lg": "text-title-lg",
  heading: "text-heading",
  name: "text-name",
  "name-lg": "text-name-lg",
};
