import { WORKOUT_SPLIT } from '../constants/plan.js';
import { commit, setUi } from '../state/store.js';
import { $, escapeHtml } from '../utils/dom.js';

const checkKey = (dayIdx, exIdx, dateISO) => `${dayIdx}-${exIdx}-${dateISO}`;

function renderDaySelector(activeDay) {
  document.querySelectorAll('[data-workout-day]').forEach((btn) => {
    const active = Number(btn.dataset.workoutDay) === activeDay;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

export function render(state, ui) {
  const plan = WORKOUT_SPLIT[ui.workoutDay];
  if (!plan) return;

  renderDaySelector(ui.workoutDay);
  $('#workoutDayTitle').textContent = plan.day;
  $('#workoutDayFocus').textContent = plan.focus;
  $('#workoutCount').textContent = `${plan.exercises.length} exercícios`;

  const list = $('#exerciseList');
  list.innerHTML = plan.exercises
    .map((ex, exIdx) => {
      const key = checkKey(ui.workoutDay, exIdx, ui.selectedDate);
      const done = Boolean(state.workoutCompletions[key]);
      return `
        <li class="exercise-item ${done ? 'is-done' : ''}">
          <label class="exercise-item__label">
            <input type="checkbox" class="check" data-exercise-key="${escapeHtml(key)}" ${done ? 'checked' : ''}>
            <span>
              <strong>${escapeHtml(ex.name)}</strong>
              <small>${escapeHtml(ex.sets)}</small>
            </span>
          </label>
        </li>`;
    })
    .join('');
}

export function bind() {
  document.querySelectorAll('[data-workout-day]').forEach((btn) => {
    btn.addEventListener('click', () => setUi({ workoutDay: Number(btn.dataset.workoutDay) }));
  });

  $('#exerciseList')?.addEventListener('change', (event) => {
    const input = event.target.closest('[data-exercise-key]');
    if (!input) return;
    const key = input.dataset.exerciseKey;
    commit((draft) => {
      draft.workoutCompletions[key] = input.checked;
    });
  });
}

