/**
 * Medidas que comparten el marco y las decoraciones sangradas.
 *
 * Estaban repetidas a mano en cada seccion; al vivir aqui, cambiar el padding
 * del marco ya no obliga a repasar seis bloques buscando el mismo `clamp`.
 */

/** Padding interior del Frame. Define el ancho util de cada seccion. */
export const FRAME_PADDING = "clamp(20px, 8vw, 85px)";

/** Padding vertical del body, entre el filo de la pantalla y el marco. */
export const BODY_PADDING_TOP = "clamp(24px, 8vw, 80px)";

/** Borde (3px) mas padding (2px) del marco exterior. */
const OUTER_FRAME_EDGE = "5px";

/** Padding horizontal del body. */
const BODY_PADDING_X = "16px";

/**
 * Desplazamiento negativo que lleva una decoracion desde el borde de la
 * seccion hasta el filo de la pantalla. Suma el padding del Frame, el del body
 * y el borde del marco exterior.
 *
 * Se evita `50vw` a proposito: incluye el ancho de la barra de scroll y
 * provocaba desbordamiento horizontal en escritorio.
 */
export const OUT = `calc(-1 * (${FRAME_PADDING} + 21px))`;

/** Distancia del borde superior de la primera seccion al filo de la pantalla,
 *  con un extra para que la decoracion quede cortada por arriba. */
export const OUT_TOP = `calc(-1 * (${BODY_PADDING_TOP} + ${FRAME_PADDING} + ${OUTER_FRAME_EDGE}) - clamp(50px, 14vw, 105px))`;

/** Variables listas para el atributo style de una seccion. */
export const SECTION_VARS = `--out: ${OUT};`;
export const SECTION_VARS_WITH_BLEED = `--bleed: ${FRAME_PADDING}; --out: ${OUT};`;
export const HERO_VARS = `--out: ${OUT}; --out-top: ${OUT_TOP};`;

/** Ancho del marco, usado tambien por el ancla de la transicion. */
export const FRAME_WIDTH = "min(750px, 100%)";
export const FRAME_WIDTH_INNER = `min(750px, calc(100% - ${BODY_PADDING_X} * 2))`;
