# Mi invitación

Proyecto generado a partir del starter "clasica" de `@invitacion/ui`.

## Dependencia de la librería

Este `package.json` depende de `@invitacion/ui` como `workspace:*`, que solo
resuelve dentro del monorepo donde vive la librería. Si este proyecto se saca
a un repositorio propio (standalone), cambia esa línea por una dependencia de
git, por ejemplo:

```
"@invitacion/ui": "github:plancer0/invitacion-ui#v1.0.0"
```

La distribución definitiva de la librería (paquete propio, git tag, etc.)
todavía no está decidida — este es el punto exacto del `package.json` a tocar
cuando se decida.

## Próximos pasos

1. Agrega tus fotos reales en `src/Images/` (reemplaza los 4 placeholders).
2. Copia tu canción de fondo a `public/audio/cancion.mp3`.
3. Edita `src/config/invitation.ts` y `src/lib/event.ts` con los datos reales.
4. `pnpm install`
5. `pnpm run build`
