import { ICON } from './icons.js';
import { activeUsers } from '../state.js';

export function renderHeader(state) {
  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
  const users = activeUsers(state.users);
  const primary = users[0];
  const greeting = primary ? `İyi günler ${primary.name}!` : 'İyi günler!';
  return `
    <div class="px-5 pt-6 pb-2 flex items-center justify-between shrink-0">
      <div class="text-left flex-1 min-w-0 pr-2">
        <p class="text-xs text-ink-soft mb-0.5">${today}</p>
        <p class="font-extrabold text-lg text-ink leading-tight truncate">${greeting}</p>
      </div>
      <button data-action="openSettings" class="w-10 h-10 rounded-xl bg-white border border-line flex items-center justify-center text-ink shrink-0" aria-label="Ayarlar">
        ${ICON.gear}
      </button>
    </div>`;
}
