import type { Palette, ResolvedPalette } from "../types/palette";

/** #rgb o #rrggbb -> [r, g, b] en 0-255. */
function toRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

/** Acerca un color al blanco. `amount` 0 = igual, 1 = blanco. */
function lighten(hex: string, amount: number): string {
  const [r, g, b] = toRgb(hex);
  return toHex([r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount]);
}

/** Luminancia relativa segun WCAG 2.1. */
function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razon de contraste WCAG entre dos colores, de 1 (iguales) a 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Rellena los campos opcionales de una paleta. */
export function resolvePalette(palette: Palette): ResolvedPalette {
  return {
    ...palette,
    onAccent: palette.onAccent ?? palette.base,
    photoFrame: palette.photoFrame ?? palette.detailSoft,
    accentSoft: palette.accentSoft ?? lighten(palette.accent, 0.35),
    polaroid: palette.polaroid ?? "#ffffff",
  };
}

/**
 * Avisa en consola durante el build si una paleta no se va a ver. Es el fallo
 * que mas veces ha aparecido en este proyecto: un tono decorativo demasiado
 * claro sobre el fondo desaparece, y en pantalla parece que la decoracion no
 * se dibujo. Los umbrales son los de WCAG 2.1 (4.5 para texto normal, 3 para
 * texto grande y elementos graficos).
 */
export function checkPalette(palette: ResolvedPalette, label = "paleta"): string[] {
  const checks: [string, string, string, number][] = [
    ["ink", palette.ink, palette.base, 4.5],
    ["accent", palette.accent, palette.base, 3],
    ["detail", palette.detail, palette.base, 1.6],
    ["onAccent", palette.onAccent, palette.accent, 4.5],
  ];
  return checks
    .filter(([, fg, bg, min]) => contrastRatio(fg, bg) < min)
    .map(
      ([name, fg, bg, min]) =>
        `[${label}] "${name}" (${fg}) contrasta ${contrastRatio(fg, bg).toFixed(2)}:1 ` +
        `sobre ${bg}; se recomienda al menos ${min}:1.`,
    );
}

/** Convierte la paleta en el `style` que se pone en el <html>. */
export function paletteToStyle(palette: Palette): string {
  const p = resolvePalette(palette);
  return [
    `--color-base:${p.base}`,
    `--color-ink:${p.ink}`,
    `--color-accent:${p.accent}`,
    `--color-detail:${p.detail}`,
    `--color-detail-soft:${p.detailSoft}`,
    `--color-on-accent:${p.onAccent}`,
    `--color-photo-frame:${p.photoFrame}`,
    `--color-accent-soft:${p.accentSoft}`,
    `--color-polaroid:${p.polaroid}`,
  ].join(";");
}
