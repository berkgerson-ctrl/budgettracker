import { ICON } from './icons.js';
import { formatCurrency, currencySymbol, numOrEmpty } from '../utils/format.js';
import { monthLabel } from '../utils/dates.js';
import { activeUsers } from '../state.js';

function historyList(rows, currency) {
  if (!rows.length) return `<p class="text-xs text-ink-faint italic">Henüz veri yok.</p>`;
  const desc = [...rows].reverse();
  return desc.map(h => {
    const up = h.net >= 0;
    return `
      <div class="card rounded-xl p-3.5 flex items-center gap-3">
        <span class="w-1.5 self-stretch rounded-full shrink-0" style="background:${up ? 'var(--teal)' : 'var(--coral)'};"></span>
        <span class="flex-1 min-w-0">
          <span class="flex items-center gap-1.5 flex-wrap">
            <span class="block text-sm font-semibold text-ink">${monthLabel(h.key)}</span>
            ${h.overridden ? `<span class="badge" style="background:var(--amber-tint); color:var(--amber);">Düzenlendi</span>` : ''}
          </span>
          <span class="block text-[11px] ${up ? 'text-teal-deep' : 'text-coral'}">${up ? '+' : ''}${formatCurrency(h.net, currency)}</span>
        </span>
        <span class="text-sm font-bold text-ink shrink-0">${formatCurrency(h.end, currency)}</span>
      </div>`;
  }).join('');
}

function layerTabs(active) {
  const tabs = [
    { key: 'main', label: 'Ana Varlık' },
    { key: 'joint', label: 'Ortak Birikim' },
    { key: 'personal', label: 'Kişisel' }
  ];
  return `<div class="flex gap-2 mb-4 overflow-x-auto no-scrollbar">${tabs.map(tb =>
    `<button data-action="setWealthLayer" data-layer="${tb.key}" class="pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 ${active === tb.key ? 'text-white bg-teal' : 'text-ink-soft bg-white border border-line'}">${tb.label}</button>`
  ).join('')}</div>`;
}

export function renderWealthScreen(state, mainHistory, jointHistory, personalHistories) {
  const currency = state.settings.currency;
  const sym = currencySymbol(currency);
  const layer = state.ui.wealthLayer || 'main';
  const earliest = Object.keys(state.months).sort()[0];
  const m = state.months[state.currentMonth];
  const mainRow = mainHistory.find(h => h.key === state.currentMonth) || { end: 0, net: 0 };
  const overridden = typeof m.balanceOverride === 'number';
  const jointRow = jointHistory.find(h => h.key === state.currentMonth) || { end: 0, net: 0 };
  const users = activeUsers(state.users);

  let body = '';

  if (layer === 'main') {
    body = `
      <div class="card rounded-2xl p-4">
        <label class="text-xs font-semibold text-ink-soft block mb-1">Başlangıç Varlığı</label>
        <p class="text-[10px] text-ink-faint mb-2">${earliest ? monthLabel(earliest) : ''} ayı başlamadan önceki toplam varlığınız</p>
        <div class="field flex items-center gap-1 px-3 py-2.5">
          <span class="text-ink-soft text-sm">${sym}</span>
          <input type="number" step="0.01" data-role="baseline" value="${numOrEmpty(state.settings.baseline)}" placeholder="0" class="w-full text-sm text-ink">
        </div>
      </div>

      <div class="rounded-2xl p-5 mt-4 text-white" style="background:linear-gradient(135deg, var(--teal), var(--teal-deep));">
        <div class="flex items-center justify-between mb-1">
          <p class="text-xs opacity-90">${monthLabel(state.currentMonth)} Sonu Ana Varlık</p>
          <span class="w-4 h-4 opacity-80 inline-flex">${ICON.pencil}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="font-extrabold text-3xl opacity-90">${sym}</span>
          <input type="number" step="0.01" data-role="balanceOverride" value="${mainRow.end}" class="bg-transparent font-extrabold text-3xl outline-none w-full placeholder-white/60" placeholder="0">
        </div>
        <p class="text-xs mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1">
          <span class="w-3 h-3 inline-flex">${mainRow.net >= 0 ? ICON.arrowUp : ICON.arrowDown}</span> ${mainRow.net >= 0 ? '+' : ''}${formatCurrency(mainRow.net, currency)} bu ay
        </p>
        <button data-action="resetBalanceOverride" class="block text-[11px] underline mt-2 opacity-90 ${overridden ? '' : 'hidden'}">Otomatik hesaplanan değere dön</button>
      </div>

      <div class="mt-5 mb-4">
        <h3 class="font-bold text-sm text-ink mb-3">Aylık Geçmiş</h3>
        <div class="space-y-2.5">${historyList(mainHistory, currency)}</div>
      </div>`;
  } else if (layer === 'joint') {
    body = `
      <div class="card rounded-2xl p-4">
        <label class="text-xs font-semibold text-ink-soft block mb-1">Ortak Birikim Başlangıcı</label>
        <div class="field flex items-center gap-1 px-3 py-2.5">
          <span class="text-ink-soft text-sm">${sym}</span>
          <input type="number" step="0.01" data-role="jointBaseline" value="${numOrEmpty(state.settings.jointSavingsBaseline)}" placeholder="0" class="w-full text-sm text-ink">
        </div>
      </div>
      <div class="rounded-2xl p-5 mt-4 text-white" style="background:linear-gradient(135deg, var(--violet), #5B4CD6);">
        <p class="text-xs opacity-90 mb-1">${monthLabel(state.currentMonth)} Sonu Ortak Birikim</p>
        <p class="font-extrabold text-3xl">${formatCurrency(jointRow.end, currency)}</p>
        <p class="text-xs mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1">
          <span class="w-3 h-3 inline-flex">${jointRow.net >= 0 ? ICON.arrowUp : ICON.arrowDown}</span> ${jointRow.net >= 0 ? '+' : ''}${formatCurrency(jointRow.net, currency)} bu ay
        </p>
      </div>
      <p class="text-[10px] text-ink-faint leading-snug mt-3">Bu bakiye, Giderler ekranındaki "Ortak Birikim" alanı ile "Ortak hesaba yönlendir" seçili kişisel birikimlerin toplamından oluşur.</p>
      <div class="mt-5 mb-4">
        <h3 class="font-bold text-sm text-ink mb-3">Aylık Geçmiş</h3>
        <div class="space-y-2.5">${historyList(jointHistory, currency)}</div>
      </div>`;
  } else {
    body = users.map(u => {
      const hist = personalHistories[u.id] || [];
      const row = hist.find(h => h.key === state.currentMonth) || { end: 0, net: 0 };
      const baseline = (state.settings.personalSavingsBaseline || {})[u.id] || 0;
      return `
        <div class="card rounded-2xl p-4 mb-4">
          <p class="font-bold text-sm text-ink mb-3">${u.name}</p>
          <label class="text-xs font-semibold text-ink-soft block mb-1">Başlangıç Bakiyesi</label>
          <div class="field flex items-center gap-1 px-3 py-2.5 mb-3">
            <span class="text-ink-soft text-sm">${sym}</span>
            <input type="number" step="0.01" data-role="personalBaseline" data-user="${u.id}" value="${numOrEmpty(baseline)}" placeholder="0" class="w-full text-sm text-ink">
          </div>
          <div class="rounded-xl p-4 text-white mb-3" style="background:linear-gradient(135deg, var(--violet), #5B4CD6);">
            <p class="text-[11px] opacity-90 mb-1">${monthLabel(state.currentMonth)} Sonu Bakiye</p>
            <p class="font-extrabold text-2xl">${formatCurrency(row.end, currency)}</p>
          </div>
          <div class="space-y-2">${historyList(hist, currency)}</div>
        </div>`;
    }).join('');
    if (!users.length) body = `<p class="text-xs text-ink-faint italic">Aktif kullanıcı bulunamadı.</p>`;
  }

  return `
    <div class="pt-2 pb-1">
      <h2 class="font-extrabold text-xl text-ink">Varlık</h2>
      <p class="text-xs text-ink-soft">4 katmanlı birikim görünümü</p>
    </div>
    <div class="mt-4">${layerTabs(layer)}</div>
    ${body}
  `;
}
