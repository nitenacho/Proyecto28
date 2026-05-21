# Proyecto28 — CMS (Strapi v5)

Headless CMS that owns the content shown in the frontend:

- **Project** (collection) — 6 entries, one per cube with popup
  - `slot` — fixed position in the grid (Rectangle 4–9)
  - `projectId`, `title`, `status`, `color` (cyan/copper)
  - `description`, `tags[]`
  - `image` — image shown inside the popup
  - `model3D` — `.glb` / `.gltf` floating above the cube on hover
  - `modelShape` — procedural fallback if no model3D is uploaded
  - `redirectURL` — link the "Explorar proyecto" button + cube click follow
- **Site Setting** (singleton) — defaults for the Tweaks panel
  - logo, popup placement, tile style, camera tilt/yaw/drift, HUD toggles

The frontend talks to the public REST endpoints without an API token:

```
GET /api/site-setting?populate=*
GET /api/projects?populate=*
```

`src/index.js` grants the Public role read access on first boot.

---

## Local development

```bash
cd cms
cp .env.example .env        # then fill in random secrets
npm install
npm run develop             # admin at http://localhost:1337/admin
```

First boot creates the admin user, seeds 6 sample projects, and seeds the
Site Setting singleton. SQLite file lives at `cms/.tmp/data.db` (gitignored).

---

## Deploy to Strapi Cloud

1. Push this repo to GitHub (the frontend + `cms/` live in the same repo;
   Strapi Cloud lets you point at a subdirectory).
2. In the Strapi Cloud dashboard, create a new project pointing at:
   - Repo: `nitenacho/Proyecto28`
   - Branch: `main`
   - Base directory: `cms`
3. Set these env vars on the Strapi Cloud project (rotate the secrets):
   - `APP_KEYS` (comma-separated, 4 random hex strings)
   - `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`,
     `ENCRYPTION_KEY` — each a random hex string
   - `DATABASE_URL` is injected by Strapi Cloud — no need to set
4. Deploy. After first boot, the admin URL is shown in the dashboard.
5. Copy the project's public URL (e.g. `https://abc.strapiapp.com`) and set
   it as `VITE_CMS_URL` on the frontend (Vite env or GitHub Actions secret).

Generate random secrets quickly:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## Editing content

Once deployed, all texts / images / 3D models / popup defaults are editable
from the admin panel (`/admin`):

- **Projects** → edit description / tags / `redirectURL` / upload images and
  `.glb` models per cube.
- **Site Setting** → change the default Tweaks state shown when a visitor
  first loads the page.

Changes show up on the frontend on the next page load (no cache layer yet).
