# Deploy — proyecto28.com + proyecto28.cl

The static frontend deploys to GitHub Pages (free) via the workflow at
`.github/workflows/deploy.yml`. The CMS deploys separately to Strapi Cloud
(`cms/README.md`).

---

## 1 · Frontend (GitHub Pages)

1. Enable Pages in repo settings:
   `Settings → Pages → Build and deployment → Source: GitHub Actions`.
2. Push to `main` — the workflow builds Vite and publishes `dist/` to Pages.
3. The `dist/CNAME` file contains **`proyecto28.com`** (primary domain).
4. After the first successful deploy, add the second domain:
   `Settings → Pages → Custom domain` will already show `proyecto28.com`.
   Below, GitHub lets you add `proyecto28.cl` as an additional verified domain
   (or you set up a DNS-level redirect — see step 3 below).

### DNS records you need to add

Both registrars (`.com` and `.cl`):

| Type  | Name              | Value                  |
|-------|-------------------|------------------------|
| A     | `@` (apex)        | `185.199.108.153`      |
| A     | `@` (apex)        | `185.199.109.153`      |
| A     | `@` (apex)        | `185.199.110.153`      |
| A     | `@` (apex)        | `185.199.111.153`      |
| AAAA  | `@` (apex)        | `2606:50c0:8000::153`  |
| AAAA  | `@` (apex)        | `2606:50c0:8001::153`  |
| AAAA  | `@` (apex)        | `2606:50c0:8002::153`  |
| AAAA  | `@` (apex)        | `2606:50c0:8003::153`  |
| CNAME | `www`             | `nitenacho.github.io`  |

Propagation can take up to 24 h. HTTPS auto-provisions once DNS resolves.

### Pointing both `.com` and `.cl` to the same site

Two simple options:

- **A. Two custom domains on one repo (recommended):**
  Add both `proyecto28.com` and `proyecto28.cl` to the repo's Pages settings.
  GitHub will serve content from either domain. The `CNAME` file picks the
  primary; the other domain returns the same content via the same hosting.

- **B. Redirect `.cl` → `.com` at the registrar:**
  Most Chilean registrars (NIC.cl, etc.) offer a "URL redirect" / "forwarding"
  feature. Set `proyecto28.cl` → `https://proyecto28.com` (301 permanent).
  Simpler if you want a single canonical URL.

---

## 2 · CMS (Strapi Cloud)

See [`cms/README.md`](cms/README.md). After it's running:

1. Copy the cloud project's public URL (e.g. `https://something.strapiapp.com`).
2. In the GitHub repo: `Settings → Secrets and variables → Actions →
   New repository secret` → name `VITE_CMS_URL`, value the URL above.
3. Re-run the deploy workflow.

The frontend will start fetching content from Strapi. If the CMS goes down or
the secret isn't set, the site silently falls back to the static data in
`src/data/fallback.js`.

---

## 3 · Pixel Streaming (Etapa 11)

El frontend de GitHub Pages no ejecuta Unreal ni WebRTC propio. Sólo monta un
iframe sobre el cubo activo cuando Strapi entrega una URL externa válida.

Infra mínima esperada:

1. Servidor GPU separado con Unreal empaquetado en modo Pixel Streaming.
2. Signaling Server oficial de Epic expuesto por HTTPS.
3. Subdominio recomendado: `stream.proyecto28.com`.
4. Certificado TLS válido, idealmente Let's Encrypt.
5. La URL debe abrir desde un navegador externo antes de conectarla a Strapi.

DNS recomendado en Cloudflare:

| Type  | Name     | Value |
|-------|----------|-------|
| A     | `stream` | IP publica del servidor GPU |
| CNAME | `stream` | host del proveedor, si aplica |

Usa **A** o **CNAME**, no ambos para el mismo nombre.

Configuración en Strapi:

1. En `SiteSetting`, activar `pixelStreamingEnabled`.
2. Mantener `pixelStreamingMode = shared` para la primera versión.
3. En cada Project que deba usar stream:
   - `unrealEnabled = true`
   - `unrealStreamURL = https://stream.proyecto28.com` o URL equivalente
   - `unrealLevelName = <nombre Level/SubLevel>`

El frontend envía al iframe el mensaje:

```json
{
  "command": "showProject",
  "projectId": "028.A",
  "unrealLevelName": "Level_028_A",
  "mode": "shared"
}
```

El player o la página contenedora del Pixel Streaming debe traducir ese mensaje
a `emitUIInteraction` para que Unreal cambie Level/SubLevel.

QA local:

```text
http://127.0.0.1:<vite-port>/?streamPreview=028.A
http://127.0.0.1:<vite-port>/?streamPreview=028.A&streamPreviewUrl=http://127.0.0.1:<vite-port>/dev/pixel-stream-mock.html
```
