/* =========================================================
   Kaiyi — Vista ranking público.
   Lee kaiyi-ranking-records (ordenado por puntaje) y kaiyi-web-content.
   Carga todo el set (hasta 9999), filtra y pagina en cliente.
   ========================================================= */

import { getAllRanking, getWebContent } from '../api.js';

const PAGE_SIZE = 25;

/* ---------- helpers ---------- */

function formatTime(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const m  = Math.floor(seconds / 60);
  const s  = Math.floor(seconds % 60);
  const cs = Math.round((seconds % 1) * 100);
  return (
    String(m).padStart(2, '0') + ':' +
    String(s).padStart(2, '0') + '.' +
    String(cs).padStart(2, '0')
  );
}

function formatScore(score) {
  if (score === null || score === undefined || Number.isNaN(score)) return '—';
  return Number(score).toFixed(2);
}

function formatLetters(count) {
  if (count === null || count === undefined) return '—';
  if (count >= 5) return 'K·A·I·Y·I ✓';
  return `${count} / 5`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const VEHICLE_NAMES = {
  Vehicle_01: 'Vehículo 1',
  Vehicle_02: 'Vehículo 2',
  Vehicle_03: 'Vehículo 3',
  Vehicle_04: 'Vehículo 4',
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- render ---------- */

export async function renderRanking(root) {
  root.innerHTML = `
    <div class="kaiyi-page">
      <header class="kaiyi-header">
        <a class="kaiyi-back" href="https://proyecto28.com" aria-label="Volver a Proyecto 28">← proyecto28.com</a>
        <div class="kaiyi-brand">
          <span class="kaiyi-brand-label">KAIYI AUTO</span>
          <h1 class="kaiyi-title" id="kaiyi-main-title">Ranking</h1>
          <p class="kaiyi-subtitle" id="kaiyi-main-subtitle"></p>
        </div>
      </header>

      <main class="kaiyi-main" id="kaiyi-main" aria-live="polite">
        <div class="kaiyi-loading" role="status">
          <div class="kaiyi-ring"></div>
          <span>Cargando ranking…</span>
        </div>
      </main>

      <footer class="kaiyi-footer" id="kaiyi-footer" hidden></footer>
    </div>`;

  const titleEl    = root.querySelector('#kaiyi-main-title');
  const subtitleEl = root.querySelector('#kaiyi-main-subtitle');
  const main       = root.querySelector('#kaiyi-main');
  const footer     = root.querySelector('#kaiyi-footer');

  try {
    const [contentRes, recordsRes] = await Promise.allSettled([
      getWebContent(),
      getAllRanking(),
    ]);

    const c = contentRes.status === 'fulfilled' ? contentRes.value : null;
    const records = recordsRes.status === 'fulfilled' ? (recordsRes.value || []) : [];

    if (c?.rankingTitle)    titleEl.textContent    = c.rankingTitle;
    if (c?.rankingSubtitle) subtitleEl.textContent = c.rankingSubtitle;

    if (c?.thankYouMessage) {
      footer.textContent = c.thankYouMessage;
      footer.removeAttribute('hidden');
    }

    main.innerHTML = renderShell(records.length);
    setupTable(main, records);

  } catch (err) {
    console.error('[kaiyi:ranking]', err);
    main.innerHTML = `
      <div class="kaiyi-error">
        <p>No se pudo cargar el ranking. Inténtalo de nuevo más tarde.</p>
      </div>`;
  }
}

function renderShell(total) {
  if (!total) {
    return `
      <div class="kaiyi-empty">
        <p>Aún no hay tiempos registrados.</p>
        <p class="kaiyi-empty-sub">¡Sé el primero en completar la carrera!</p>
      </div>`;
  }

  return `
    <div class="kaiyi-controls">
      <input type="search" id="kaiyi-search" class="kaiyi-input"
        placeholder="Buscar jugador…" aria-label="Buscar en el ranking" />
      <select id="kaiyi-vehicle-filter" class="kaiyi-select" aria-label="Filtrar por vehículo">
        <option value="">Todos los vehículos</option>
        <option value="Vehicle_01">Vehículo 1</option>
        <option value="Vehicle_02">Vehículo 2</option>
        <option value="Vehicle_03">Vehículo 3</option>
        <option value="Vehicle_04">Vehículo 4</option>
      </select>
      <label class="kaiyi-letters-filter">
        <input type="checkbox" id="kaiyi-letters-check" />
        Solo K·A·I·Y·I completas
      </label>
    </div>

    <div class="kaiyi-table-wrap">
      <table class="kaiyi-table" aria-label="Ranking de tiempos Kaiyi">
        <thead>
          <tr>
            <th>#</th>
            <th>Jugador</th>
            <th>Puntaje</th>
            <th>Tiempo</th>
            <th>Vehículo</th>
            <th>Letras</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody id="kaiyi-tbody"></tbody>
      </table>
    </div>

    <div class="kaiyi-pagination" id="kaiyi-pagination">
      <button class="kaiyi-btn-ghost" id="kaiyi-prev" type="button">← Anterior</button>
      <span class="kaiyi-page-info" id="kaiyi-page-info"></span>
      <button class="kaiyi-btn-ghost" id="kaiyi-next" type="button">Siguiente →</button>
    </div>

    <p class="kaiyi-count" id="kaiyi-count"></p>`;
}

function setupTable(container, allRecords) {
  const tbody    = container.querySelector('#kaiyi-tbody');
  if (!tbody) return; // empty state

  const search   = container.querySelector('#kaiyi-search');
  const vehicle  = container.querySelector('#kaiyi-vehicle-filter');
  const letters  = container.querySelector('#kaiyi-letters-check');
  const prevBtn  = container.querySelector('#kaiyi-prev');
  const nextBtn  = container.querySelector('#kaiyi-next');
  const pageInfo = container.querySelector('#kaiyi-page-info');
  const countEl  = container.querySelector('#kaiyi-count');

  let page = 1;

  function filtered() {
    const q  = (search.value || '').trim().toLowerCase();
    const v  = vehicle.value || '';
    const oa = letters.checked;
    return allRecords.filter((r) => {
      const okV = !v || r.vehicleId === v;
      const okL = !oa || (r.collectedLettersCount ?? 0) >= 5;
      const okQ = !q || String(r.playerAlias || 'Anónimo').toLowerCase().includes(q);
      return okV && okL && okQ;
    });
  }

  function render() {
    const list = filtered();
    const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (page > pageCount) page = pageCount;
    const start = (page - 1) * PAGE_SIZE;
    const slice = list.slice(start, start + PAGE_SIZE);

    tbody.innerHTML = slice.map((r, i) => {
      const vid   = r.vehicleId || '';
      const vName = VEHICLE_NAMES[vid] || vid || '—';
      const count = r.collectedLettersCount;
      const all   = (count ?? 0) >= 5;
      const alias = (r.playerAlias && String(r.playerAlias).trim()) || 'Anónimo';
      return `
        <tr>
          <td class="kaiyi-pos">${start + i + 1}</td>
          <td class="kaiyi-player">${escapeHtml(alias)}</td>
          <td class="kaiyi-score">${formatScore(r.score)}</td>
          <td class="kaiyi-time">${formatTime(r.completionTimeSeconds)}</td>
          <td class="kaiyi-vehicle">${vName}</td>
          <td class="kaiyi-letters${all ? ' kaiyi-letters--full' : ''}">${formatLetters(count)}</td>
          <td class="kaiyi-date">${formatDate(r.completionDate)}</td>
        </tr>`;
    }).join('');

    pageInfo.textContent = `Página ${page} de ${pageCount}`;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= pageCount;
    countEl.textContent = `${list.length} registro${list.length === 1 ? '' : 's'}`;
  }

  function reset() { page = 1; render(); }

  search.addEventListener('input', reset);
  vehicle.addEventListener('change', reset);
  letters.addEventListener('change', reset);
  prevBtn.addEventListener('click', () => { if (page > 1) { page--; render(); } });
  nextBtn.addEventListener('click', () => { page++; render(); });

  render();
}
