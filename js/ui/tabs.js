import { $$ } from '../utils/dom.js';

/** Navegação entre as views. Estado de aba é local (não persistido). */
export function initTabs(defaultView = 'checkin') {
  const buttons = $$('[data-view-btn]');
  const views = $$('[data-view]');

  function show(view) {
    views.forEach((el) => {
      el.hidden = el.dataset.view !== view;
    });
    buttons.forEach((btn) => {
      const active = btn.dataset.viewBtn === view;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    window.scrollTo(0, 0);
  }

  buttons.forEach((btn) => btn.addEventListener('click', () => show(btn.dataset.viewBtn)));
  show(defaultView);
}
