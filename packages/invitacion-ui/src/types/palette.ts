/**
 * Una paleta define TODO el color de la invitacion. Las utilidades de Tailwind
 * compilan a `var(--color-*)`, asi que sobreescribir esas variables en el
 * <html> retinta la pagina entera sin tocar ningun componente.
 *
 * Solo los cinco primeros campos son obligatorios; el resto se deduce en
 * `resolvePalette` para que crear una paleta nueva sea elegir cinco colores.
 */
export interface Palette {
  /** Fondo de la pagina y del marco. El resto se juzga contra este color. */
  base: string;
  /** Texto corrido y titulos sobrios. Necesita >=4.5:1 sobre `base`. */
  ink: string;
  /** Color de marca: botones, cifras grandes, borde del marco y trazos que
   *  deben leerse. Necesita >=3:1 sobre `base`. */
  accent: string;
  /** Trazos decorativos (rombo, galones, ramas). No lleva texto, pero por
   *  debajo de ~2:1 sobre `base` deja de verse: ya paso dos veces. */
  detail: string;
  /** Rellenos y superficies tenues (celdas de la cuenta atras). */
  detailSoft: string;

  /** Texto sobre `accent`. Por defecto, `base`. */
  onAccent?: string;
  /** Hueco de la foto en la polaroid. Por defecto, `detailSoft`. */
  photoFrame?: string;
  /** Reflejo claro sobre `accent` (barrido del dia del calendario).
   *  Por defecto, `accent` aclarado. */
  accentSoft?: string;
  /** Cartulina de la polaroid. Por defecto, blanco. */
  polaroid?: string;
}

/** Paleta con todos los huecos ya rellenos. */
export type ResolvedPalette = Required<Palette>;
