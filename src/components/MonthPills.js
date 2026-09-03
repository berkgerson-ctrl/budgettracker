import { ICON } from './icons.js';
import { monthShort } from '../utils/dates.js';

export function renderMonthPills(state) {
  const keys = Object.keys(state.months).sort();
  const pills = keys.map(k => {
    const active = k === state.currentMonth;
    return `<button data-action="selectMonth" data-key="${k}" class="pill row-enter px-4 py-2 rounded-full text-xs font-semibold ${active ? 'text-white bg-teal' : 'text-ink-soft bg-white border border-line'}">${monthShort(k)}</button>`;
  }).join('');
  return `
    <div id="monthPills" class="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar shrink-0">
      ${pills}
      <button data-action="addMonth" class="pill row-enter w-9 h-9 rounded-full bg-white border border-dashed border-ink-faint flex items-center justify-center text-ink-soft shrink-0" aria-label="Yeni ay ekle"><span class="w-4 h-4 inline-flex">${ICON.plus}</span></button>
    </div>`;
}
