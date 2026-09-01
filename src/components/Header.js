import { ICON } from './icons.js';

export function renderHeader() {
  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
  return `
    <div class="px-5 pt-6 pb-2 flex items-start justify-between shrink-0">
      <button data-action="openSettings" class="w-10 h-10 rounded-xl bg-white border border-line flex items-center justify-center text-ink shrink-0" aria-label="Ayarlar ve veri yönetimi">
        ${ICON.settings}
      </button>
      <div class="text-center flex-1 px-2">
        <p class="text-xs text-ink-soft mb-0.5">${today}</p>
        <p class="font-extrabold text-lg text-ink leading-tight">İyi günler!</p>
      </div>
      <button data-action="openSettings" class="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-white shrink-0" aria-label="Kullanıcılar">
        ${ICON.user}
      </button>
    </div>`;
}
