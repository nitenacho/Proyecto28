# RUNBOOK - Proyecto 28

> Ultima revision: 2026-05-29
> Produccion canonica: https://proyecto28.com
> CMS: https://honest-candy-800d1e4a92.strapiapp.com
> Repo: https://github.com/nitenacho/Proyecto28

Este runbook es la guia de operacion diaria y respuesta a incidentes de
Proyecto 28. Debe leerse junto a `README.md`, `DEPLOY.md`, `VERSIONING.md` y
`HANDOFF-LATEST.md`.

---

## 1. Smoke test rapido

Ejecutar al empezar cualquier sesion o despues de un deploy:

```powershell
cd "C:/Users/incon/OneDrive/Desktop/Proyectos_Claude/Claude_P28/Proyecto28"
git checkout main
git pull --ff-only
git status
git describe --tags --abbrev=0

curl.exe -L -s -o NUL -w "site: %{http_code}`n" "https://proyecto28.com"
curl.exe -L -s -o NUL -w "robots: %{http_code}`n" "https://proyecto28.com/robots.txt"
curl.exe -L -s -o NUL -w "sitemap: %{http_code}`n" "https://proyecto28.com/sitemap.xml"

$base="https://honest-candy-800d1e4a92.strapiapp.com"
curl.exe -s -o NUL -w "projects: %{http_code}`n" "$base/api/projects?populate=*"
curl.exe -s -o NUL -w "site-setting: %{http_code}`n" "$base/api/site-setting"
curl.exe -s -o NUL -w "admin-whitelists: %{http_code}`n" "$base/api/admin-whitelists"
curl.exe -s "$base/api/auth/check?email=inconcha@gmail.com"
curl.exe -s "$base/api/auth/check?email=yk8arts@gmail.com"
```

Esperado:

- `proyecto28.com`, `robots.txt`, `sitemap.xml`: `200`.
- `/api/projects?populate=*`: `200`.
- `/api/site-setting`: `200`.
- `/api/admin-whitelists`: `403` porque la API publica de whitelist debe ser
  privada.
- `inconcha@gmail.com`: `{"allowed":true,"role":"owner"}`.
- `yk8arts@gmail.com`: `{"allowed":true,"role":"editor"}`.

---

## 2. Operacion normal

### Frontend local

```powershell
npm install
npm run dev
```

Abrir `http://localhost:5173`. Si no hay `VITE_CMS_URL`, el sitio usa
`src/data/fallback.js`.

### CMS local

```powershell
cd cms
Copy-Item .env.example .env
npm install
npm run develop
```

Si el checkout esta dentro de OneDrive y Strapi no ve schemas:

```powershell
pwsh -File cms/scripts/unwrap-onedrive.ps1
```

### Publicar cambios desde Tweaks

1. Abrir `https://proyecto28.com`.
2. Clic en `Admin`.
3. Iniciar sesion con un correo permitido por Google + Strapi whitelist.
4. Cambiar ajustes en `Tweaks`.
5. Presionar `PUBLICAR CAMBIOS`.
6. Recargar la pagina y confirmar que `/api/site-setting` refleja el cambio.

Si aparece un error de token Google, cerrar sesion con `window.p28SignOut()` en
DevTools y volver a entrar por `Admin`. Desde `v0.19.0` el frontend reintenta
una vez con token fresco.

---

## 3. Agregar un proyecto nuevo

### En Strapi

1. Entrar a Strapi Admin.
2. Abrir `Content Manager -> Project`.
3. Crear o duplicar un proyecto.
4. Completar:
   - `slot`: posicion fija del grid.
   - `projectId`: formato recomendado `028.X`.
   - `title`, `status`, `description`, `tags`.
   - `redirectURL`.
   - `popupImage` o `image`.
   - `popupBody` y `popupCTALabel`.
   - `model3D` si hay `.glb`/`.gltf`; si no, usar `modelShape`.
   - `unrealEnabled`, `unrealStreamURL`, `unrealLevelName` si el proyecto usa
     Pixel Streaming.
5. Publicar el registro.

### En Unreal / Pixel Streaming

1. Crear o preparar el Level/SubLevel que corresponde al proyecto.
2. Exponer un identificador estable en Unreal, por ejemplo `Level_028_A`.
3. Confirmar que el player recibe `postMessage` desde el iframe:

```json
{
  "command": "showProject",
  "projectId": "028.A",
  "unrealLevelName": "Level_028_A",
  "mode": "shared"
}
```

4. Traducir ese mensaje a `emitUIInteraction` dentro del player de Pixel
   Streaming.
5. Probar la URL del stream en un navegador externo antes de pegarla en Strapi.

### QA final

- Recargar `https://proyecto28.com`.
- Verificar que el cubo muestra popup, imagen/modelo y redireccion.
- Si hay streaming, activar `SiteSetting.pixelStreamingEnabled` y confirmar que
  el overlay aparece al activar el cubo.
- En mobile, verificar que `document.documentElement.scrollWidth ===
  window.innerWidth`.

---

## 4. Incidentes y recuperacion

### Pixel Streaming no aparece

1. Confirmar en Strapi:
   - `SiteSetting.pixelStreamingEnabled = true`.
   - `Project.unrealEnabled = true`.
   - `Project.unrealStreamURL` es URL absoluta `https://...`.
2. Probar `unrealStreamURL` directo en navegador.
3. Revisar TLS del subdominio `stream.proyecto28.com`.
4. Si el servidor GPU esta caido, apagar temporalmente el preview:
   `Tweaks -> Streaming -> Preview visible OFF -> PUBLICAR CAMBIOS`.
5. Si se quiere mantener una senal visual, dejar `Preview visible ON` para usar
   el fallback local sin WebRTC real.

### Strapi Cloud sin quota o caido

1. Confirmar `https://honest-candy-800d1e4a92.strapiapp.com/api/site-setting`.
2. Si responde 5xx/timeout, revisar Strapi Cloud dashboard.
3. El frontend debe seguir vivo con fallback estatico si el CMS no responde.
4. Evitar publicar cambios desde Tweaks hasta que Strapi vuelva.
5. Si el incidente dura mas, exportar contenido desde Strapi Cloud o restaurar
   desde backups del proveedor.

### Google OAuth deja de funcionar

1. Confirmar que `VITE_GOOGLE_CLIENT_ID` sigue configurado como GitHub Secret.
2. Confirmar que Strapi Cloud tiene `GOOGLE_CLIENT_ID` o
   `VITE_GOOGLE_CLIENT_ID`.
3. En Google Cloud project `spartan-grail-401816`, revisar:
   - OAuth client tipo Web Application.
   - Authorized JavaScript origins: `https://proyecto28.com`,
     `https://www.proyecto28.com`, localhost/127.0.0.1 de QA.
   - Consent screen en Testing: `inconcha@gmail.com` y `yk8arts@gmail.com`
     deben seguir como test users.
4. Confirmar Strapi whitelist:
   - `inconcha@gmail.com` role `owner`.
   - `yk8arts@gmail.com` role `editor`.

### `PUBLICAR CAMBIOS` devuelve 401/403

1. 401 normalmente indica token Google vencido/rechazado.
2. 403 indica correo no permitido en Strapi whitelist.
3. Ejecutar:

```powershell
$base="https://honest-candy-800d1e4a92.strapiapp.com"
curl.exe -s "$base/api/auth/check?email=inconcha@gmail.com"
curl.exe -s "$base/api/auth/check?email=yk8arts@gmail.com"
```

4. Si Strapi permite el correo pero Google no, revisar consent screen/test
   users.

### GitHub Pages no despliega

1. Revisar Actions del repo.
2. Si `gh` esta autenticado:

```powershell
gh run list -R nitenacho/Proyecto28 --limit 5
gh run watch <RUN_ID> -R nitenacho/Proyecto28
```

3. Si `gh` no esta autenticado, usar API publica:

```powershell
Invoke-RestMethod -Headers @{ "User-Agent"="Codex" } `
  -Uri "https://api.github.com/repos/nitenacho/Proyecto28/actions/runs?per_page=5"
```

4. Verificar que `dist/CNAME` contiene `proyecto28.com`.
5. Reintentar el workflow desde GitHub UI si el fallo fue transitorio.

### `proyecto28.cl` no responde bien

El dominio canonico operativo es `.com`. Para `.cl`:

1. Revisar DNS/Cloudflare/NIC Chile.
2. Confirmar records A/AAAA/CNAME del GitHub Pages o redirect 301 a `.com`.
3. Revisar certificado HTTPS.
4. No bloquear deploys por `.cl` mientras `.com` este correcto.

---

## 5. Rotacion de secretos

Nunca pegar secretos en chat ni en docs versionados.

### GitHub Actions secrets

Rotar desde `Settings -> Secrets and variables -> Actions`:

- `VITE_CMS_URL`
- `VITE_GOOGLE_CLIENT_ID`

Despues de cambiar un secret, disparar Pages y verificar el bundle vivo.

### Strapi Cloud

Rotar desde `Settings -> Variables`:

- `APP_KEYS`
- `API_TOKEN_SALT`
- `ADMIN_JWT_SECRET`
- `TRANSFER_TOKEN_SALT`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `GOOGLE_CLIENT_ID` o `VITE_GOOGLE_CLIENT_ID`
- `DISCORD_WEBHOOK_URL` si se usa webhook

Generar secretos nuevos:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Despues de rotar, reiniciar/redeploy Strapi Cloud y hacer smoke de
`/api/site-setting`, `/api/auth/check` y `/api/publish` con usuario real.

### Google OAuth

Si se rota el OAuth Client ID:

1. Crear nuevo Web Application OAuth Client.
2. Copiar el client id a GitHub Secret y Strapi Cloud.
3. Mantener origins autorizados.
4. Verificar login Admin y `PUBLICAR CAMBIOS`.

---

## 6. Rollback

Rollback de frontend:

```powershell
git checkout main
git pull --ff-only
git revert <commit-sha>
git push origin main
```

Rollback a tag conocido:

```powershell
git checkout main
git revert --no-commit <bad-sha>
git commit -m "fix(release): rollback produccion"
git push origin main
```

Rollback de contenido Strapi:

- Preferir revertir manualmente campos en Strapi Admin.
- Si el cambio vino desde Tweaks, revisar `Publish log` para ver usuario,
  campos cambiados y hora.

---

## 7. Cierre de una nueva etapa

Checklist minimo:

- `npm run build` OK.
- Produccion `https://proyecto28.com` OK.
- Strapi endpoints OK.
- GitHub Actions verde.
- `CHANGELOG.md`, `README.md`, `PLAN-PROYECTO28-V2.md`,
  `HANDOFF-LATEST.md` actualizados.
- Handoff copiado al Google Doc como subpestana bajo `Handoff`.
- Tag semver creado y pusheado.

La fuente de verdad del flujo sigue siendo `VERSIONING.md`.
