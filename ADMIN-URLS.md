# URLs de administracion - Proyecto 28

> Ultima revision: 2026-05-29  
> Dominio canonico: https://proyecto28.com

Guarda este archivo como punto de partida para operar Proyecto 28. Las URLs de
consola requieren las cuentas del owner; no guardar passwords, tokens ni
secretos en este repo.

---

## Sitio publico y smoke test

- Produccion canonica: https://proyecto28.com
- Produccion con `www`: https://www.proyecto28.com
- GitHub Pages directo: https://nitenacho.github.io/Proyecto28/
- Robots: https://proyecto28.com/robots.txt
- Sitemap: https://proyecto28.com/sitemap.xml
- Dominio `.cl` pendiente de DNS/certificado: https://proyecto28.cl

## Strapi Cloud

- Strapi Cloud dashboard: https://cloud.strapi.io/
- Strapi app publica: https://honest-candy-800d1e4a92.strapiapp.com
- Strapi Admin: https://honest-candy-800d1e4a92.strapiapp.com/admin
- API Projects: https://honest-candy-800d1e4a92.strapiapp.com/api/projects?populate=*
- API SiteSetting: https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting
- API whitelist check `inconcha`: https://honest-candy-800d1e4a92.strapiapp.com/api/auth/check?email=inconcha@gmail.com
- API whitelist check `yk8arts`: https://honest-candy-800d1e4a92.strapiapp.com/api/auth/check?email=yk8arts@gmail.com
- API Admin whitelist publica: https://honest-candy-800d1e4a92.strapiapp.com/api/admin-whitelists

En Strapi Admin, editar desde `Content Manager`:

- `Project`: contenido de cubos, imagenes, modelos, links y streaming por proyecto.
- `Ajustes del sitio`: Tweaks persistidos, HUD, popup, juego, Admin y Pixel Streaming.
- `Admin whitelist`: correos autorizados para entrar al panel y publicar cambios.
- `Publish log`: auditoria de publicaciones desde Tweaks.

## GitHub

- Repo: https://github.com/nitenacho/Proyecto28
- Actions: https://github.com/nitenacho/Proyecto28/actions
- Deploy Pages workflow: https://github.com/nitenacho/Proyecto28/actions/workflows/deploy.yml
- Export/release assets workflow: https://github.com/nitenacho/Proyecto28/actions/workflows/sync-design.yml
- Auto-tag workflow: https://github.com/nitenacho/Proyecto28/actions/workflows/auto-tag.yml
- Releases: https://github.com/nitenacho/Proyecto28/releases
- Pages settings: https://github.com/nitenacho/Proyecto28/settings/pages
- Actions secrets: https://github.com/nitenacho/Proyecto28/settings/secrets/actions
- Environments: https://github.com/nitenacho/Proyecto28/settings/environments

## Google

- Google Cloud project dashboard: https://console.cloud.google.com/home/dashboard?project=spartan-grail-401816
- OAuth clients: https://console.cloud.google.com/auth/clients?project=spartan-grail-401816
- OAuth audience/test users: https://console.cloud.google.com/auth/audience?project=spartan-grail-401816
- API credentials: https://console.cloud.google.com/apis/credentials?project=spartan-grail-401816
- Google Doc handoff: https://docs.google.com/document/d/1Px4W6UA2tdE2WflTb-PpLhyRYpx0tG4Q1X2eWOq3vT0/edit

Google OAuth debe mantener estos correos como test users mientras el consent
screen este en Testing:

- `inconcha@gmail.com`
- `yk8arts@gmail.com`

## DNS y dominios

- Cloudflare dashboard: https://dash.cloudflare.com/
- Zone ID Cloudflare documentado: `fc59cb7669ebe62ff13ea1968c0d9796`
- NIC Chile: https://www.nic.cl/
- Portal clientes NIC Chile: https://clientes.nic.cl/

Registros esperados para GitHub Pages estan en `DEPLOY.md`. El dominio `.com`
es canonico; `.cl` sigue pendiente hasta corregir DNS/redirect/certificado.

## Pixel Streaming

- Endpoint recomendado del stream: https://stream.proyecto28.com
- Player mock local: http://127.0.0.1:5173/dev/pixel-stream-mock.html
- Preview fallback local: http://127.0.0.1:5173/?streamPreview=028.A
- Preview iframe local: http://127.0.0.1:5173/?streamPreview=028.A&streamPreviewUrl=http://127.0.0.1:5173/dev/pixel-stream-mock.html

El subdominio `stream.proyecto28.com` debe apuntar a la infraestructura GPU
externa cuando exista. Si no hay GPU o URL real, controlar la visibilidad desde
`Tweaks -> Streaming -> Preview visible`.

## Desarrollo local

- Frontend Vite: http://localhost:5173
- Frontend Vite alternativo: http://127.0.0.1:5173
- Strapi local: http://localhost:1337/admin

