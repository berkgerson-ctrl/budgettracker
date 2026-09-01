import { ICON } from './icons.js';
import { formatCurrency, escapeHtml, currencySymbol } from '../utils/format.js';
import { monthLabel } from '../utils/dates.js';
import { monthTotals, activeUsers } from '../state.js';

function categoryOptions(state, selectedId) {
  return `<option value="">Kategori yok</option>` + state.categories.map(c =>
    `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
  ).join('');
}

function lineItemRow(item, kind, state) {
  return `
    <div class="flex items-center gap-2 row-enter">
      <div class="field flex-1 px-3 py-2">
        <input type="text" placeholder="Açıklama" data-role="${kind}Name" data-id="${item.id}" value="${escapeHtml(item.name)}" class="w-full text-sm text-ink">
      </div>
      <div class="field px-2 py-2 shrink-0 w-28">
        <select data-role="${kind}Category" data-id="${item.id}" class="w-full text-xs text-ink-soft">${categoryOptions(state, item.categoryId)}</select>
      </div>
      <div class="field flex items-center gap-1 px-3 py-2 w-24 shrink-0">
        <span class="text-ink-soft text-xs">${currencySymbol(state.settings.currency)}</span>
        <input type="number" step="0.01" min="0" data-role="${kind}Amount" data-id="${item.id}" value="${item.amount}" class="w-full text-right text-sm text-ink">
      </div>
      <button data-action="delete${kind === 'fixed' ? 'Fixed' : 'Extra'}" data-id="${item.id}" class="w-8 h-8 rounded-lg bg-coral-tint text-coral flex items-center justify-center shrink-0" aria-label="Sil">
        <span class="w-3.5 h-3.5 inline-flex">${ICON.close}</span>
      </button>
    </div>`;
}

export function renderExpensesScreen(state) {
  const m = state.months[state.currentMonth];
  const users = activeUsers(state.users);
  const t = monthTotals(m, state.users);
  const currency = state.settings.currency;
  const sym = currencySymbol(currency);

  const incomeRows = users.map(u => `
    <div class="flex items-center justify-between gap-3">
      <label class="text-sm text-ink-soft">${escapeHtml(u.name)} — Maaş</label>
      <div class="field flex items-center gap-1 px-3 py-2 w-32">
        <span class="text-ink-soft text-xs">${sym}</span>
        <input type="number" step="0.01" min="0" data-role="income" data-user="${u.id}" value="${m.incomes[u.id] || 0}" class="w-full text-right text-sm text-ink">
      </div>
    </div>`).join('');

  const fixedRows = m.fixedExpenses.length === 0
    ? `<p class="text-xs text-ink-faint italic">Henüz sabit gider eklenmedi.</p>`
    : m.fixedExpenses.map(i => lineItemRow(i, 'fixed', state)).join('');

  const extraRows = m.extras.length === 0
    ? `<p class="text-xs text-ink-faint italic">Bu ay için ekstra masraf eklenmedi.</p>`
    : m.extras.map(i => lineItemRow(i, 'extra', state)).join('');

  const allowanceRows = users.map(u => {
    const ps = m.personalSavings[u.id] || { amount: 0, redirectToJoint: false };
    return `
      <div class="pb-3 mb-3 border-b border-line last:border-b-0 last:pb-0 last:mb-0">
        <p class="text-xs font-bold text-ink mb-2">${escapeHtml(u.name)}</p>
        <div class="flex items-center justify-between gap-3 mb-2">
          <label class="text-sm text-ink-soft">Harçlık</label>
          <div class="field flex items-center gap-1 px-3 py-2 w-32">
            <span class="text-ink-soft text-xs">${sym}</span>
            <input type="number" step="0.01" min="0" data-role="allowance" data-user="${u.id}" value="${m.allowance[u.id] || 0}" class="w-full text-right text-sm text-ink">
          </div>
        </div>
        <div class="flex items-center justify-between gap-3 mb-2">
          <div>
            <label class="text-sm text-ink-soft block">Limit (not)</label>
            <span class="text-[10px] text-ink-faint">Harcarken durman gereken tutar</span>
          </div>
          <div class="field flex items-center gap-1 px-3 py-2 w-32 shrink-0">
            <span class="text-ink-soft text-xs">${sym}</span>
            <input type="number" step="0.01" data-role="personalNote" data-user="${u.id}" value="${m.personalNote[u.id] || 0}" class="w-full text-right text-sm text-ink">
          </div>
        </div>
        <div class="flex items-center justify-between gap-3">
          <div>
            <label class="text-sm text-ink-soft block">Kişisel Birikim</label>
            <button data-action="toggleRedirect" data-user="${u.id}" class="flex items-center gap-1 text-[10px] mt-0.5 ${ps.redirectToJoint ? 'text-teal-deep font-semibold' : 'text-ink-faint'}">
              <span class="w-3 h-3 inline-flex rounded-full border ${ps.redirectToJoint ? 'bg-teal border-teal' : 'border-ink-faint'}"></span>
              Ortak hesaba yönlendir
            </button>
          </div>
          <div class="field flex items-center gap-1 px-3 py-2 w-32 shrink-0">
            <span class="text-ink-soft text-xs">${sym}</span>
            <input type="number" step="0.01" min="0" data-role="personalSavingsAmount" data-user="${u.id}" value="${ps.amount || 0}" class="w-full text-right text-sm text-ink">
          </div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="pt-2 pb-1">
      <h2 class="font-extrabold text-xl text-ink">Giderler</h2>
      <p class="text-xs text-ink-soft">${monthLabel(state.currentMonth)} verileri</p>
    </div>

    <div class="card rounded-2xl p-4 mt-4">
      <h3 class="font-bold text-sm text-ink mb-3">Gelirler</h3>
      <div class="space-y-2.5">
        ${incomeRows}
        <div class="flex items-center justify-between gap-3 pt-2.5 mt-1 border-t border-line">
          <div>
            <label class="text-sm text-ink-soft block">Ekstra Gelir</label>
            <span class="text-[10px] text-ink-faint">İkramiye, iade, ek gelir vb.</span>
          </div>
          <div class="field flex items-center gap-1 px-3 py-2 w-32 shrink-0">
            <span class="text-ink-soft text-xs">${sym}</span>
            <input type="number" step="0.01" min="0" data-role="extraIncome" value="${m.extraIncome || 0}" class="w-full text-right text-sm text-ink">
          </div>
        </div>
      </div>
    </div>

    <div class="card rounded-2xl p-4 mt-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-sm text-ink">Sabit Masraflar</h3>
        <button data-action="addFixed" class="w-7 h-7 rounded-full flex items-center justify-center text-white bg-teal" aria-label="Sabit gider ekle">
          <span class="w-3.5 h-3.5 inline-flex">${ICON.plus}</span>
        </button>
      </div>
      <div class="space-y-2.5">${fixedRows}</div>
      <div class="flex items-center justify-between mt-3 pt-3 border-t border-line">
        <span class="text-xs font-semibold text-ink-soft">Toplam</span>
        <span class="text-sm font-bold text-ink">${formatCurrency(t.totalFixed, currency)}</span>
      </div>
      <button data-action="saveAsRecurring" class="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-deep border border-teal rounded-lg py-2">
        <span class="w-3.5 h-3.5 inline-flex">${ICON.repeat}</span> Bu listeyi düzenli şablon olarak kaydet
      </button>
    </div>

    <div class="card rounded-2xl p-4 mt-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-sm text-ink">Ekstralar</h3>
        <button data-action="openAddExtra" class="w-7 h-7 rounded-full flex items-center justify-center text-white bg-teal" aria-label="Ekstra ekle">
          <span class="w-3.5 h-3.5 inline-flex">${ICON.plus}</span>
        </button>
      </div>
      <div class="space-y-2.5">${extraRows}</div>
      <div class="flex items-center justify-between mt-3 pt-3 border-t border-line">
        <span class="text-xs font-semibold text-ink-soft">Toplam</span>
        <span class="text-sm font-bold text-ink">${formatCurrency(t.totalExtras, currency)}</span>
      </div>
    </div>

    <div class="card rounded-2xl p-4 mt-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <label class="text-sm text-ink-soft block mb-1">Ortak Birikim</label>
          <span class="badge" style="background:var(--teal-tint); color:var(--teal-deep);">+ Toplam Varlığa</span>
        </div>
        <div class="field flex items-center gap-1 px-3 py-2 w-32 shrink-0">
          <span class="text-ink-soft text-xs">${sym}</span>
          <input type="number" step="0.01" min="0" data-role="birikim" value="${m.birikim}" class="w-full text-right text-sm text-ink">
        </div>
      </div>
      <p class="text-[10px] text-ink-faint leading-snug mt-2.5">Gider gibi görünür, ancak toplam varlığınızdan düşülmez — Ortak Birikim katmanına eklenmiş sayılır.</p>
    </div>

    <div class="card rounded-2xl p-4 mt-4 mb-4">
      <h3 class="font-bold text-sm text-ink mb-3">Harçlık &amp; Ortak Havuz</h3>
      <div class="flex items-center justify-between gap-3 mb-2">
        <div>
          <label class="text-sm text-ink-soft block mb-1">Ortak Hesap</label>
          <span class="badge" style="background:var(--coral-tint); color:var(--coral);">− Toplam Varlıktan</span>
        </div>
        <div class="field flex items-center gap-1 px-3 py-2 w-32 shrink-0">
          <span class="text-ink-soft text-xs">${sym}</span>
          <input type="number" step="0.01" min="0" data-role="pool" value="${m.pool}" class="w-full text-right text-sm text-ink">
        </div>
      </div>
      <p class="text-[10px] text-ink-faint leading-snug mb-3 pb-3 border-b border-line">Ortak hesap aynı zamanda birikim hesabınız olduğu için buraya ayrılan tutar aylık toplam varlığınızdan düşülür.</p>
      ${allowanceRows}
      <div class="flex items-center justify-between mt-3 pt-3 border-t border-line">
        <span class="text-xs font-semibold text-ink-soft">Toplam (Havuz + Harçlık)</span>
        <span class="text-sm font-bold text-ink">${formatCurrency(t.totalPoolAllowance, currency)}</span>
      </div>
    </div>
  `;
}
