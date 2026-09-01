import { ICON } from './icons.js';
import { monthLabel } from '../utils/dates.js';
import { currencySymbol } from '../utils/format.js';

export function renderQuickAddModal(state) {
  const sym = currencySymbol(state.settings.currency);
  const categoryOptions = `<option value="">Kategori yok</option>` + state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  return `
  <div id="modalAddExtra" class="fixed inset-0 modal-overlay ${state.ui.openModal === 'modalAddExtra' ? 'flex' : 'hidden-screen'} items-end sm:items-center justify-center z-50">
    <div class="w-full sm:max-w-[380px] bg-white rounded-t-3xl sm:rounded-3xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-extrabold text-lg text-ink">Ekstra Masraf Ekle</h3>
        <button data-action="closeModal" data-modal="modalAddExtra" class="w-8 h-8 rounded-full bg-app flex items-center justify-center text-ink-soft">
          <span class="w-4 h-4 inline-flex">${ICON.close}</span>
        </button>
      </div>
      <p class="text-xs text-ink-soft mb-4">Bu masraf <span class="font-semibold text-ink">${monthLabel(state.currentMonth)}</span> ayına eklenecek.</p>
      <label class="text-xs font-medium text-ink-soft mb-1 block">Açıklama</label>
      <div class="field px-3 py-2.5 mb-3">
        <input type="text" id="quickExtraName" placeholder="Örn. Araç bakımı" class="w-full text-sm text-ink">
      </div>
      <label class="text-xs font-medium text-ink-soft mb-1 block">Kategori</label>
      <div class="field px-3 py-2.5 mb-3">
        <select id="quickExtraCategory" class="w-full text-sm text-ink">${categoryOptions}</select>
      </div>
      <label class="text-xs font-medium text-ink-soft mb-1 block">Tutar</label>
      <div class="field px-3 py-2.5 mb-5 flex items-center gap-1">
        <span class="text-ink-soft text-sm">${sym}</span>
        <input type="number" id="quickExtraAmount" step="0.01" min="0" placeholder="0" class="w-full text-sm text-ink">
      </div>
      <button data-action="submitAddExtra" class="w-full py-3 rounded-xl text-white font-semibold text-sm bg-teal">Ekle</button>
    </div>
  </div>`;
}
