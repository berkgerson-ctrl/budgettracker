import { ICON } from './icons.js';
import { formatCurrency, currencySymbol, escapeHtml } from '../utils/format.js';
import { formatDateTR } from '../utils/dates.js';
import { goalCurrentAmount, goalProgressPct, goalMonthsToComplete, goalRequiredMonthly } from '../state.js';

function contributionRow(c, currency) {
  return `
    <div class="flex items-center gap-2 row-enter">
      <span class="text-[11px] text-ink-faint flex-1 min-w-0">${formatDateTR(c.date)}</span>
      <div class="field flex items-center gap-1 px-2 py-1.5 w-24 shrink-0">
        <span class="text-ink-soft text-xs">${currencySymbol(currency)}</span>
        <input type="number" step="0.01" min="0" data-role="goalContribAmount" data-id="${c.id}" value="${c.amount}" class="w-full text-right text-xs text-ink">
      </div>
      <button data-action="deleteGoalContribution" data-id="${c.id}" class="w-6 h-6 rounded-md bg-coral-tint text-coral flex items-center justify-center shrink-0" aria-label="Sil">
        <span class="w-3 h-3 inline-flex">${ICON.close}</span>
      </button>
    </div>`;
}

function goalCard(state, goal) {
  const currency = state.settings.currency;
  const current = goalCurrentAmount(goal.id, state.goalContributions);
  const pct = Math.round(goalProgressPct(goal, current));
  const monthsLeft = goalMonthsToComplete(goal, current);
  const requiredMonthly = goalRequiredMonthly(goal, current);
  const remaining = Math.max(0, goal.targetAmount - current);
  const contributions = state.goalContributions
    .filter(c => c.goalId === goal.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  let simulationText = '';
  if (goal.monthlyContribution > 0) {
    simulationText = monthsLeft === 0
      ? `Hedefe ulaşıldı! 🎉`
      : `Aylık ${formatCurrency(goal.monthlyContribution, currency)} ile <b>${monthsLeft} ayda</b> tamamlanır.`;
  } else if (goal.targetDate) {
    simulationText = requiredMonthly === 0
      ? `Hedefe ulaşıldı! 🎉`
      : `${formatDateTR(goal.targetDate)} tarihine yetişmek için aylık <b>${formatCurrency(requiredMonthly, currency)}</b> gerekir.`;
  } else {
    simulationText = `Aylık tutar ya da vade tarihi belirtilmedi.`;
  }

  return `
    <div class="card rounded-2xl p-4 row-enter">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style="background:var(--amber-tint); color:var(--amber);">${ICON.target}</span>
          <div class="min-w-0">
            <p class="font-bold text-sm text-ink truncate">${escapeHtml(goal.name)}</p>
            <p class="text-[11px] text-ink-faint">${formatCurrency(current, currency)} / ${formatCurrency(goal.targetAmount, currency)}</p>
          </div>
        </div>
        <button data-action="deleteGoal" data-id="${goal.id}" class="w-7 h-7 rounded-lg bg-coral-tint text-coral flex items-center justify-center shrink-0" aria-label="Sil">
          <span class="w-3.5 h-3.5 inline-flex">${ICON.close}</span>
        </button>
      </div>
      <div class="w-full h-2.5 rounded-full bg-app overflow-hidden mb-2">
        <div class="h-full rounded-full" style="width:${pct}%; background:linear-gradient(90deg, var(--teal), var(--amber));"></div>
      </div>
      <div class="flex items-center justify-between text-[11px] text-ink-soft mb-3">
        <span>%${pct} tamamlandı</span>
        <span>${formatCurrency(remaining, currency)} kaldı</span>
      </div>
      <p class="text-[11px] text-ink-soft leading-snug mb-3">${simulationText}</p>
      <div class="flex items-center gap-2">
        <div class="field flex items-center gap-1 px-3 py-2 flex-1">
          <span class="text-ink-soft text-xs">${currencySymbol(currency)}</span>
          <input type="number" step="0.01" min="0" placeholder="Bu ay eklenecek tutar" data-role="goalContributionInput" data-id="${goal.id}" class="w-full text-sm text-ink">
        </div>
        <button data-action="addGoalContribution" data-id="${goal.id}" class="px-4 py-2 rounded-xl text-white text-xs font-semibold bg-teal shrink-0">Ekle</button>
      </div>
      ${contributions.length ? `
      <div class="mt-3 pt-3 border-t border-line">
        <p class="text-[10px] font-semibold text-ink-faint uppercase tracking-wide mb-2">Katkı Geçmişi <span class="font-normal normal-case text-ink-faint">— düzenlenebilir / silinebilir</span></p>
        <div class="space-y-1.5">${contributions.map(c => contributionRow(c, currency)).join('')}</div>
      </div>` : ''}
    </div>`;
}

export function renderGoalsScreen(state) {
  const goals = state.goals || [];
  const showForm = state.ui.showNewGoalForm;
  const sym = currencySymbol(state.settings.currency);

  const form = `
    <div class="card rounded-2xl p-4 mb-4 ${showForm ? '' : 'hidden'}">
      <h3 class="font-bold text-sm text-ink mb-3">Yeni Hedef</h3>
      <div class="field px-3 py-2.5 mb-2.5">
        <input type="text" id="goalName" placeholder="Örn. Saat" class="w-full text-sm text-ink">
      </div>
      <div class="field flex items-center gap-1 px-3 py-2.5 mb-2.5">
        <span class="text-ink-soft text-sm">${sym}</span>
        <input type="number" step="0.01" min="0" id="goalTarget" placeholder="Hedef tutar" class="w-full text-sm text-ink">
      </div>
      <div class="grid grid-cols-2 gap-2 mb-1">
        <div class="field flex items-center gap-1 px-3 py-2.5">
          <span class="text-ink-soft text-sm">${sym}</span>
          <input type="number" step="0.01" min="0" id="goalMonthly" placeholder="Aylık tutar" class="w-full text-sm text-ink">
        </div>
        <div class="field px-3 py-2.5">
          <input type="date" id="goalDate" class="w-full text-sm text-ink">
        </div>
      </div>
      <p class="text-[10px] text-ink-faint mb-3">Aylık tutar veya vade tarihinden yalnızca birini gir — diğerini uygulama hesaplar.</p>
      <button data-action="submitNewGoal" class="w-full py-2.5 rounded-xl text-white font-semibold text-sm bg-teal">Hedefi Oluştur</button>
    </div>`;

  return `
    <div class="pt-2 pb-1 flex items-center justify-between">
      <div>
        <h2 class="font-extrabold text-xl text-ink">Hedefler</h2>
        <p class="text-xs text-ink-soft">Hedef odaklı tasarruf planlayıcısı</p>
      </div>
      <button data-action="toggleNewGoalForm" class="w-9 h-9 rounded-full flex items-center justify-center text-white bg-teal shrink-0" aria-label="Yeni hedef">
        <span class="w-4 h-4 inline-flex">${ICON.plus}</span>
      </button>
    </div>
    <div class="mt-4">
      ${form}
      ${goals.length === 0 && !showForm ? `<p class="text-xs text-ink-faint italic text-center py-8">Henüz bir hedef eklemedin. Sağ üstteki + ile başla.</p>` : ''}
      <div class="space-y-3 mb-4">${goals.map(g => goalCard(state, g)).join('')}</div>
    </div>
  `;
}
