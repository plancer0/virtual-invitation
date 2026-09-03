/**
 * Compara dos builds y falla si el CSS generado no es identico en valor.
 *
 * Uso: node scripts/css-identity.mjs <distA> <distB>
 *
 * Por que hace falta: convertir un literal clamp(...) en un token --text-x o
 * --spacing-x no debe cambiar ningun valor calculado. Esto expande cada
 * var(--text-x)/var(--spacing-x) contra su valor en :root y compara el CSS
 * ya "resuelto" de los dos builds: diff vacio = ningun estilo cambio. Sin
 * dependencias nuevas: node:fs puro, como recolor-assets.mjs.
 *
 * Limite honesto, y hay que tenerlo presente: compara el conjunto de
 * declaraciones, no que elemento recibe cual. Detecta un valor cambiado,
 * perdido o duplicado; NO detecta el valor correcto aplicado al elemento
 * equivocado. Para eso hace falta medir estilos computados en el navegador a
 * los cinco anchos (ver design.md D6). Este script es la comprobacion barata
 * que corre en cada build; el navegador es la prueba.
 *
 * Tampoco ve atributos de clase ni estilos inline.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Corta con un mensaje claro: el fallo peligroso es reportar "identico"
 *  sin haber podido leer el CSS de verdad, asi que nunca sigue de largo. */
function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

/** Valida que `dist` exista, sea carpeta, y devuelve sus .css bajo _astro/. */
function cssFiles(dist) {
  let stat;
  try {
    stat = statSync(dist);
  } catch {
    fail(`la ruta no existe: ${dist}`);
    return [];
  }
  if (!stat.isDirectory()) {
    fail(`la ruta no es una carpeta: ${dist}`);
    return [];
  }
  const astroDir = join(dist, "_astro");
  let entries;
  try {
    entries = readdirSync(astroDir);
  } catch {
    fail(`no existe ${astroDir} (¿se corrio "pnpm run build"?)`);
    return [];
  }
  const files = entries.filter((f) => f.endsWith(".css")).map((f) => join(astroDir, f));
  if (files.length === 0) fail(`no se encontro ningun .css en ${astroDir}`);
  return files;
}

/** Junta todos los `--nombre: valor;` del CSS, sea cual sea el selector. */
function customProperties(css) {
  const vars = new Map();
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars.set(m[1], m[2].trim());
  return vars;
}

/** Expande var(--text-*) / var(--spacing-*) contra su valor en :root. */
function expandTokens(value, vars) {
  let prev;
  let out = value;
  let guard = 0;
  do {
    prev = out;
    out = out.replace(/var\((--(?:text|spacing)-[\w-]+)\)/g, (match, name) =>
      vars.has(name) ? vars.get(name) : match,
    );
  } while (out !== prev && ++guard < 10);
  return out;
}

/**
 * Cuenta cuantas veces aparece cada declaracion en un dist, con los tokens ya
 * expandidos y SIN mirar el selector.
 *
 * Ignorar el selector no es dejadez, es la unica forma de que esto sirva. La
 * primera version comparaba "selector{decls}" y fallaba en su unico caso de
 * uso: al tokenizar, el nombre de la clase cambia por definicion (de la
 * utilidad con el valor entre corchetes a la utilidad con el nombre del
 * token), asi que la regla nunca casaba aunque las declaraciones fueran
 * identicas.
 *
 * Ojo al escribir estos comentarios: Tailwind 4 escanea todo el repo salvo
 * lo que ignora git, incluido scripts/. Un nombre de clase citado literalmente
 * aqui se convierte en CSS de verdad y ensucia la comparacion.
 *
 * Se cuenta, no se agrupa en un conjunto: si una migracion pierde u
 * duplica una declaracion, el conteo lo delata.
 *
 * Las definiciones de --text-* y --spacing-* se excluyen porque son nuevas a
 * proposito. El resto de variables (--color-*, etc.) si se compara: cambiar
 * --color-ink debe seguir saltando.
 *
 * El regex solo captura bloques sin llaves anidadas, asi que ignora los
 * `@layer`/`@media` que los envuelven y llega directo a la regla real.
 */
function declarationCounts(dist) {
  const css = cssFiles(dist).map((f) => readFileSync(f, "utf8")).join("\n");
  const vars = customProperties(css);
  const counts = new Map();
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const raw of m[2].split(";")) {
      const decl = raw.trim();
      if (!decl) continue;
      const i = decl.indexOf(":");
      if (i === -1) continue;
      const prop = decl.slice(0, i).trim();
      if (/^--(?:text|spacing)-/.test(prop)) continue;
      // Tailwind escribe `clamp(13px, 3.6vw, 16px)` donde la clase decia
      // `clamp(13px,3.6vw,16px)`: sin normalizar la coma, el mismo valor
      // parece dos valores distintos.
      const val = expandTokens(decl.slice(i + 1).trim(), vars)
        .replace(/\s+/g, " ")
        .replace(/,\s*/g, ",");
      const key = `${prop}:${val}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

/** Declaraciones cuyo numero de apariciones difiere entre los dos builds. */
function diff(a, b) {
  const out = [];
  for (const key of new Set([...a.keys(), ...b.keys()])) {
    const na = a.get(key) ?? 0;
    const nb = b.get(key) ?? 0;
    if (na !== nb) out.push({ key, na, nb });
  }
  return out.sort((x, y) => x.key.localeCompare(y.key));
}

const [, , distA, distB] = process.argv;
if (!distA || !distB) fail("uso: node scripts/css-identity.mjs <distA> <distB>");

const countsA = declarationCounts(distA);
const countsB = declarationCounts(distB);
const differences = diff(countsA, countsB);

const total = [...countsA.values()].reduce((n, v) => n + v, 0);

if (differences.length === 0) {
  console.log(`identico: ${total} declaraciones comparadas, ninguna diferencia.`);
} else {
  console.error(`DIFERENCIA: ${differences.length} declaracion(es)\n`);
  console.error(`  A = ${distA}`);
  console.error(`  B = ${distB}\n`);
  for (const { key, na, nb } of differences) console.error(`  A:${na}  B:${nb}   ${key}`);
  process.exit(1);
}
