import type { Palette } from "../types/palette";

/**
 * Paletas listas para usar. Una invitacion elige una en `config/invitation.ts`,
 * o define la suya a mano: el tipo `Palette` acepta cualquier combinacion.
 *
 * Todas siguen la misma estructura, que es lo que hace que el diseno aguante
 * el cambio de gama: fondo muy claro y teñido, texto muy oscuro de la misma
 * familia, marca de tono medio, y dos claros para lo decorativo.
 *
 * Salvo `lila`, todas cumplen WCAG AA (4.5:1) tanto en el texto sobre el fondo
 * como en el texto sobre los botones. `lila` es la paleta original y se deja
 * tal cual se eligio: su texto sobre boton queda en 3.28:1. `pnpm run build`
 * lo avisa por consola.
 */
export const palettes = {
  /** La original: lila y morado. */
  lila: {
    base: "#E8E1EF",
    ink: "#403848",
    accent: "#8D6FAE",
    detail: "#b1a0c7",
    detailSoft: "#D8D3DD",
  },
  /** Rosa empolvado. */
  rosa: {
    base: "#F6E7EC",
    ink: "#4A2E38",
    accent: "#9B546C",
    detail: "#C99AAA",
    detailSoft: "#E6D7DC",
  },
  /** Verde salvia. */
  salvia: {
    base: "#E4EBE4",
    ink: "#33413A",
    accent: "#536F5A",
    detail: "#9BB5A2",
    detailSoft: "#D5DED6",
  },
  /** Azul empolvado. */
  azul: {
    base: "#E2E8F1",
    ink: "#2E3A4C",
    accent: "#526988",
    detail: "#9FB0C7",
    detailSoft: "#D4DCE6",
  },
  /** Arena y dorado viejo. */
  arena: {
    base: "#F2EADF",
    ink: "#45392B",
    accent: "#836538",
    detail: "#C4A87C",
    detailSoft: "#E2D7C6",
  },
  /** Vino. */
  vino: {
    base: "#F0E4E6",
    ink: "#40252C",
    accent: "#8E4A5A",
    detail: "#C094A0",
    detailSoft: "#DFD0D4",
  },
} as const satisfies Record<string, Palette>;

export type PaletteName = keyof typeof palettes;
