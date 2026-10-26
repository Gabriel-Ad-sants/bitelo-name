import { getState, replaceState } from '../state/store.js';
import { createEmptyState, exportState, importStateFromFile, getStorageSize } from '../services/storage.js';
import { $, formatNumber } from '../utils/dom.js';
import { toast } from '../ui/toast.js';

let deferredInstallPrompt = null;

export function setInstallPrompt(event) {
  deferredInstallPrompt = event;
  const btn = $('#btnInstall');
  if (btn) btn.hidden = false;
}

export function markInstalled() {
  deferredInstallPrompt = null;
  const btn = $('#btnInstall');
  if (btn) btn.hidden = true;
  const note = $('#installNote');
  if (note) note.textContent = 'App instalado.';
}

export function render(state) {
  const days = Object.keys(state.dailyLogs).length;
  const kb = getStorageSize() / 1024;
  const node = $('#storageInfo');
  if (node) {
    node.textContent = `${state.weightLogs.length} pesagens · ${days} dias registrados · ${formatNumber(kb, 1)} KB`;
  }
}

export function bind() {
  $('#btnExport')?.addEventListener('click', () => {
    exportState(getState());
    toast('Backup gerado');
  });

  $('#fileImport')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = await importStateFromFile(file);
      replaceState(imported);
      toast('Backup importado com sucesso');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  $('#btnReset')?.addEventListener('click', () => {
    if (!confirm('Apagar todos os registros deste aparelho? Recomendo exportar um backup antes.')) return;
    replaceState(createEmptyState());
    toast('Dados apagados', 'warning');
  });

  $('#btnInstall')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    $('#btnInstall').hidden = true;
    if (outcome === 'accepted') toast('Instalação iniciada');
  });

}
