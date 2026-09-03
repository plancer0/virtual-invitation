## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Color

Ningun color se escribe suelto en los componentes. Todo sale de la paleta.

Para cambiar la gama de una invitacion basta con una linea en
`src/config/invitation.ts`:

```ts
palette: palettes.salvia,   // lila | rosa | salvia | azul | arena | vino
```

y despues `pnpm run assets`, que repinta las decoraciones. `pnpm run build` ya
lo hace por su cuenta.

### Como funciona

- `src/config/palettes.ts` — las paletas listas. Una paleta son cinco colores
  (`base`, `ink`, `accent`, `detail`, `detailSoft`); los otros cuatro se
  deducen en `resolvePalette`. Tambien vale escribir el objeto a mano en la
  configuracion en vez de usar una con nombre.
- `src/layouts/base.layout.astro` — vuelca la paleta como variables CSS en el
  `<html>`. Como las utilidades de Tailwind compilan a `var(--color-*)`, eso
  retinta la pagina entera.
- `src/styles/global.css` — el bloque `@theme` define los valores por defecto y
  genera las utilidades (`text-ink`, `bg-accent`, `border-detail`...).
- `scripts/recolor-assets.mjs` — repinta flores, mariposas, corona y sobre a
  `src/Images/theme/`. Hace falta porque en esos archivos el color esta dentro
  del pixel, no en el CSS.
- `src/lib/assets.ts` — resuelve `asset("corona")` a la version de la paleta
  activa.

### Cosas que ya salieron mal

- **Contraste.** Los tonos claros de estas gamas rondan 1.2-1.9 sobre el fondo
  y desaparecen. `pnpm run build` avisa por consola cuando una paleta no llega
  a los umbrales de WCAG. La paleta `lila` tiene un aviso conocido: el texto
  sobre los botones queda en 3.28:1, por debajo del 4.5 de AA.
- **Un solo juego de decoraciones.** `src/Images/theme/` guarda solo la paleta
  activa. Tener las seis a la vez metia las seis en el build (14.8 MB en vez
  de 9.2).
- **No todo lo morado es de la paleta.** La corona es dorada con morado. El
  script solo mueve los tonos de la familia del color de origen; una rotacion
  uniforme dejaba el oro azul.
- **Los hex de los SVG no siempre son colores.** Los `clip-path` de estos
  archivos tienen forma hexadecimal (`url(#a6fc157d5f)`). Un reemplazo global
  de `#rrggbb` rompe las referencias.

## Typography

Ningun tamano de fuente se escribe suelto en un `<Title>`. El resto de
call sites que aun usan un valor `clamp()` arbitrario son residuo temporal
documentado, no un descuido — ver "Cosas que ya salieron mal" abajo.

### Regla de nombrado

Un token se nombra por su propiedad mas estable, no por su tamano en pixeles:
la pregunta es *"puede este nombre convertirse en mentira?"*. Un ordinal
(`text-1`, `text-2`...) miente en cuanto se inserta un escalon nuevo entre dos
existentes; un rol tipografico (`body`, `title`) sobrevive a un reescalado
completo de la escala. Es la misma regla que ya sigue el color (`--color-ink`,
no `--color-purple`), aplicada a un eje distinto.

### Como funciona

- `src/styles/global.css` — el bloque `@theme` define los 15 tokens
  `--text-*` y genera las utilidades correspondientes (`text-body`,
  `text-title`...).
- `src/types/typography.ts` — `TextToken` es la union cerrada con los 15
  nombres; `TitleSize` la reexporta para `Title`.
- `src/lib/typography.ts` — `TITLE_SIZE_CLASS` traduce cada token a su clase
  de Tailwind. Mismo patron que `src/lib/palette.ts`.
- `Title` recibe `size?: TitleSize` (no `fontSize` de texto libre) y aplica el
  tamano via `class:list`, nunca via `define:vars`: una utilidad de Tailwind
  gana la especificidad frente a cualquier clase extra que pase el
  llamador, y una variable inline no.

| Token | Valor | Rol |
|---|---|---|
| `caption` | `clamp(11px, 3vw, 14px)` | Leyendas, aclaraciones |
| `body` | `clamp(13px, 3.6vw, 16px)` | Texto corrido |
| `lead` | `clamp(15px, 4.4vw, 26px)` | Subtitulo de portada |
| `subtitle` | `clamp(18px, 5vw, 24px)` | Encabezado de calendario |
| `subtitle-alt` | `clamp(18px, 4.6vw, 24px)` | Candidato a fusion de Stage 2 con `subtitle` |
| `emphasis` | `clamp(20px, 5vw, 28px)` | Encabezados de tarjeta |
| `figure` | `clamp(22px, 7vw, 36px)` | Cifras de la cuenta atras |
| `title` | `clamp(24px, 6vw, 40px)` | Titulo de seccion |
| `title-alt` | `clamp(28px, 7vw, 40px)` | Candidato a fusion de Stage 2 con `title` |
| `title-lg` | `clamp(26px, 8vw, 64px)` | Titulo de seccion en Mea Culpa |
| `heading` | `clamp(40px, 11vw, 88px)` | Titulo de cierre |
| `name` | `clamp(48px, 16vw, 128px)` | Nombre en una seccion interior |
| `name-lg` | `clamp(64px, 20vw, 170px)` | Nombre de portada |
| `body-lg` | `clamp(14px, 4vw, 18px)` | Texto corrido largo, un escalon sobre `body` |
| `display` | `clamp(72px, 22vw, 190px)` | El "15" de portada — fuera de la escala a proposito |

### Los dos tokens `-alt`

`subtitle-alt` y `title-alt` existen solo porque `Title` usa una union
*cerrada y total*: los dos sitios que los consumen (`details.section.astro`,
la sugerencia de codigo de vestimenta, y `hero.section.astro`, el "Mis 15
años") tenian un valor que difiere de `subtitle`/`title` en hasta 4px a 360px,
asi que fusionarlos en Stage 1 habria roto la invariante de "visualmente
identico". Son candidatos a fusion de Stage 2, no tokens permanentes: cuando
se apruebe esa fusion, desaparecen y la union se encoge, lo que convierte la
migracion en un error de compilacion en vez de un grep manual.

### Escape hatch

Un call site puede saltarse los tokens con un valor arbitrario de Tailwind
cuando de verdad es un caso unico (una decoracion, un ajuste optico puntual),
siempre que lleve al lado un comentario explicando por que ningun token
encaja. Un valor arbitrario sin ese comentario no pasa revision.

El unico caso vigente hoy: `rsvp-button.component.astro`, la variante
embebida del boton, usa `clamp(12px, 3.2vw, 15px)` como literal comentado.
Fusionarlo con `caption` costaria 1px a 360px, fuera del rango que aprobo el
usuario para esta ronda (0px en mobile, hasta 2px en desktop), asi que se
queda fuera de la escala a proposito en vez de forzar una fusion que rompe
esa cota.

### Fusiones aplicadas (Stage 2)

Estas fusiones cambian pixeles a proposito, dentro del rango que aprobo el
usuario (0px en mobile salvo una excepcion de +0.04px, hasta 2px en desktop):

| Literal fusionado | Token destino | Costo mobile | Costo desktop |
|---|---|---|---|
| `clamp(12px, 3.6vw, 16px)` (x2) | `body` | +0.04px | 0px |
| `clamp(13px, 3.6vw, 17px)` | `body` | 0px | -1px |
| `clamp(13px, 3.6vw, 18px)` | `body` | 0px | -2px |
| `clamp(11px, 3vw, 15px)` | `caption` | 0px | -1px |
| `clamp(20px, 5.2vw, 30px)` (x2) | `emphasis` | 0px / -0.3px | -2px |
| `clamp(14px, 4vw, 16px)` | `body-lg` | 0px | +2px |

Ahora mismo el repositorio tiene otros literales sin ese comentario
todavia: son residuo de Stage 1, que solo tokeniza por coincidencia exacta de
valor (nunca por parecido, para que un error de sustitucion sea estructuralmente
imposible). Un valor que no coincide con ninguno de los 15 tokens se queda
como literal a proposito, a la espera de Stage 2 o de un comentario que lo
justifique como caso unico permanente.

### Cosas que ya salieron mal

- **Un valor citado en la documentacion genera CSS de verdad.** Tailwind
  escanea todo el repositorio salvo lo que ignora git, `.md` incluidos. Citar
  el nombre completo de una clase de Tailwind en un documento de diseno o en
  un comentario basta para que aparezca en el CSS final, aunque ningun
  componente la use. Al escribir sobre una clase, se rompe el patron a
  proposito (espacio de mas, sin corchetes) para que no se pueda evaluar como
  candidato valido.
- **Una variable definida con `define:vars` no la ve ninguna comprobacion de
  CSS estatico.** El valor real vivia en un atributo `style` por instancia,
  invisible para cualquier script que solo lea los `.css` generados. Por eso
  `Title` aplica el tamano por clase y no por variable: mueve la evidencia a
  un sitio donde se puede comprobar.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
