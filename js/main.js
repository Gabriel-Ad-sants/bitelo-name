/**
 * Bootstrap do Bitelo.
 * Ordem: bind de eventos (uma vez) → render inicial → assinatura para re-render.
 */
import { subscribe, getState, getUi } from './state/store.js';
import { initTabs } from './ui/tabs.js';
import * as dashboard from './features/dashboard.js';
import * as checkin from './features/checkin.js';
import * as workout from './features/workout.js';
import * as weight from './features/weight.js';
import * as settings from './features/settings.js';


const features = [dashboard, checkin, workout, weight, settings];

function renderAll() {
  const state = getState();
  const ui = getUi();
  features.forEach((feature) => feature.render?.(state, ui));
}

function bindAll() {
  features.forEach((feature) => feature.bind?.());
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.error('Falha ao registrar o Service Worker:', err);
    });
  });
}

function setupInstall() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    settings.setInstallPrompt(event);
  });
  window.addEventListener('appinstalled', settings.markInstalled);
}

function setupRollover() {
  // Se o app ficou aberto de um dia para o outro, "hoje" precisa ser recalculado.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') renderAll();
  });
}

function init() {
  initTabs('checkin');
  bindAll();
  subscribe(renderAll);
  renderAll();
  setupInstall();
  setupRollover();
  registerServiceWorker();
}

init();
