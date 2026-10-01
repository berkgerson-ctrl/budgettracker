import { ICON } from './icons.js';
import { monthLabel } from '../utils/dates.js';
import { currencySymbol } from '../utils/format.js';

const MODES = {
  expense: { title: 'Ekstra Masraf Ekle', hint: 'ayına ekstra masraf olarak eklenecek.', icon: ICON.extra, color: 'coral' },
  income: { title: 'Gelir Ekle', hint: 'ayının Ekstra Gelir alanına eklenecek.', icon: ICON.income, color: 'teal' },
  savings: { title: 'Ortak Birikime Ekle', hint: 'ayının Ortak Birikim alanına eklenecek.', icon: ICON.savings, color: 'teal' }
};

export function renderQuickActionsSheet(state) {
  const items = [
    { mode: 'income', label: 'Gelir Ekle', sub: 'Ekstra gelir kaydet', icon: ICON.income, bg: 'var(--teal-tint)', fg: 'var(--teal-deep)' },
    { mode: 'expense', label: 'Gider Ekle', sub: 'Ekstra masraf kaydet', icon: ICON.extra, bg: 'var(--coral-tint)', fg: 'var(--coral)' },
    { mode: 'savings', label: 'Birikime Ekle', sub: 'Ortak birikime aktar', icon: ICON.savings, bg: 'var(--violet-tint)', fg: 'var(--violet)' }
  ];
  return `
  <div id="modalQuickActions" class="fixed inset-0 modal-overlay ${state.ui.openModal === 'modalQuickActions' ? 'flex' : 'hidden-screen'} items-end sm:items-center justify-center z-50">
    <div class="w-full sm:max-w-[380px] bg-card rounded-t-3xl sm:rounded-3xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-extrabold text-lg text-ink">Hızlı Ekle</h3>
        <button data-action="closeModal" data-modal="modalQuickActions" class="w-8 h-8 rounded-full bg-app flex items-center justify-center text-ink-soft">
          <span class="w-4 h-4 inline-flex">${ICON.close}</span>
        </button>
      </div>
      <p class="text-xs text-ink-soft mb-4">Hangi sekmede olursan ol, buradan ${monthLabel(state.currentMonth)} ayına hızlıca ekleyebilirsin.</p>
      <div class="space-y-2">
        ${items.map(i => `
          <button data-action="chooseQuickAction" data-mode="${i.mode}" class="w-full card rounded-xl p-3 flex items-center gap-3 text-left">
            <span class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style="background:${i.bg}; color:${i.fg};"><span class="w-5 h-5 inline-flex">${i.icon}</span></span>
            <span class="flex-1 min-w-0">
              <span class="block text-sm font-semibold text-ink">${i.label}</span>
              <span class="block text-[11px] text-ink-faint">${i.sub}</span>
            </span>
            <span class="w-4 h-4 text-ink-faint inline-flex">${ICON.chevronDown}</span>
          </button>`).join('')}
      </div>
    </div>
  </div>`;
}

export function renderQuickAddModal(state) {
  const mode = MODES[state.ui.quickAddMode] ? state.ui.quickAddMode : 'expense';
  const cfg = MODES[mode];
  const sym = currencySymbol(state.settings.currency);
  const categoryOptions = `<option value="">Kategori yok</option>` + state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  return `
  <div id="modalAddExtra" class="fixed inset-0 modal-overlay ${state.ui.openModal === 'modalAddExtra' ? 'flex' : 'hidden-screen'} items-end sm:items-center justify-center z-50">
    <div class="w-full sm:max-w-[380px] bg-card rounded-t-3xl sm:rounded-3xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-extrabold text-lg text-ink">${cfg.title}</h3>
        <button data-action="closeModal" data-modal="modalAddExtra" class="w-8 h-8 rounded-full bg-app flex items-center justify-center text-ink-soft">
          <span class="w-4 h-4 inline-flex">${ICON.close}</span>
        </button>
      </div>
      <p class="text-xs text-ink-soft mb-4">Bu tutar <span class="font-semibold text-ink">${monthLabel(state.currentMonth)}</span> ${cfg.hint}</p>
      ${mode === 'expense' ? `
      <label class="text-xs font-medium text-ink-soft mb-1 block">Açıklama</label>
      <div class="field px-3 py-2.5 mb-3">
        <input type="text" id="quickExtraName" placeholder="Örn. Araç bakımı" class="w-full text-sm text-ink">
      </div>
      <label class="text-xs font-medium text-ink-soft mb-1 block">Kategori</label>
      <div class="field px-3 py-2.5 mb-3">
        <select id="quickExtraCategory" class="w-full text-sm text-ink">${categoryOptions}</select>
      </div>` : ''}
      <label class="text-xs font-medium text-ink-soft mb-1 block">Tutar</label>
      <div class="field px-3 py-2.5 mb-2 flex items-center gap-1">
        <span class="text-ink-soft text-sm">${sym}</span>
        <input type="text" inputmode="decimal" autocomplete="off" id="quickExtraAmount" placeholder="0" class="w-full text-sm text-ink">
      </div>
      <p class="text-[10px] text-ink-faint mb-4">İpucu: "150+45" gibi bir işlem de yazabilirsin, otomatik hesaplanır.</p>
      <button data-action="submitAddExtra" class="w-full py-3 rounded-xl text-white font-semibold text-sm bg-teal">Ekle</button>
    </div>
  </div>`;
}
