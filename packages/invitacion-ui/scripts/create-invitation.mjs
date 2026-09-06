#!/usr/bin/env node
/**
 * Crea un proyecto de invitacion nuevo a partir de un starter de la libreria.
 *
 *   node packages/invitacion-ui/scripts/create-invitation.mjs <target-dir> [--nombre "Nombre"] [--starter clasica]
 *
 * Copia el starter elegido (por defecto "clasica") a <target-dir>, renombra
 * su "gitignore" a ".gitignore" (sin el punto en el repo para que Git no lo
 * trate como propio del starter), sustituye el nombre en la configuracion si
 * se paso --nombre, y genera cuatro fotos de relleno para que el proyecto
 * compile antes de que lleguen las fotos reales.
 *
 * Nunca sobrescribe un directorio destino que ya tenga contenido: esa es la
 * unica conducta de este script que no puede fallar.
 */
import { access, constants, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(SCRIPT_DIR, "..");
const STARTERS_DIR = join(PACKAGE_ROOT, "starters");

/** Tintes planos para las cuatro fotos de relleno. Solo existen para que el
 *  proyecto compile antes de que lleguen las fotos reales. */
const PLACEHOLDER_TINTS = [
  { r: 216, g: 211, b: 221 }, // lila claro
  { r: 201, g: 154, b: 170 }, // rosa empolvado
  { r: 155, g: 181, b: 162 }, // salvia
  { r: 196, g: 168, b: 124 }, // arena
];

const PLACEHOLDER_WIDTH = 900;
const PLACEHOLDER_HEIGHT = 1200;

function printUsageAndExit(message) {
  if (message) console.error(`Error: ${message}`);
  console.error(
    "\nUso: node packages/invitacion-ui/scripts/create-invitation.mjs <target-dir> " +
      '[--nombre "Nombre"] [--starter clasica]',
  );
  process.exitCode = 1;
}

function parseArgs(argv) {
  const positional = [];
  let name;
  let starter = "clasica";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--nombre") {
      name = argv[++i];
    } else if (arg === "--starter") {
      starter = argv[++i];
    } else if (!arg.startsWith("--")) {
      positional.push(arg);
    }
  }

  return { targetDir: positional[0], name, starter };
}

/** true si el directorio no existe todavia, o existe pero esta vacio. */
async function isEmptyOrMissing(targetPath) {
  try {
    const entries = await readdir(targetPath);
    return entries.length === 0;
  } catch (err) {
    if (err.code === "ENOENT") return true;
    throw err;
  }
}

/** Copia recursiva de un starter, renombrando "gitignore" a ".gitignore". */
async function copyStarter(sourceDir, targetDir) {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name);
    const destName = entry.name === "gitignore" ? ".gitignore" : entry.name;
    const destPath = join(targetDir, destName);

    if (entry.isDirectory()) {
      await copyStarter(sourcePath, destPath);
    } else {
      await mkdir(dirname(destPath), { recursive: true });
      const content = await readFile(sourcePath);
      await writeFile(destPath, content);
    }
  }
}

/** Sustituye el nombre de relleno en config/invitation.ts por el nombre dado. */
async function applyName(targetDir, name) {
  const configPath = join(targetDir, "src", "config", "invitation.ts");
  const original = await readFile(configPath, "utf8");
  const escaped = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const updated = original.replace(/name:\s*"Nombre"/, `name: "${escaped}"`);

  if (updated === original) {
    console.warn(
      '  Aviso: no se encontro el marcador de nombre ("Nombre") en config/invitation.ts; ' +
        "no se hizo ninguna sustitucion.",
    );
    return;
  }
  await writeFile(configPath, updated, "utf8");
}

/** Genera cuatro fotos de relleno (tintes planos) en src/Images/. */
async function generatePlaceholderPhotos(targetDir) {
  const imagesDir = join(targetDir, "src", "Images");
  await mkdir(imagesDir, { recursive: true });

  for (let i = 0; i < PLACEHOLDER_TINTS.length; i++) {
    const background = PLACEHOLDER_TINTS[i];
    const outputPath = join(imagesDir, `${i + 1}.jpeg`);
    await sharp({
      create: {
        width: PLACEHOLDER_WIDTH,
        height: PLACEHOLDER_HEIGHT,
        channels: 3,
        background,
      },
    })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
  }

  // El .gitkeep solo existia para que Git conservara la carpeta vacia en el
  // starter; ya sobra en cuanto hay fotos reales dentro.
  await rm(join(imagesDir, ".gitkeep"), { force: true });
}

async function main() {
  const { targetDir: targetDirArg, name, starter } = parseArgs(process.argv.slice(2));

  if (!targetDirArg) {
    printUsageAndExit("falta el directorio destino.");
    return;
  }

  const starterDir = join(STARTERS_DIR, starter);
  if (!(await access(starterDir, constants.F_OK).then(() => true).catch(() => false))) {
    const disponibles = await readdir(STARTERS_DIR);
    printUsageAndExit(
      `no existe el starter "${starter}". Disponibles: ${disponibles.join(", ")}.`,
    );
    return;
  }

  const targetDir = resolve(process.cwd(), targetDirArg);

  // Un archivo existente en vez de un directorio tambien es un destino invalido.
  const targetStat = await stat(targetDir).catch(() => undefined);
  if (targetStat && !targetStat.isDirectory()) {
    printUsageAndExit(`"${targetDir}" ya existe y no es un directorio.`);
    return;
  }

  if (!(await isEmptyOrMissing(targetDir))) {
    printUsageAndExit(
      `"${targetDir}" ya existe y no esta vacio. Elige otro destino: este script ` +
        "nunca sobrescribe un proyecto existente.",
    );
    return;
  }

  console.log(`Creando invitacion en "${targetDir}" a partir del starter "${starter}"...`);
  await copyStarter(starterDir, targetDir);

  if (name) {
    await applyName(targetDir, name);
    console.log(`  Nombre "${name}" aplicado en src/config/invitation.ts.`);
  }

  await generatePlaceholderPhotos(targetDir);
  console.log("  Cuatro fotos de relleno generadas en src/Images/.");

  console.log(
    "\nListo. Proximos pasos:\n" +
      "  1. Agrega tus fotos reales en src/Images/ (reemplaza los 4 placeholders).\n" +
      "  2. Copia tu cancion de fondo a public/audio/cancion.mp3.\n" +
      "  3. Edita src/config/invitation.ts y src/lib/event.ts con los datos reales.\n" +
      "  4. Instala las dependencias: pnpm install\n" +
      "  5. Compila el proyecto: pnpm run build\n",
  );
}

await main();
