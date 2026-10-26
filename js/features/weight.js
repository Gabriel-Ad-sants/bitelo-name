import { START_WEIGHT, TARGET_WEIGHT } from '../constants/plan.js';
import { commit } from '../state/store.js';
import { isISODate, formatBR, todayISO } from '../utils/dates.js';
import { $, escapeHtml, formatNumber } from '../utils/dom.js';
import { toast } from '../ui/toast.js';

const MIN_KG = 30;
const MAX_KG = 300;
let chart = null;

const sortedLogs = (state) => [...state.weightLogs].sort((a, b) => a.date.localeCompare(b.date));

function renderHistory(logs) {
  const list = $('#weightHistory');
  if (!logs.length) {
    list.innerHTML = '<p class="empty-state">Nenhuma pesagem ainda.</p>';
    return;
  }
  list.innerHTML = [...logs]
    .reverse()
    .map(
      (log) => `
      <li class="weight-item">
        <span>${formatBR(log.date)}</span>
        <span class="weight-item__value">${formatNumber(log.weight)} kg</span>
        <button class="icon-btn icon-btn--danger" type="button" data-delete-weight="${escapeHtml(log.date)}" aria-label="Remover pesagem de ${formatBR(log.date)}">✕</button>
      </li>`
    )
    .join('');
}

function createChart() {
  if (chart || typeof Chart === 'undefined') return;
  const canvas = $('#weightChart');
  if (!canvas) return;

  chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Peso (kg)',
          data: [],
          borderColor: '#34d399',
          backgroundColor: '#34d399',
          fill: false,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#34d399',
          pointBorderWidth: 0,
        },
        {
          label: 'Média 7 registros',
          data: [],
          borderColor: '#e8ecf1',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
        },
        {
          label: `Meta (${TARGET_WEIGHT} kg)`,
          data: [],
          borderColor: '#6b7685',
          borderDash: [6, 6],
          borderWidth: 1,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: '#a4aebb', boxWidth: 10, font: { size: 11 } } } },
      scales: {
        x: { grid: { color: 'rgba(148,163,184,0.06)' }, ticks: { color: '#6b7685', maxRotation: 0, autoSkip: true } },
        y: {
          grid: { color: 'rgba(148,163,184,0.06)' },
          ticks: { color: '#6b7685', stepSize: 5, callback: (v) => `${v} kg` },
        },
      },
    },
  });
}

function updateChart(logs) {
  createChart();
  if (!chart) return;

  const values = logs.map((l) => l.weight);
  const avg = logs.map((_, i) => {
    const slice = values.slice(Math.max(0, i - 6), i + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });

  chart.data.labels = logs.map((l) => formatBR(l.date).slice(0, 5));
  chart.data.datasets[0].data = values;
  chart.data.datasets[1].data = avg;
  chart.data.datasets[2].data = logs.map(() => TARGET_WEIGHT);

  const all = [...values, START_WEIGHT, TARGET_WEIGHT];
  chart.options.scales.y.min = Math.floor((Math.min(...all) - 2) / 5) * 5;
  chart.options.scales.y.max = Math.ceil((Math.max(...all) + 2) / 5) * 5;
  chart.update();
}

export function render(state) {
  const logs = sortedLogs(state);
  renderHistory(logs);
  updateChart(logs);
}

export function bind() {
  const dateInput = $('#weightDate');
  if (dateInput) dateInput.value = todayISO();

  $('#weightForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const date = $('#weightDate').value;
    const weight = Number($('#weightValue').value.replace(',', '.'));

    if (!isISODate(date)) return toast('Informe uma data válida.', 'error');
    if (!Number.isFinite(weight) || weight < MIN_KG || weight > MAX_KG) {
      return toast(`Peso deve estar entre ${MIN_KG} e ${MAX_KG} kg.`, 'error');
    }

    const ok = commit((draft) => {
      draft.weightLogs = draft.weightLogs.filter((l) => l.date !== date);
      draft.weightLogs.push({ date, weight: Math.round(weight * 10) / 10 });
      draft.weightLogs.sort((a, b) => a.date.localeCompare(b.date));
    });

    if (!ok) return toast('Falha ao salvar a pesagem.', 'error');
    $('#weightValue').value = '';
    toast(`Pesagem de ${formatNumber(weight)} kg salva`);
  });

  $('#weightHistory')?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-delete-weight]');
    if (!btn) return;
    const date = btn.dataset.deleteWeight;
    commit((draft) => {
      draft.weightLogs = draft.weightLogs.filter((l) => l.date !== date);
    });
  });
}

