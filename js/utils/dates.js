/**
 * Utilitários de data sempre em horário LOCAL.
 * Nunca usar toISOString() para "hoje": ele devolve UTC e erra no Brasil após 21h.
 */

const MS_PER_DAY = 86_400_000;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isISODate(value) {
  if (typeof value !== 'string' || !ISO_RE.test(value)) return false;
  const d = parseISODate(value);
  return !Number.isNaN(d.getTime()) && toLocalISODate(d) === value;
}

export function toLocalISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toLocalISODate(new Date());
}

/** Meia-noite local da data ISO. */
export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso, days) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

/** Diferença em dias de calendário (to - from). Usa Date.UTC para ignorar horário de verão. */
export function daysBetween(fromISO, toISO) {
  const [y1, m1, d1] = fromISO.split('-').map(Number);
  const [y2, m2, d2] = toISO.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / MS_PER_DAY);
}

/** 0 = segunda … 5 = sábado/domingo (índice de WORKOUT_SPLIT). */
export function workoutIndexFor(iso) {
  const dow = parseISODate(iso).getDay(); // 0 = domingo
  if (dow === 0 || dow === 6) return 5;
  return dow - 1;
}

/** "2026-10-26" -> "26/10/2026" */
export function formatBR(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
