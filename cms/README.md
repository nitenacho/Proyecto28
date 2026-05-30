# Proyecto28 — CMS (Strapi v5)

Headless CMS that owns the content shown in the frontend:

- **Project** (collection) — one entry per cube with popup
  - `slot` — fixed grid position (Rectangle 4–9)
  - `projectId`, `title`, `status`, `color` (cyan/copper)
  - `description`, `tags[]`
  - `image` — image shown inside the popup
  - `model3D` — `.glb` / `.gltf` floating above the cube on hover
  - `modelShape` — procedural fallback if no model3D is uploaded
  - `redirectURL` — link the "Explorar proyecto" button + cube click follow
  - **v2 (Etapa 2) fields:**
    - `unrealStreamURL` — Pixel Streaming signaling URL per cube
    - `unrealLevelName` — UE Level/SubLevel when using shared instance
    - `unrealEnabled` — toggle streaming for this cube
    - `popupImage` — separate image for the enhanced popup (Etapa 10)
    - `popupBody` — richtext markdown shown in the popup
    - `popupCTALabel` — text of the redirect button/area
    - `videoLoop` — optional looping video as alternative to UE stream
- **Site Setting** (singleton) — defaults for the Tweaks panel
  - logo, popup placement, tile style, camera tilt/yaw/drift, HUD toggles
  - **v2 (Etapa 2) fields:**
    - `gameLightSpeed`, `gameLightJumpHeight`, `gameLightJumpCount`,
      `gameLightGravity`, `gameLightVelocityCurve`, `gameMouseFollowDelay`,
      `gameFallDuration` — tweaks del juego de plataformas (Etapas 4–6)
    - `adminButtonVisible` — toggle del botón secreto bajo el logo
    - `pixelStreamingEnabled` — master switch global de streaming
    - `pixelStreamingPreviewEnabled` — muestra/oculta el preview fallback sobre el cubo
    - `pixelStreamingMode` — `shared` (1 instancia) vs. `per-cube`
- **Admin Whitelist** (collection, **privado**) — emails autorizados a usar
  el modo admin (Google OAuth + publicar tweaks). Seed: `inconcha@gmail.com`
  (owner) + `yk8arts@gmail.com` (editor). El bootstrap explícitamente DENIEGA
  permisos públicos sobre este content type.

The frontend talks to the public REST endpoints without an API token:

```
GET /api/site-setting
GET /api/projects?populate=*
```

`src/index.js` grants the Public role read access on first boot.

---

## Local development

```bash
cd cms
cp .env.example .env             # then fill in random secrets
npm install
npm run develop                  # admin at http://localhost:1337/admin
```

First boot:

- creates the admin user (you set the password through the web UI),
- seeds 6 sample projects + the Site Setting singleton (idempotent),
- grants Public read permissions for `/api/projects` and `/api/site-setting`.

SQLite file lives at `cms/.tmp/data.db` (gitignored).

### Heads-up: OneDrive on Windows

If `cms/` lives inside a OneDrive folder, run this once after cloning:

```powershell
pwsh -File scripts/unwrap-onedrive.ps1
```

OneDrive's "Files On-Demand" marks cloud-only files as reparse points, and
Strapi's loader skips files whose `Dirent.isFile()` returns false. The script
reads each file and writes the bytes back, forcing OneDrive to materialize
them locally so Strapi can read them as normal files.

---

## Deploy to Strapi Cloud

### 1 · Create the project

1. Sign in at https://cloud.strapi.io (GitHub OAuth — same account that owns
   `nitenacho/Proyecto28`).
2. **Create project** → connect repo `nitenacho/Proyecto28`.
3. Configure:
   - Branch: `main`
   - **Base directory: `cms`** ← important, the Strapi app lives in a sub-dir
   - Plan: Developer is enough to start (free trial available)
4. Click "Create" — Strapi Cloud provisions a Postgres DB and injects
   `DATABASE_URL` automatically.

### 2 · Set env vars on the Cloud project

In your Strapi Cloud project → **Settings → Variables**, paste these (these
secrets were generated for this project; rotate them anytime via
`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`):

```
APP_KEYS=CW3dCIkJ+NjWfysg9TdloQ==,+9itFc1KM8vZDXb+izc2BA==,w3Fdbl8kuIsNhs68edcscQ==,kVHiBc3GYJWR13V2lVPE4Q==
API_TOKEN_SALT=2KptZ9WFjwgpRmGl9y/OwpFT2nlp2bDJcxb0oygFva4=
ADMIN_JWT_SECRET=QELHf3xxDCvfNIYksgv5mEUQRgMdjELtx7WXIqGoObw=
TRANSFER_TOKEN_SALT=zAebIbGR08uKKnDEXm+NLN8jagrLZp6xf8mdRO48kmk=
JWT_SECRET=t9511VPwn+F1M4I767vtONAdUFc/HQP0/u9v3wN6yRw=
ENCRYPTION_KEY=VNLhQfBsDBaBtIO0clRbrvmSe4NIeZph2XbOtFFrPG4=
```

`DATABASE_URL` is set by Strapi Cloud — do **not** set it manually.

### 3 · First boot

After deploy finishes (~2 min) Strapi Cloud shows:

- **Admin URL** — open it, create your administrator (email + password).
- **Public URL** — e.g. `https://something.strapiapp.com`. Copy it.

### 4 · Wire the frontend

In the GitHub repo:

`Settings → Secrets and variables → Actions → New repository secret`

- **Name:** `VITE_CMS_URL`
- **Value:** the Strapi Cloud public URL (no trailing slash)

Trigger the deploy workflow:

```bash
gh workflow run "Build and deploy frontend to GitHub Pages"
```

Once the next deploy lands, the live site fetches projects and site settings
from Strapi instead of the static fallback.

---

## Editing content

Once Strapi Cloud is up, all texts / images / 3D models / popup defaults are
editable from the admin panel (`/admin`):

- **Projects** → edit description / tags / `redirectURL` / upload images and
  `.glb` models per cube.
- **Site Setting** → change the default Tweaks state shown when a visitor
  first loads the page.

Changes show up on the frontend on the next page load (no cache layer yet).

---

## CORS

`config/middlewares.js` allows browser requests from `proyecto28.com`, `www`,
`.cl`, GitHub Pages, and localhost/127.0.0.1 QA origins. In Strapi 5, do not
use `origin: ['*']`: it is treated as a literal allowlist entry and does not
match real browser origins.
