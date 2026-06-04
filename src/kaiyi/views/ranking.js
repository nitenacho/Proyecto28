/* =========================================================
   Kaiyi — Vista ranking público.
   Lee kaiyi-ranking-records y kaiyi-web-content desde Strapi.
   ========================================================= */

import { getRanking, getWebContent } from '../api.js';

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
    const [contentRes, rankingRes] = await Promise.allSettled([
      getWebContent(),
      getRanking(),
    ]);

    const c = contentRes.status === 'fulfilled' ? contentRes.value : null;
    const records = rankingRes.status === 'fulfilled'
      ? (rankingRes.value.data || [])
      : [];

    if (c?.rankingTitle)    titleEl.textContent    = c.rankingTitle;
    if (c?.rankingSubtitle) subtitleEl.textContent = c.rankingSubtitle;

    if (c?.thankYouMessage) {
      footer.textContent = c.thankYouMessage;
      footer.removeAttribute('hidden');
    }

    main.innerHTML = renderTable(records);
    wireFilters(main);

  } catch (err) {
    console.error('[kaiyi:ranking]', err);
    main.innerHTML = `
      <div class="kaiyi-error">
        <p>No se pudo cargar el ranking. Inténtalo de nuevo más tarde.</p>
      </div>`;
  }
}

function renderTable(records) {
  if (!records.length) {
    return `
      <div class="kaiyi-empty">
        <p>Aún no hay tiempos registrados.</p>
        <p class="kaiyi-empty-sub">¡Sé el primero en completar la carrera!</p>
      </div>`;
  }

  const rows = records.map((r, i) => {
    const vid   = r.vehicleId || '';
    const vName = VEHICLE_NAMES[vid] || vid || '—';
    const count = r.collectedLettersCount;
    const allLetters = (count ?? 0) >= 5;
    const alias = (r.playerAlias && String(r.playerAlias).trim()) || 'Anónimo';
    return `
      <tr data-vehicle="${vid}" data-all-letters="${allLetters}">
        <td class="kaiyi-pos">${i + 1}</td>
        <td class="kaiyi-player">${escapeHtml(alias)}</td>
        <td class="kaiyi-time">${formatTime(r.completionTimeSeconds)}</td>
        <td class="kaiyi-vehicle">${vName}</td>
        <td class="kaiyi-letters${allLetters ? ' kaiyi-letters--full' : ''}">${formatLetters(count)}</td>
        <td class="kaiyi-date">${formatDate(r.completionDate)}</td>
      </tr>`;
  }).join('');

  return `
    <div class="kaiyi-controls">
      <input
        type="search"
        id="kaiyi-search"
        class="kaiyi-input"
        placeholder="Buscar…"
        aria-label="Buscar en el ranking"
      />
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
            <th>Tiempo</th>
            <th>Vehículo</th>
            <th>Letras</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody id="kaiyi-tbody">${rows}</tbody>
      </table>
    </div>

    <p class="kaiyi-count" id="kaiyi-count">${records.length} registros</p>`;
}

function wireFilters(container) {
  const search       = container.querySelector('#kaiyi-search');
  const vehicleSel   = container.querySelector('#kaiyi-vehicle-filter');
  const lettersCheck = container.querySelector('#kaiyi-letters-check');
  const tbody        = container.querySelector('#kaiyi-tbody');
  const countEl      = container.querySelector('#kaiyi-count');

  if (!tbody) return;

  function applyFilters() {
    const query   = search?.value.trim().toLowerCase() || '';
    const vehicle = vehicleSel?.value || '';
    const onlyAll = lettersCheck?.checked || false;

    let visible = 0;
    let pos = 1;

    tbody.querySelectorAll('tr[data-vehicle]').forEach((row) => {
      const v  = row.dataset.vehicle || '';
      const al = row.dataset.allLetters === 'true';
      const matchVehicle = !vehicle  || v === vehicle;
      const matchLetters = !onlyAll  || al;
      const matchQuery   = !query    || row.textContent.toLowerCase().includes(query);

      const show = matchVehicle && matchLetters && matchQuery;
      row.style.display = show ? '' : 'none';

      if (show) {
        const posCell = row.querySelector('.kaiyi-pos');
        if (posCell) posCell.textContent = pos;
        pos++;
        visible++;
      }
    });

    if (countEl) countEl.textContent = `${visible} registros`;
  }

  search?.addEventListener('input', applyFilters);
  vehicleSel?.addEventListener('change', applyFilters);
  lettersCheck?.addEventListener('change', applyFilters);
}
