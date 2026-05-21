# PROYECTO 28

Sitio interactivo 3D — Tiles WebGL/Three.js + popup HUD + tweaks live,
contenido editable desde un Strapi headless.

```
proyecto28/
├── src/                Frontend Vite + Three.js (raíz del sitio)
├── public/CNAME        Dominio principal (proyecto28.com)
├── cms/                Strapi v5 — content types + bootstrap
├── .github/workflows/  CI: build + deploy a GitHub Pages
└── DEPLOY.md           Pasos para .com / .cl + Strapi Cloud
```

## Dev local

```bash
# Frontend
npm install
npm run dev              # http://localhost:5173

# CMS (en otra terminal)
cd cms
cp .env.example .env     # rellena con secretos aleatorios
npm install
npm run develop          # http://localhost:1337/admin
```

Si el frontend no encuentra el CMS (env `VITE_CMS_URL` no seteado, o CMS caído),
cae a los datos estáticos de `src/data/fallback.js` y el sitio sigue funcionando.

## Producción

- Frontend → GitHub Pages (custom domains `proyecto28.com` + `proyecto28.cl`)
- CMS → Strapi Cloud (`cms/` como base directory)
- Build automático en cada push a `main`

Ver [`DEPLOY.md`](DEPLOY.md) y [`cms/README.md`](cms/README.md) para el detalle.

## Editar contenido

Una vez Strapi Cloud está corriendo, todo el contenido del grid se administra
desde `/admin`:

- **Proyectos** (1 por cubo) — textos, imagen del popup, modelo `.glb`
  flotante, URL de redirección por color.
- **Ajustes del sitio** — logo (P28 / NEIT / EST), placement por defecto del
  popup, estilo de tiles, inclinación / rotación / drift de cámara, toggles
  del HUD (grilla, scanlines, viewfinder).

El usuario final puede sobreescribir todos los ajustes en tiempo real desde
el panel "Tweaks" que aparece en la esquina inferior derecha — esos cambios
viven sólo en su sesión.
