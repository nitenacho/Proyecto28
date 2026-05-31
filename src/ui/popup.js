/* =========================================================
   Popup binding — same DOM as the design's prototype but
   talks directly to the live three-scene's hover events.
   ========================================================= */

import { popupEnterTimeline, popupExitTimeline } from '../animations/timelines.js';

export function createPopup() {
  const root        = document.getElementById('popup');
  const titleEl     = document.getElementById('popup-title');
  const descEl      = document.getElementById('popup-desc');
  const idEl        = document.getElementById('popup-id');
  const statusEl    = document.getElementById('popup-status');
  const subtitleEl  = document.getElementById('popup-subtitle');
  const tagsEl      = document.getElementById('popup-tags');
  const btnEl       = document.getElementById('popup-btn');
  const closeEl     = document.getElementById('popup-close');
  const imgWrap     = document.getElementById('popup-image-wrap');
  const img         = document.getElementById('popup-image');
  const coordModule = document.getElementById('coord-module');

  let activeProject = null;
  let closeTimer    = null;
  let placement     = 'side';

  function show(project) {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    activeProject = project;
    root.setAttribute('aria-hidden', 'false');
    titleEl.textContent    = project.title;
    descEl.textContent     = project.description;
    idEl.textContent       = `Módulo · ${project.id}`;
    statusEl.textContent   = project.status;
    subtitleEl.textContent = `▮ Proyecto · ${project.id.replace('.', ' · ')}`;

    const popupImageURL = project.popupImageURL || project.imageURL;
    if (popupImageURL) {
      img.loading = 'lazy';
      img.decoding = 'async';
      img.fetchPriority = 'low';
      img.sizes = '(max-width: 1024px) 100vw, 380px';
      img.alt = project.title;
      imgWrap.hidden = false;
      imgWrap.classList.remove('loaded', 'failed');
      img.onload = () => imgWrap.classList.add('loaded');
      img.onerror = () => {
        imgWrap.classList.add('failed');
        imgWrap.hidden = true;
        img.removeAttribute('src');
      };
      img.src = popupImageURL;
    } else {
      img.onload = img.onerror = null;
      img.removeAttribute('src');
      imgWrap.hidden = true;
    }

    tagsEl.innerHTML = '';
    (project.tags || []).forEach((t) => {
      const s = document.createElement('span');
      s.className = 'popup-tag';
      s.textContent = t;
      tagsEl.appendChild(s);
    });

    btnEl.href = project.redirectURL || '#';
    btnEl.target = project.redirectURL && project.redirectURL.startsWith('http') ? '_blank' : '_self';
    btnEl.rel = btnEl.target === '_blank' ? 'noopener' : '';
    const label = btnEl.querySelector('span:first-child');
    if (label) label.textContent = project.popupCTALabel || 'Explorar proyecto';
    root.classList.toggle('cyan-accent', project.color === 'cyan');
    root.classList.add('visible');
    popupEnterTimeline(root);
    if (coordModule) coordModule.textContent = project.id;
  }

  function scheduleHide() {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      popupExitTimeline(root);
      root.classList.remove('visible');
      root.setAttribute('aria-hidden', 'true');
      activeProject = null;
      if (coordModule) coordModule.textContent = '—';
    }, 420);
  }

  function hideNow() {
    if (closeTimer) clearTimeout(closeTimer);
    popupExitTimeline(root);
    root.classList.remove('visible');
    root.setAttribute('aria-hidden', 'true');
    activeProject = null;
    if (coordModule) coordModule.textContent = '—';
  }

  function setPlacement(p) {
    placement = p;
    root.classList.remove('side', 'cursor', 'corner');
    root.classList.add(p);
    if (p !== 'cursor') {
      root.style.left = '';
      root.style.top = '';
    }
  }

  function positionAtCursor(cx, cy) {
    if (placement !== 'cursor') return;
    const popupW = root.offsetWidth || 380;
    const popupH = root.offsetHeight || 380;
    const OFF = 24;
    let left = cx + OFF;
    let top  = cy - popupH / 2;
    if (left + popupW > window.innerWidth - 24) left = cx - popupW - OFF;
    if (left < 24) left = 24;
    if (top < 90) top = 90;
    if (top + popupH > window.innerHeight - 24) top = window.innerHeight - popupH - 24;
    root.style.left = left + 'px';
    root.style.top  = top + 'px';
  }

  root.addEventListener('pointerenter', () => { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } });
  root.addEventListener('pointerleave', scheduleHide);
  closeEl.addEventListener('click', hideNow);

  return { show, scheduleHide, hideNow, setPlacement, positionAtCursor,
    focus() { root.focus({ preventScroll: true }); },
    get placement() { return placement; },
    get active() { return activeProject; } };
}
