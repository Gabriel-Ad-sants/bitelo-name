/**
 * Store mínima e previsível:
 *  - state: dados persistidos (localStorage)
 *  - ui:    estado de interface efêmero (data selecionada, dia do treino…)
 * Toda mutação passa por commit()/setUi(), que notifica os assinantes.
 */
import { loadState, saveState } from '../services/storage.js';
import { todayISO, workoutIndexFor } from '../utils/dates.js';

let state = loadState();
let ui = {
  selectedDate: todayISO(),
  workoutDay: workoutIndexFor(todayISO()),
};
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(state, ui));
}

export const getState = () => state;
export const getUi = () => ui;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Aplica uma mutação sobre uma cópia do estado.
 * Só substitui o estado se a gravação for bem-sucedida (evita estado divergente do storage).
 * @returns {boolean} true se salvou
 */
export function commit(mutator) {
  const draft = structuredClone(state);
  mutator(draft);
  if (!saveState(draft)) return false;
  state = draft;
  notify();
  return true;
}

export function replaceState(nextState) {
  if (!saveState(nextState)) return false;
  state = nextState;
  notify();
  return true;
}

export function setUi(patch) {
  ui = { ...ui, ...patch };
  notify();
}
