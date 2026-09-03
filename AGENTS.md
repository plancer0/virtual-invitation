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

## Music

Playback starts inside the first pointer gesture, not by asking the browser for
autoplay. The `<audio>` lives in `base.layout.astro` with `transition:persist`
so it is the same element on both pages and the track never restarts.

Two traps, both of which cost real time:

- **`astro build` is not where a playback bug shows up.** Autoplay is disabled
  on `localhost` on purpose, so silence during development is expected, not the
  symptom. Reproduce against a deployed build, or flip that guard temporarily.
- **A rejected `play()` is swallowed.** The `.catch(() => {})` is deliberate —
  there is nothing useful to do about a refusal — but it means a failure leaves
  no trace at all. Instrument the catch before concluding anything.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
