import { ICON } from './icons.js';
import { CURRENCIES, escapeHtml, formatCurrency } from '../utils/format.js';

function connectionSection(state) {
  const c = state.connection;
  const statusBadge = c.demoMode
    ? `<span class="badge" style="background:var(--amber-tint); color:var(--amber);">Demo modu</span>`
    : c.connected
      ? `<span class="badge" style="background:var(--teal-tint); color:var(--teal-deep);">Bağlı</span>`
      : `<span class="badge" style="background:var(--coral-tint); color:var(--coral);">Bağlı değil</span>`;

  return `
    <div class="mb-2 flex items-center justify-between">
      <p class="text-sm font-bold text-ink">Google Sheets Bağlantısı</p>
      ${statusBadge}
    </div>
    <p class="text-xs text-ink-soft mb-3 leading-snug">Verileriniz artık bu tarayıcıda değil, kendi Google E-Tablonuzda saklanır. Bağlantı adresi (Apps Script Web App URL) sadece bu cihazda hatırlanır.</p>
    <div class="field px-3 py-2.5 mb-2">
      <input type="url" id="sheetsUrlInput" placeholder="https://script.google.com/macros/s/.../exec" value="${escapeHtml(c.url)}" class="w-full text-sm text-ink">
    </div>
    ${c.error ? `<p class="text-xs text-coral mb-2">${escapeHtml(c.error)}</p>` : ''}
    ${c.lastSync ? `<p class="text-[10px] text-ink-faint mb-2">Son senkronizasyon: ${new Date(c.lastSync).toLocaleString('tr-TR')}</p>` : ''}
    <div class="grid grid-cols-2 gap-2 mb-2">
      <button data-action="testSheetsConnection" class="py-2.5 rounded-xl border border-ink-faint text-ink text-xs font-semibold ${c.syncing ? 'opacity-50 pointer-events-none' : ''}">Bağlantıyı Test Et</button>
      <button data-action="connectSheets" class="py-2.5 rounded-xl text-white text-xs font-semibold bg-teal ${c.syncing ? 'opacity-50 pointer-events-none' : ''}">Kaydet &amp; Senkronize Et</button>
    </div>
    ${!c.demoMode ? `<button data-action="disconnectSheets" class="w-full py-2 rounded-xl text-coral text-xs font-semibold border border-coral">Bağlantıyı Kaldır (Demo moduna dön)</button>` : ''}
    <details class="mt-3">
      <summary class="text-xs text-teal-deep font-semibold cursor-pointer">Google Apps Script nasıl kurulur?</summary>
      <ol class="list-decimal list-inside text-[11px] text-ink-soft mt-2 space-y-1 leading-relaxed">
        <li>Yeni bir Google E-Tablo aç.</li>
        <li>Uzantılar → Apps Script'i aç.</li>
        <li>Repodaki <code>google-apps-script/Code.gs</code> içeriğini yapıştır.</li>
        <li>Dağıt → Yeni dağıtım → Web Uygulaması. "Yürütme kimliği: Ben", "Erişim: Herkes" seç.</li>
        <li>Oluşan Web App URL'sini yukarıya yapıştırıp "Kaydet &amp; Senkronize Et" butonuna bas.</li>
      </ol>
    </details>
  `;
}

function usersSection(state) {
  const firstActiveId = (state.users.find(u => u.active) || {}).id;
  const rows = state.users.map(u => {
    const isPrimary = u.active && u.id === firstActiveId;
    return `
    <div class="card rounded-xl p-3 flex items-center gap-2" data-user-row="${u.id}">
      <span class="w-5 h-5 text-ink-faint shrink-0 cursor-grab" data-drag-handle aria-label="Sürükle">${ICON.drag}</span>
      <input type="text" data-role="userName" data-id="${u.id}" value="${escapeHtml(u.name)}" class="flex-1 min-w-0 text-sm font-semibold text-ink bg-transparent outline-none">
      ${isPrimary ? `<span class="badge shrink-0 flex items-center gap-1" style="background:var(--amber-tint); color:var(--amber);"><span class="w-2.5 h-2.5 inline-flex">${ICON.star}</span>Ana</span>` : ''}
      <button data-action="toggleUserActive" data-id="${u.id}" class="badge shrink-0" style="background:${u.active ? 'var(--teal-tint)' : 'var(--ink-faint)'}; color:${u.active ? 'var(--teal-deep)' : '#fff'};">${u.active ? 'Aktif' : 'Pasif'}</button>
      <button data-action="removeUser" data-id="${u.id}" class="w-7 h-7 rounded-lg bg-coral-tint text-coral flex items-center justify-center shrink-0" aria-label="Sil">
        <span class="w-3.5 h-3.5 inline-flex">${ICON.close}</span>
      </button>
    </div>`;
  }).join('');
  return `
    <p class="text-sm font-bold text-ink mb-1">Kullanıcılar</p>
    <p class="text-xs text-ink-soft mb-3">Sürükle tutamacından sürükleyerek sırala — en üstteki aktif kullanıcı <b>ana kullanıcı</b> olur ve ana sayfa karşılamasında adı kullanılır.</p>
    <div class="space-y-2 mb-3" id="userRowsList">${rows}</div>
    <div class="flex items-center gap-2">
      <div class="field flex-1 px-3 py-2.5"><input type="text" id="newUserName" placeholder="Yeni kullanıcı adı" class="w-full text-sm text-ink"></div>
      <button data-action="addUser" class="px-4 py-2.5 rounded-xl text-white text-xs font-semibold bg-teal shrink-0">Ekle</button>
    </div>
  `;
}

function categoriesSection(state) {
  const rows = state.categories.map(c => `
    <div class="card rounded-xl p-3 flex items-center gap-2">
      <input type="color" data-role="categoryColor" data-id="${c.id}" value="${c.color || '#8891A0'}" class="w-7 h-7 rounded-lg border border-line shrink-0">
      <input type="text" data-role="categoryName" data-id="${c.id}" value="${escapeHtml(c.name)}" class="flex-1 min-w-0 text-sm font-semibold text-ink bg-transparent outline-none">
      <div class="field flex items-center gap-1 px-2 py-1.5 w-24 shrink-0">
        <input type="number" min="0" placeholder="Limit" data-role="categoryLimit" data-id="${c.id}" value="${c.limit ?? ''}" class="w-full text-right text-xs text-ink">
      </div>
      <button data-action="removeCategory" data-id="${c.id}" class="w-7 h-7 rounded-lg bg-coral-tint text-coral flex items-center justify-center shrink-0" aria-label="Sil">
        <span class="w-3.5 h-3.5 inline-flex">${ICON.close}</span>
      </button>
    </div>`).join('');
  return `
    <p class="text-sm font-bold text-ink mb-1">Kategoriler &amp; Limitler</p>
    <p class="text-xs text-ink-soft mb-3">Sabit gider ve ekstralara kategori atayarak dağılım grafiğini ve limit uyarılarını kullanabilirsin.</p>
    <div class="space-y-2 mb-3">${rows}</div>
    <div class="flex items-center gap-2">
      <div class="field flex-1 px-3 py-2.5"><input type="text" id="newCategoryName" placeholder="Yeni kategori adı" class="w-full text-sm text-ink"></div>
      <button data-action="addCategory" class="px-4 py-2.5 rounded-xl text-white text-xs font-semibold bg-teal shrink-0">Ekle</button>
    </div>
  `;
}

function recurringSection(state) {
  const rows = state.recurringTemplates.map(t => `
    <div class="card rounded-xl p-3 flex items-center gap-2">
      <input type="text" data-role="templateName" data-id="${t.id}" value="${escapeHtml(t.name)}" class="flex-1 min-w-0 text-sm font-semibold text-ink bg-transparent outline-none">
      <div class="field flex items-center gap-1 px-2 py-1.5 w-24 shrink-0">
        <input type="number" step="0.01" data-role="templateAmount" data-id="${t.id}" value="${t.amount}" class="w-full text-right text-xs text-ink">
      </div>
      <button data-action="toggleTemplateActive" data-id="${t.id}" class="badge shrink-0" style="background:${t.active ? 'var(--teal-tint)' : 'var(--ink-faint)'}; color:${t.active ? 'var(--teal-deep)' : '#fff'};">${t.active ? 'Aktif' : 'Pasif'}</button>
      <button data-action="removeTemplate" data-id="${t.id}" class="w-7 h-7 rounded-lg bg-coral-tint text-coral flex items-center justify-center shrink-0" aria-label="Sil">
        <span class="w-3.5 h-3.5 inline-flex">${ICON.close}</span>
      </button>
    </div>`).join('');
  return `
    <p class="text-sm font-bold text-ink mb-1">Düzenli İşlem Şablonları</p>
    <p class="text-xs text-ink-soft mb-3">Yeni ay eklerken aktif şablonlar otomatik olarak Sabit Masraflar listesine kopyalanır. Giderler ekranındaki "düzenli şablon olarak kaydet" ile de buraya ekleyebilirsin.</p>
    <div class="space-y-2 mb-3">${rows || `<p class="text-xs text-ink-faint italic">Henüz şablon yok.</p>`}</div>
  `;
}

function generalSection(state) {
  return `
    <p class="text-sm font-bold text-ink mb-3">Genel</p>
    <label class="text-xs font-semibold text-ink-soft block mb-1.5">Para Birimi</label>
    <div class="field px-3 py-2.5 mb-4">
      <select id="currencySelect" class="w-full text-sm text-ink">
        ${CURRENCIES.map(c => `<option value="${c.code}" ${state.settings.currency === c.code ? 'selected' : ''}>${c.label}</option>`).join('')}
      </select>
    </div>
    <button data-action="loadSample" class="w-full py-3 rounded-xl border border-teal text-teal-deep font-semibold text-sm mb-3">Örnek Verilerle Doldur (Demo)</button>
    <button data-action="resetAll" class="w-full py-3 rounded-xl border border-coral text-coral font-semibold text-sm">Yerel Verileri Sıfırla</button>
  `;
}

export function renderSettingsModal(state) {
  const tabs = [
    { key: 'connection', label: 'Bağlantı' },
    { key: 'users', label: 'Kullanıcılar' },
    { key: 'categories', label: 'Kategoriler' },
    { key: 'recurring', label: 'Düzenli' },
    { key: 'general', label: 'Genel' }
  ];
  const active = state.ui.settingsTab || 'connection';
  const tabBar = tabs.map(t => `<button data-action="setSettingsTab" data-stab="${t.key}" class="pill px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${active === t.key ? 'text-white bg-teal' : 'text-ink-soft bg-app border border-line'}">${t.label}</button>`).join('');

  let content;
  if (active === 'connection') content = connectionSection(state);
  else if (active === 'users') content = usersSection(state);
  else if (active === 'categories') content = categoriesSection(state);
  else if (active === 'recurring') content = recurringSection(state);
  else content = generalSection(state);

  return `
  <div id="modalSettings" class="fixed inset-0 modal-overlay ${state.ui.openModal === 'modalSettings' ? 'flex' : 'hidden-screen'} items-end sm:items-center justify-center z-50">
    <div class="w-full sm:max-w-[420px] bg-white rounded-t-3xl sm:rounded-3xl p-6 max-h-[88vh] flex flex-col">
      <div class="flex items-center justify-between mb-4 shrink-0">
        <h3 class="font-extrabold text-lg text-ink">Ayarlar</h3>
        <button data-action="closeModal" data-modal="modalSettings" class="w-8 h-8 rounded-full bg-app flex items-center justify-center text-ink-soft">
          <span class="w-4 h-4 inline-flex">${ICON.close}</span>
        </button>
      </div>
      <div class="flex gap-2 mb-4 overflow-x-auto no-scrollbar shrink-0">${tabBar}</div>
      <div class="overflow-y-auto pr-1">${content}</div>
    </div>
  </div>`;
}
