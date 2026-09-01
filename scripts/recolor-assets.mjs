/**
 * Repinta las decoraciones en la paleta de la invitacion.
 *
 *   pnpm run assets            # usa la paleta de config/invitation.ts
 *   pnpm run assets -- azul    # fuerza otra paleta
 *
 * Por que hace falta: la paleta CSS retinta textos, botones y trazos, pero el
 * color de las flores, mariposas, la corona y el sobre esta dentro del pixel.
 * Sin este paso, cambiar de paleta deja las decoraciones moradas.
 *
 * Escribe UNA sola carpeta, src/Images/theme/, con nombres neutros. Es a
 * proposito que no se guarde una carpeta por paleta: lib/assets.ts las
 * importa con import.meta.glob, y tener seis juegos metia los seis en el
 * build (14.8 MB en vez de 9).
 */
import { readFile, writeFile, mkdir, rm, access, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { makeRecolor, hexToRgb, rgbToHex } from "./lib/color.mjs";
import { palettes } from "../src/config/palettes.ts";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const IMAGENES = join(raiz, "src", "Images");

/** La paleta en la que estan pintados los archivos originales. */
const ORIGEN = palettes.lila;

/** Archivo original -> nombre neutro con el que se usara en el codigo. */
const ASSETS = [
  ["corona_morada.webp", "corona"],
  ["carta_morada.webp", "carta"],
  ["mariposas_moradas.webp", "mariposas"],
  ["flor_vectorial_morada.svg", "flor"],
  ["rama_morada.svg", "rama"],
  ["rosas_moradas.svg", "rosas"],
  ["globos_morados.svg", "globos"],
  ["mariposa_morada.svg", "mariposa"],
  ["mariposas_silueta.svg", "mariposas-silueta"],
  ["saco.png", "saco"],
  ["vestido.png", "vestido"],
  ["decor.png", "decor"],
];

/** Recolorea los pixeles de un buffer de imagen conservando el alfa. */
async function recolorearRaster(buffer, recolor, formato) {
  const img = sharp(buffer).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue; // pixel transparente: no tiene color que rotar
    const [r, g, b] = recolor([data[i], data[i + 1], data[i + 2]]);
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
  const salida = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  return formato === "png"
    ? salida.png({ compressionLevel: 9 }).toBuffer()
    : salida.webp({ quality: 90, effort: 5 }).toBuffer();
}

/**
 * Recolorea un SVG.
 *
 * Solo toca valores que son de verdad un color. Los identificadores de
 * clip-path de este proyecto tienen forma hexadecimal (url(#a6fc157d5f)), asi
 * que un reemplazo global de "#rrggbb" rompeaba las referencias y borraba
 * medio dibujo.
 */
async function recolorearSvg(texto, recolor) {
  const comoHex = (hex) => rgbToHex(recolor(hexToRgb(hex)));

  let salida = texto.replace(
    /((?:fill|stroke|stop-color|flood-color|lighting-color)\s*[=:]\s*"?)(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\b/g,
    (_, prefijo, hex) => prefijo + comoHex(hex),
  );

  // Algunos SVG son solo la envoltura de un PNG incrustado en base64.
  const incrustada = /(<image[^>]*?(?:xlink:href|href)=")data:image\/(png|jpeg|webp);base64,([^"]+)(")/g;
  const trozos = [...salida.matchAll(incrustada)];
  for (const t of trozos) {
    // Se reencoda en WebP y no en PNG: estos dibujos son acuarelas de miles de
    // tonos, y en PNG el mismo contenido pesaba siete veces mas.
    const nuevo = await recolorearRaster(Buffer.from(t[3], "base64"), recolor, "webp");
    salida = salida.replace(t[0], t[1] + "data:image/webp;base64," + nuevo.toString("base64") + t[4]);
  }
  return { svg: salida, incrustadas: trozos.length };
}

async function generar(nombrePaleta) {
  const destino = palettes[nombrePaleta];
  if (!destino) {
    console.error(`Paleta desconocida: "${nombrePaleta}". Hay: ${Object.keys(palettes).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  // Repintar a la propia paleta de origen no cambia ningun pixel, pero
  // reencodar el WebP si: se copia tal cual para no perder calidad en cada
  // pasada.
  const identidad = destino.accent.toLowerCase() === ORIGEN.accent.toLowerCase();
  const recolor = makeRecolor(ORIGEN.accent, destino.accent);
  const carpeta = join(IMAGENES, "theme");
  await rm(carpeta, { recursive: true, force: true });
  await mkdir(carpeta, { recursive: true });

  console.log(`\n${nombrePaleta}: ${ORIGEN.accent} -> ${destino.accent}`);
  for (const [origen, neutro] of ASSETS) {
    const ext = origen.split(".").pop().toLowerCase();
    const entrada = join(IMAGENES, origen);
    const salida = join(carpeta, `${neutro}.${ext}`);
    try {
      if (identidad) {
        await copyFile(entrada, salida);
        console.log(`  ${neutro}.${ext} (copiado)`);
        continue;
      }
      if (ext === "svg") {
        const { svg, incrustadas } = await recolorearSvg(await readFile(entrada, "utf8"), recolor);
        await writeFile(salida, svg, "utf8");
        console.log(`  ${neutro}.svg${incrustadas ? `  (${incrustadas} raster incrustado)` : ""}`);
      } else {
        const buf = await recolorearRaster(await readFile(entrada), recolor, ext === "png" ? "png" : "webp");
        await writeFile(salida, buf);
        console.log(`  ${neutro}.${ext}`);
      }
    } catch (err) {
      console.error(`  FALLO ${origen}: ${err.message}`);
      process.exitCode = 1;
    }
  }
}

/**
 * Lee el nombre de la paleta de la configuracion.
 *
 * Se lee el texto en vez de importar el modulo a proposito: config/invitation
 * importa las fotos (.jpeg), y Node no sabe resolver eso fuera de Astro.
 */
async function paletaDeLaConfig() {
  const texto = await readFile(join(raiz, "src", "config", "invitation.ts"), "utf8");
  return texto.match(/palette:\s*palettes\.(\w+)/)?.[1];
}

// Sin argumento se usa la paleta de la invitacion, que es lo que evita que las
// decoraciones y el CSS acaben en gamas distintas.
const argumentos = process.argv.slice(2);
const forzar = argumentos.includes("--force");
const activa = argumentos.find((a) => !a.startsWith("--")) ?? (await paletaDeLaConfig());

/** true si la carpeta ya contiene el juego pedido y no falta ningun archivo. */
async function yaGenerado(nombre) {
  try {
    const meta = JSON.parse(await readFile(join(IMAGENES, "theme", "theme.json"), "utf8"));
    if (meta.palette !== nombre) return false;
    for (const [origen, neutro] of ASSETS) {
      await access(join(IMAGENES, "theme", `${neutro}.${origen.split(".").pop().toLowerCase()}`));
    }
    return true;
  } catch {
    return false;
  }
}

if (!activa) {
  console.error(
    "No se pudo deducir la paleta: la invitacion usa una escrita a mano. " +
      `Indica en cual repintar: pnpm run assets -- <${Object.keys(palettes).join("|")}>`,
  );
  process.exitCode = 1;
} else if (!forzar && (await yaGenerado(activa))) {
  // `pnpm run build` llama a este script siempre; sin este atajo repintaria
  // doce imagenes en cada compilacion.
  console.log(`Decoraciones ya repintadas en "${activa}".`);
} else {
  await generar(activa);
  if (!process.exitCode) {
    await writeFile(
      join(IMAGENES, "theme", "theme.json"),
      JSON.stringify({ palette: activa }, null, 2),
    );
    console.log(`Listo: src/Images/theme/ contiene el juego "${activa}".`);
  }
}
