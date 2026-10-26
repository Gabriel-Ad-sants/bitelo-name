import { $ } from '../utils/dom.js';

const DURATION_MS = 2600;

/** Notificação não bloqueante. Conteúdo sempre via textContent (sem XSS). */
export function toast(message, tone = 'success') {
  const host = $('#toastHost');
  if (!host) return;

  const node = document.createElement('div');
  node.className = `toast toast--${tone}`;
  node.setAttribute('role', 'status');
  node.textContent = message;
  host.appendChild(node);

  requestAnimationFrame(() => node.classList.add('is-visible'));
  setTimeout(() => {
    node.classList.remove('is-visible');
    node.addEventListener('transitionend', () => node.remove(), { once: true });
  }, DURATION_MS);
}

/** Feedback tátil leve no celular (ignorado onde não há suporte). */
export function haptic(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* sem suporte: nada a fazer */
  }
}
