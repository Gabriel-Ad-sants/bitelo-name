import { DAILY_TARGETS } from '../constants/plan.js';
import { commit, getUi, setUi } from '../state/store.js';
import { ensureDay, createEmptyDay } from '../services/storage.js';
import { isISODate, todayISO, formatBR } from '../utils/dates.js';
import { $, escapeHtml, formatNumber } from '../utils/dom.js';
import { toast } from '../ui/toast.js';

const FLAG_IDS = ['gym', 'cardio', 'clean'];
const WATER_TARGET_ML = DAILY_TARGETS.waterLiters * 1000;
const formatMl = (ml) => Math.round(ml).toLocaleString('pt-BR');

function setText(id, text) {
  const node = $(`#${id}`);
  if (node) node.textContent = text;
}

function renderWater(day) {
  const pct = Math.min(100, (day.waterMl / WATER_TARGET_ML) * 100);
  setText('waterValue', `${formatMl(day.waterMl)} ml`);
  setText('waterTarget', `de ${formatMl(WATER_TARGET_ML)} ml`);
  $('#waterBar').style.width = `${pct}%`;
  $('#waterDone').hidden = day.waterMl < WATER_TARGET_ML;
}

function renderMeals(day) {
  const list = $('#mealList');
  if (!day.meals.length) {
    list.innerHTML = '<p class="empty-state">Nenhuma refeição registrada nesta data.</p>';
  } else {
    list.innerHTML = day.meals
      .map(
        (m) => `
        <li class="meal-item">
          <div>
            <span class="meal-item__name">${escapeHtml(m.desc)}</span>
            <span class="meal-item__macros">${Math.round(m.kcal)} kcal · P ${formatNumber(m.prot, 0)}g · C ${formatNumber(m.carb, 0)}g · G ${formatNumber(m.fat, 0)}g</span>
          </div>
          <button class="icon-btn icon-btn--danger" type="button" data-delete-meal="${escapeHtml(m.id)}" aria-label="Remover ${escapeHtml(m.desc)}">✕</button>
        </li>`
      )
      .join('');
  }

  const sum = day.meals.reduce(
    (acc, m) => ({ kcal: acc.kcal + m.kcal, prot: acc.prot + m.prot, carb: acc.carb + m.carb, fat: acc.fat + m.fat }),
    { kcal: 0, prot: 0, carb: 0, fat: 0 }
  );
  $('#macroKcalBar').style.width = `${Math.min(100, (sum.kcal / DAILY_TARGETS.kcal) * 100)}%`;
  setText('sumKcal', `${Math.round(sum.kcal)}kcal`);
  setText('sumProt', `${Math.round(sum.prot)}g`);
  setText('sumCarb', `${Math.round(sum.carb)}g`);
  setText('sumFat', `${Math.round(sum.fat)}g`);
}

export function render(state, ui) {
  const date = ui.selectedDate;
  const dateInput = $('#trackerDate');
  if (dateInput && dateInput.value !== date) dateInput.value = date;
  setText('trackerDateLabel', date === todayISO() ? 'Hoje' : formatBR(date));

  const day = state.dailyLogs[date] ?? createEmptyDay();
  FLAG_IDS.forEach((flag) => {
    const input = $(`#chk-${flag}`);
    if (input) input.checked = day[flag];
  });
  renderWater(day);
  renderMeals(day);
}

function bindFlags() {
  FLAG_IDS.forEach((flag) => {
    $(`#chk-${flag}`)?.addEventListener('change', (event) => {
      const { selectedDate } = getUi();
      const ok = commit((draft) => {
        ensureDay(draft, selectedDate)[flag] = event.target.checked;
      });
      if (!ok) toast('Falha ao salvar. Armazenamento cheio?', 'error');
    });
  });
}

function bindWater() {
  document.querySelectorAll('[data-water-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const delta = Number(btn.dataset.waterAdd);
      const { selectedDate } = getUi();
      const ok = commit((draft) => {
        const day = ensureDay(draft, selectedDate);
        day.waterMl = Math.min(10000, Math.max(0, day.waterMl + delta));
      });
      if (!ok) toast('Falha ao salvar a água.', 'error');
    });
  });
}

function readNumber(id) {
  const raw = $(`#${id}`).value.trim();
  if (raw === '') return 0;
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

function bindMealForm() {
  $('#mealForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const desc = $('#mealDesc').value.trim();
    const values = {
      kcal: readNumber('mealKcal'),
      prot: readNumber('mealProt'),
      carb: readNumber('mealCarb'),
      fat: readNumber('mealFat'),
    };

    if (!desc) return toast('Informe o nome da refeição.', 'error');
    if (Object.values(values).some(Number.isNaN)) return toast('Use apenas números positivos nos macros.', 'error');

    const { selectedDate } = getUi();
    const ok = commit((draft) => {
      ensureDay(draft, selectedDate).meals.push({
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        desc: desc.slice(0, 120),
        ...values,
      });
    });

    if (!ok) return toast('Falha ao salvar a refeição.', 'error');
    event.target.reset();
    $('#mealDesc').focus();
    toast('Refeição adicionada');
  });

  $('#mealList')?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-delete-meal]');
    if (!btn) return;
    const id = btn.dataset.deleteMeal;
    const { selectedDate } = getUi();
    commit((draft) => {
      const day = ensureDay(draft, selectedDate);
      day.meals = day.meals.filter((m) => m.id !== id);
    });
  });
}

export function bind() {
  const dateInput = $('#trackerDate');
  dateInput?.addEventListener('change', () => {
    if (isISODate(dateInput.value)) setUi({ selectedDate: dateInput.value });
  });
  $('#btnToday')?.addEventListener('click', () => setUi({ selectedDate: todayISO() }));
  bindFlags();
  bindWater();
  bindMealForm();
}
