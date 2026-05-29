/* =========================================================
   PROYECTO 28 — keyboard access for WebGL project cubes
   Mirrors the 3D tiles as focusable DOM controls.
   ========================================================= */

function projectLabel(project) {
  const parts = [project?.id, project?.title, project?.status].filter(Boolean);
  return parts.join(' · ');
}

export function mountCubeA11y({ tiles, onFocusTile, onOpenTile, onClear }) {
  const projectTiles = (tiles || [])
    .filter((tile) => tile?.userData?.isProject && tile.userData.project)
    .sort((a, b) => {
      const ao = a.userData.project.order ?? 0;
      const bo = b.userData.project.order ?? 0;
      return ao - bo;
    });

  if (!projectTiles.length) return { destroy() {} };

  const nav = document.createElement('nav');
  nav.className = 'cube-a11y';
  nav.setAttribute('aria-label', 'Proyectos del grid 3D');

  for (const tile of projectTiles) {
    const project = tile.userData.project;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cube-a11y-btn';
    btn.textContent = projectLabel(project);
    btn.setAttribute(
      'aria-label',
      `${projectLabel(project)}. Enter abre el detalle del proyecto. Escape cierra el detalle.`
    );
    btn.addEventListener('focus', () => onFocusTile?.(tile));
    btn.addEventListener('click', () => onOpenTile?.(tile));
    btn.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpenTile?.(tile);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onClear?.();
        btn.blur();
      }
    });
    nav.appendChild(btn);
  }

  document.body.appendChild(nav);

  return {
    destroy() {
      nav.remove();
    },
  };
}
