# Demo corto - Proyecto 28

Objetivo: grabar un video de 1-2 minutos para adjuntar al release final.

## Guion recomendado

1. Abrir `https://proyecto28.com`.
2. Mostrar el boot 3D y mover la luz con mouse o WASD.
3. Activar un cubo y abrir el popup.
4. Mostrar navegacion por teclado:
   - `Tab` enfoca un cubo.
   - `Enter` abre detalle.
   - `Escape` cierra.
5. Entrar por `Admin` con una cuenta permitida.
6. Abrir `Tweaks`.
7. Mostrar `Streaming > Preview visible` ON/OFF.
8. Publicar un cambio menor o cancelar si no se quiere tocar produccion.
9. Cerrar con `robots.txt`, `sitemap.xml` y Strapi vivo si hace falta.

## Comando auxiliar

El repo incluye `scripts/record-demo.mjs`, que intenta capturar un WebM corto
desde el canvas WebGL usando Chrome headless:

```powershell
node scripts/record-demo.mjs "https://proyecto28.com" "docs/proyecto28-demo.webm"
```

Ese archivo no reemplaza una grabacion humana completa del flujo Admin/Tweaks,
pero sirve como asset tecnico reproducible para release.

## Subida a release

En tags `v*`, `.github/workflows/sync-design.yml` adjunta automaticamente al
GitHub Release:

- `claude-design-export.zip`
- `docs/architecture.png`, si existe
- `docs/proyecto28-demo.webm`, si existe

Si el asset se graba despues del tag, subirlo manualmente con una sesion GitHub
autenticada:

```powershell
gh release upload vX.Y.Z docs/proyecto28-demo.webm docs/architecture.png --clobber
```
