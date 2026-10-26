import { START_WEIGHT, TARGET_WEIGHT, TARGET_DATE_ISO, DAILY_TARGETS } from '../constants/plan.js';
import { createEmptyDay } from '../services/storage.js';
import { todayISO, daysBetween, formatBR } from '../utils/dates.js';
import { $, formatNumber, clamp } from '../utils/dom.js';

const sortedWeights = (state) => [...state.weightLogs].sort((a, b) => a.date.localeCompare(b.date));

/** Média dos últimos 7 registros — suaviza a variação diária de água. */
function movingAverage(logs, window = 7) {
  if (!logs.length) return null;
  const slice = logs.slice(-window);
  return slice.reduce((sum, l) => sum + l.weight, 0) / slice.length;
}

function setText(id, text) {
  const node = $(`#${id}`);
  if (node) node.textContent = text;
}

function setStatus(id, done, doneText, pendingText, doneClass, pendingClass = 'text-muted') {
  const node = $(`#${id}`);
  if (!node) return;
  node.textContent = done ? doneText : pendingText;
  node.className = `ribbon-value ${done ? doneClass : pendingClass}`;
}

export function render(state) {
  const logs = sortedWeights(state);
  const current = logs.length ? logs.at(-1).weight : START_WEIGHT;

  const totalToLose = START_WEIGHT - TARGET_WEIGHT;
  const pct = clamp(((START_WEIGHT - current) / totalToLose) * 100, 0, 100);

  setText('dashCurrentWeight', formatNumber(current));
  setText('dashProgressPct', `${formatNumber(pct)}%`);
  const ring = $('#ringBar');
  ring.style.strokeDashoffset = `${100 - pct}`;
  ring.style.opacity = pct > 0 ? '1' : '0';
  setText('dashRemaining', `Faltam ${formatNumber(Math.max(0, current - TARGET_WEIGHT))} kg`);

  const avg = movingAverage(logs);
  setText('dashAverage', avg === null ? '—' : `${formatNumber(avg)} kg`);

  const daysLeft = Math.max(0, daysBetween(todayISO(), TARGET_DATE_ISO));
  setText('dashDaysRemaining', `${daysLeft} dias para ${formatBR(TARGET_DATE_ISO)}`);

  // Resumo do dia atual (sempre "hoje" real, independente da data selecionada)
  const today = state.dailyLogs[todayISO()] ?? createEmptyDay();
  const kcal = today.meals.reduce((s, m) => s + m.kcal, 0);
  const prot = today.meals.reduce((s, m) => s + m.prot, 0);

  setText('ribbonKcal', `${Math.round(kcal)} / ${DAILY_TARGETS.kcal}`);
  setText('ribbonProt', `${Math.round(prot)}g / ${DAILY_TARGETS.protein}g`);
  const waterTarget = DAILY_TARGETS.waterLiters * 1000;
  const waterDone = today.waterMl >= waterTarget;
  setText('ribbonWater', `${Math.round(today.waterMl).toLocaleString('pt-BR')} / ${waterTarget.toLocaleString('pt-BR')} ml`);
  $('#ribbonWater').className = `ribbon-value ${waterDone ? 'text-cyan' : 'text-muted'}`;
  setStatus('ribbonCardio', today.cardio, 'Feito', 'Pendente', 'text-violet');
  setStatus('ribbonGym', today.gym, 'Feito', 'Pendente', 'text-amber');
}
