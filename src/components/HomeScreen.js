import { ICON } from './icons.js';
import { formatCurrency } from '../utils/format.js';
import { monthLabel } from '../utils/dates.js';
import { monthTotals, activeUsers, goalCurrentAmount, goalProgressPct } from '../state.js';

function detailLine(label, val, currency) {
  return `<div class="flex items-center justify-between py-1"><span class="text-xs text-ink-soft">${label}</span><span class="text-xs font-semibold text-ink">${formatCurrency(val, currency)}</span></div>`;
}

function accordionRow(state, key, icon, bg, fg, title, subtitle, amount, negative, detailHtml) {
  const open = state.ui.openRows.has(key);
  const currency = state.settings.currency;
  return `
    <div class="card rounded-xl overflow-hidden">
      <button data-action="toggleAccordion" data-key="${key}" class="w-full p-3 flex items-center gap-3 text-left">
        <span class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style="background:${bg}; color:${fg};"><span class="w-5 h-5 inline-flex">${icon}</span></span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-semibold text-ink">${title}</span>
          <span class="block text-[11px] text-ink-faint">${subtitle}</span>
        </span>
        <span class="text-sm font-bold shrink-0" style="color:${negative ? 'var(--ink)' : 'var(--teal-deep)'};">${negative ? '−' : ''}${formatCurrency(amount, currency)}</span>
        <span class="w-4 h-4 shrink-0 text-ink-faint transition-transform inline-flex ${open ? 'rotate-180' : ''}">${ICON.chevronDown}</span>
      </button>
      <div class="${open ? '' : 'hidden'} px-3 pb-3 pt-1 border-t border-line">${detailHtml}</div>
    </div>`;
}

export function renderHomeScreen(state) {
  const m = state.months[state.currentMonth];
  const users = activeUsers(state.users);
  const t = monthTotals(m, state.users);
  const currency = state.settings.currency;
  const pctLabel = Math.round(t.pct);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - t.pct / 100);

  const incomeDetail = users.map(u => detailLine(u.name, m.incomes[u.id] || 0, currency)).join('') + detailLine('Ekstra Gelir', m.extraIncome || 0, currency);
  const fixedDetail = m.fixedExpenses.length === 0
    ? `<p class="text-xs text-ink-faint italic py-1">Sabit gider eklenmedi.</p>`
    : m.fixedExpenses.map(i => detailLine(i.name || 'Sabit gider', i.amount, currency)).join('');
  const extrasDetail = m.extras.length === 0
    ? `<p class="text-xs text-ink-faint italic py-1">Bu ay için ekstra masraf eklenmedi.</p>`
    : m.extras.map(i => detailLine(i.name || 'Ekstra', i.amount, currency)).join('');
  const poolDetail = detailLine('Ortak Hesap', m.pool, currency) + `<p class="text-[10px] text-ink-faint leading-snug pt-1">Ortak hesap birikim hesabınız olduğundan bu tutar toplam varlığınızdan düşülür.</p>`;
  const birikimDetail = detailLine('Ortak Birikim', m.birikim, currency) + `<p class="text-[10px] text-ink-faint leading-snug pt-1">Gider gibi görünür, ancak toplam varlığınızdan düşülmez — Ortak Birikim katmanına eklenir.</p>`;
  const allowanceDetail = users.map(u => detailLine(`${u.name} Harçlık`, m.allowance[u.id] || 0, currency)).join('')
    + users.map(u => `<div class="flex items-center justify-between py-1"><span class="text-xs text-ink-soft">${u.name} Limit (not)</span><span class="text-xs font-semibold text-ink">${formatCurrency(m.personalNote[u.id] || 0, currency)}</span></div>`).join('');

  const userRows = users.map(u => {
    const ps = m.personalSavings[u.id] || { amount: 0, redirectToJoint: false };
    const detail = detailLine(`${u.name} Kişisel Birikim`, ps.amount, currency) +
      `<p class="text-[10px] text-ink-faint leading-snug pt-1">${ps.redirectToJoint ? 'Bu tutar Ortak Birikim hesabına yönlendiriliyor.' : 'Bu tutar ' + u.name + '’in kişisel birikim katmanına eklenir.'}</p>`;
    return accordionRow(state, `personal-${u.id}`, ICON.savings, 'var(--violet-tint)', 'var(--violet)', `${u.name} Kişisel Birikim`, ps.redirectToJoint ? 'Ortak hesaba yönlendiriliyor' : 'Kişisel katmana eklenir', ps.amount, true, detail);
  }).join('');

  const activeGoals = (state.goals || []).filter(g => g.status !== 'archived');
  const goalsPreview = activeGoals.slice(0, 2).map(g => {
    const cur = goalCurrentAmount(g.id, state.goalContributions);
    const pct = Math.round(goalProgressPct(g, cur));
    return `
      <button data-tab="goals" class="w-full text-left card rounded-xl p-3 flex items-center gap-3">
        <span class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style="background:var(--amber-tint); color:var(--amber);">${ICON.target}</span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-semibold text-ink truncate">${g.name}</span>
          <span class="block text-[11px] text-ink-faint">%${pct} tamamlandı</span>
        </span>
        <span class="text-sm font-bold text-ink shrink-0">${formatCurrency(cur, currency)}</span>
      </button>`;
  }).join('');

  return `
    <div class="rounded-2xl p-5 mt-2 text-white relative overflow-hidden" style="background:linear-gradient(135deg, var(--teal), var(--teal-deep));">
      <p class="text-xs opacity-90">Bu Ayki Bütçe</p>
      <p class="font-extrabold text-lg mb-4">${monthLabel(state.currentMonth)}</p>
      <div class="flex items-center gap-4">
        <div class="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 120 120" class="w-28 h-28 -rotate-90">
            <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.28)" stroke-width="10" fill="none"/>
            <circle cx="60" cy="60" r="52" stroke="#ffffff" stroke-width="10" fill="none" stroke-linecap="round"
              stroke-dasharray="${circumference.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="font-extrabold text-xl">%${pctLabel}</span>
            <span class="text-[9px] opacity-90">kullanıldı</span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[11px] opacity-80">Harcanan</p>
          <p class="font-bold text-sm mb-2">${formatCurrency(t.totalOut, currency)}</p>
          <p class="text-[11px] opacity-80">Kalan</p>
          <p class="font-bold text-sm">${formatCurrency(t.net, currency)}</p>
        </div>
      </div>
    </div>

    ${!state.connection.demoMode ? '' : `
    <div class="mt-4 card rounded-xl p-3 flex items-center gap-3" style="border-color:var(--amber);">
      <span class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style="background:var(--amber-tint); color:var(--amber);">${ICON.globe}</span>
      <span class="flex-1 text-xs text-ink-soft">Demo modundasınız — veriler yalnızca bu tarayıcıda tutulur. Google Sheets'e bağlanmak için sol üstteki ayarlar simgesine dokunun.</span>
    </div>`}

    <div class="mt-5">
      <h3 class="font-bold text-sm text-ink mb-3">Bu Ay Özeti <span class="text-[10px] font-normal text-ink-faint">— detay için başlığa dokun</span></h3>
      <div class="space-y-2">
        ${accordionRow(state, 'income', ICON.income, 'var(--teal-tint)', 'var(--teal-deep)', 'Gelir', users.map(u => u.name).join(' + ') + ' + Ekstra', t.totalIncome, false, incomeDetail)}
        ${accordionRow(state, 'fixed', ICON.fixed, 'var(--amber-tint)', 'var(--amber)', 'Sabit Masraflar', m.fixedExpenses.length + ' kalem', t.totalFixed, true, fixedDetail)}
        ${accordionRow(state, 'extras', ICON.extra, 'var(--coral-tint)', 'var(--coral)', 'Ekstralar', m.extras.length + ' kalem', t.totalExtras, true, extrasDetail)}
        ${accordionRow(state, 'birikim', ICON.savings, 'var(--teal-tint)', 'var(--teal-deep)', 'Ortak Birikim', 'Toplam varlığa eklenir', m.birikim, true, birikimDetail)}
        ${userRows}
        ${accordionRow(state, 'pool', ICON.pool, 'var(--coral-tint)', 'var(--coral)', 'Ortak Hesap', 'Toplam varlıktan düşülür', m.pool, true, poolDetail)}
        ${accordionRow(state, 'allowance', ICON.allowance, 'var(--teal-tint)', 'var(--teal-deep)', 'Harçlıklar', users.map(u => u.name).join(' + '), t.totalAllowance, true, allowanceDetail)}
      </div>
    </div>

    ${activeGoals.length ? `
    <div class="mt-5">
      <h3 class="font-bold text-sm text-ink mb-3">Hedefler</h3>
      <div class="space-y-2">${goalsPreview}</div>
    </div>` : ''}

    <button data-tab="wealth" class="w-full card rounded-2xl p-4 mt-5 mb-4 flex items-center justify-between text-left">
      <span>
        <span class="block text-xs text-ink-soft">Ay Sonu Ana Varlık</span>
        <span class="block font-extrabold text-xl text-ink">${formatCurrency(state.__mainWealthEnd ?? 0, currency)}</span>
      </span>
      <span class="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style="background:var(--teal-tint); color:var(--teal-deep);">
        <span class="w-4 h-4 inline-flex">${ICON.arrowUp}</span>
      </span>
    </button>
  `;
}
