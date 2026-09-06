import type { ImageMetadata } from "astro";

/**
 * Decoraciones en el color de la paleta activa.
 *
 * Todas salen de src/images/theme/, que genera `pnpm run assets` a partir de
 * los originales morados de src/images/. Aqui no se importa ningun original:
 * las importaciones estaticas se empaquetan aunque no se usen, y tener los dos
 * juegos metia 1 MB de decoraciones moradas en un sitio que ya no es morado.
 *
 * `pnpm run build` regenera la carpeta antes de compilar, asi que en una copia
 * recien clonada tampoco falta.
 */
const TEMA = import.meta.glob<{ default: ImageMetadata }>(
  "../images/theme/*.{webp,svg,png}",
  { eager: true },
);

/** Nombres con los que el resto del codigo pide una decoracion. */
export type AssetName =
  | "corona" | "carta" | "mariposas" | "flor" | "rama" | "rosas"
  | "globos" | "mariposa" | "mariposas-silueta" | "saco" | "vestido" | "decor";

const PORNOMBRE = new Map<string, ImageMetadata>(
  Object.entries(TEMA).map(([ruta, mod]) => {
    const archivo = ruta.split("/").pop()!;
    return [archivo.slice(0, archivo.lastIndexOf(".")), mod.default];
  }),
);

export function asset(nombre: AssetName): ImageMetadata {
  const encontrado = PORNOMBRE.get(nombre);
  if (!encontrado) {
    throw new Error(
      `Falta la decoracion "${nombre}" en src/images/theme/. Ejecuta: pnpm run assets`,
    );
  }
  return encontrado;
}
