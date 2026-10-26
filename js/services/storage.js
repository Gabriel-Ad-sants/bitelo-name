/**
 * Camada de persistência isolada.
 * - Mesma chave da versão antiga → dados existentes são preservados.
 * - Dados corrompidos NUNCA são sobrescritos sem backup.
 * - Migração de schema centralizada aqui.
 */
import { START_WEIGHT, TARGET_WEIGHT, TARGET_DATE_ISO, DAILY_TARGETS } from '../constants/plan.js';
import { isISODate, todayISO } from '../utils/dates.js';

export const STORAGE_KEY = 'bitelo_tracker_data';
export const SCHEMA_VERSION = 2;

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyDay() {
  return { gym: false, cardio: false, waterMl: 0, clean: false, meals: [] };
}

export function ensureDay(state, dateISO) {
  if (!state.dailyLogs[dateISO]) state.dailyLogs[dateISO] = createEmptyDay();
  return state.dailyLogs[dateISO];
}

export function createEmptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    startWeight: START_WEIGHT,
    targetWeight: TARGET_WEIGHT,
    targetDate: TARGET_DATE_ISO,
    weightLogs: [],          // [{ date: 'YYYY-MM-DD', weight: number }]
    dailyLogs: {},           // 'YYYY-MM-DD' -> { gym, cardio, water, clean, meals: [] }
    workoutCompletions: {},  // 'dayIdx-exIdx-YYYY-MM-DD' -> boolean
  };
}

function normalizeMeal(meal = {}) {
  return {
    id: typeof meal.id === 'string' && meal.id ? meal.id : newId(),
    desc: String(meal.desc || 'Refeição').slice(0, 120),
    kcal: toNumber(meal.kcal),
    prot: toNumber(meal.prot),
    carb: toNumber(meal.carb),
    fat: toNumber(meal.fat),
  };
}

function normalizeDay(day = {}) {
  // v1 guardava água como boolean (true = meta batida). v2 usa ml.
  let waterMl = 0;
  if (typeof day.waterMl === 'number') waterMl = toNumber(day.waterMl);
  else if (day.water === true) waterMl = DAILY_TARGETS.waterLiters * 1000;

  return {
    gym: Boolean(day.gym),
    cardio: Boolean(day.cardio),
    waterMl: Math.min(waterMl, 10000),
    clean: Boolean(day.clean),
    meals: Array.isArray(day.meals) ? day.meals.map(normalizeMeal) : [],
  };
}

function isValidWeightLog(log) {
  return isObject(log) && isISODate(log.date) && Number.isFinite(log.weight) && log.weight > 0;
}

/** Migra qualquer estado anterior (v1 sem schemaVersion ou v2) para o schema atual. */
export function migrate(raw) {
  const base = createEmptyState();

  // Uma pesagem por dia: a última gravada vence.
  const byDate = new Map();
  if (Array.isArray(raw.weightLogs)) {
    raw.weightLogs.filter(isValidWeightLog).forEach((log) => byDate.set(log.date, log.weight));
  }
  const weightLogs = [...byDate.entries()]
    .map(([date, weight]) => ({ date, weight }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const dailyLogs = {};
  if (isObject(raw.dailyLogs)) {
    for (const [date, day] of Object.entries(raw.dailyLogs)) {
      if (isISODate(date)) dailyLogs[date] = normalizeDay(day);
    }
  }

  const workoutCompletions = {};
  if (isObject(raw.workoutCompletions)) {
    for (const [key, value] of Object.entries(raw.workoutCompletions)) {
      workoutCompletions[key] = Boolean(value);
    }
  }

  return { ...base, weightLogs, dailyLogs, workoutCompletions, schemaVersion: SCHEMA_VERSION };
}

function backupCorrupt(raw) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_corrupt_${Date.now()}`, raw);
  } catch (err) {
    console.error('Não foi possível criar backup do dado corrompido:', err);
  }
}

export function loadState() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    console.error('localStorage indisponível:', err);
    return createEmptyState();
  }
  if (!raw) return createEmptyState();

  try {
    return migrate(JSON.parse(raw));
  } catch (err) {
    console.error('Dados corrompidos. Backup criado antes de reiniciar.', err);
    backupCorrupt(raw);
    return createEmptyState();
  }
}

/** Retorna true se gravou; false em caso de quota/modo privado. */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('Falha ao salvar dados:', err);
    return false;
  }
}

export function getStorageSize() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '';
    return new Blob([raw]).size;
  } catch {
    return 0;
  }
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bitelo-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Valida e importa um backup. Lança erro legível se o arquivo for inválido. */
export async function importStateFromFile(file) {
  if (!file || file.size > 5_000_000) throw new Error('Arquivo inválido ou maior que 5 MB.');

  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('O arquivo não é um JSON válido.');
  }
  if (!isObject(parsed) || !Array.isArray(parsed.weightLogs) || !isObject(parsed.dailyLogs)) {
    throw new Error('Arquivo de backup do Bitelo não reconhecido.');
  }

  const state = migrate(parsed);
  if (!saveState(state)) throw new Error('Sem espaço de armazenamento para importar.');
  return state;
}

