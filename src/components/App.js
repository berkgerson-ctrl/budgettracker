import { store, activeUsers, monthTotals, goalCurrentAmount, goalProgressPct } from '../state.js';
import { ICON } from './icons.js';
import { renderHeader } from './Header.js';
import { renderMonthPills } from './MonthPills.js';
import { renderHomeScreen } from './HomeScreen.js';
import { renderExpensesScreen } from './ExpensesScreen.js';
import { renderWealthScreen } from './WealthScreen.js';
import { renderGoalsScreen } from './GoalsScreen.js';
import { renderChartScreen, mountCharts } from './ChartScreen.js';
import { renderSettingsModal } from './SettingsModal.js';
import { renderQuickAddModal, renderQuickActionsSheet } from './QuickAddModal.js';
import { evalAmountExpression, formatCurrency } from '../utils/format.js';
import { celebrateGoalComplete, celebrateMilestone, checkWealthMilestone } from '../utils/celebrate.js';

const NAV_ITEMS_LEFT = [
  { tab: 'home', icon: ICON.home, label: 'Ana sayfa' },
  { tab: 'expenses', icon: ICON.list, label: 'Giderler' }
];
const NAV_ITEMS_RIGHT = [
  { tab: 'wealth', icon: ICON.wallet, label: 'Varlık' },
  { tab: 'chart', icon: ICON.chart, label: 'Grafik' }
];

function bottomNav(state) {
  const navBtn = (item) => `
    <button data-tab="${item.tab}" class="nav-btn flex flex-col items-center gap-1 py-1 px-1.5 ${state.ui.activeTab === item.tab ? 'active' : ''}" aria-label="${item.label}">
      ${item.icon}
    </button>`;
  return `
    <div class="absolute bottom-0 inset-x-0 px-4 pb-5 pt-3 bg-card rounded-t-[1.75rem] border-t border-line flex items-center justify-between">
      ${NAV_ITEMS_LEFT.map(navBtn).join('')}
      <button data-tab="goals" class="nav-btn flex flex-col items-center gap-1 py-1 px-1.5 ${state.ui.activeTab === 'goals' ? 'active' : ''}" aria-label="Hedefler">${ICON.target}</button>
      <button data-action="openQuickActions" class="fab -mt-9 w-14 h-14 rounded-full flex items-center justify-center text-white shrink-0 bg-teal pressable" aria-label="Hızlı ekle">
        ${ICON.plus}
      </button>
      ${NAV_ITEMS_RIGHT.map(navBtn).join('')}
    </div>`;
}

function fullMarkup(state) {
  const mainHistory = store.mainWealthHistory();
  const mainRow = mainHistory.find(h => h.key === state.currentMonth);
  state.__mainWealthEnd = mainRow ? mainRow.end : 0;
  const jointHistory = store.jointSavingsHistory();
  const personalHistories = {};
  activeUsers(state.users).forEach(u => { personalHistories[u.id] = store.personalSavingsHistory(u.id); });

  return `
    <div class="min-h-screen w-full flex items-start sm:items-center justify-center py-0 sm:py-8 px-0 sm:px-4">
      <div id="appShell" class="app-shell relative w-full sm:max-w-[420px] sm:rounded-[2.25rem] overflow-hidden flex flex-col" style="min-height:100dvh;">
        ${renderHeader(state)}
        ${renderMonthPills(state)}
        <div class="flex-1 overflow-y-auto px-5 pb-32" id="scrollArea">
          <div id="screenHome" class="tab-panel ${state.ui.activeTab === 'home' ? '' : 'hidden-screen'}">${renderHomeScreen(state)}</div>
          <div id="screenExpenses" class="tab-panel ${state.ui.activeTab === 'expenses' ? '' : 'hidden-screen'}">${renderExpensesScreen(state)}</div>
          <div id="screenWealth" class="tab-panel ${state.ui.activeTab === 'wealth' ? '' : 'hidden-screen'}">${renderWealthScreen(state, mainHistory, jointHistory, personalHistories)}</div>
          <div id="screenGoals" class="tab-panel ${state.ui.activeTab === 'goals' ? '' : 'hidden-screen'}">${renderGoalsScreen(state)}</div>
          <div id="screenChart" class="tab-panel ${state.ui.activeTab === 'chart' ? '' : 'hidden-screen'}">${renderChartScreen(state)}</div>
        </div>
        ${bottomNav(state)}
      </div>
    </div>
    ${renderQuickActionsSheet(state)}
    ${renderQuickAddModal(state)}
    ${renderSettingsModal(state)}
    <div id="toast" class="toast fixed bottom-6 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none translate-y-2 text-white text-xs px-4 py-2.5 rounded-2xl shadow-lg z-[60] max-w-[85%] text-center" style="background:#1C2430;">Kaydedildi</div>
  `;
}

let toastTimer = null;
function showToast(msg = 'Kaydedildi', duration = 1100) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('opacity-0', 'translate-y-2');
  toast.classList.add('opacity-100', 'translate-y-0');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, duration);
}

function focusSelector(el) {
  if (!el || !el.dataset || !el.dataset.role) return null;
  let sel = `[data-role="${el.dataset.role}"]`;
  if (el.dataset.id) sel += `[data-id="${el.dataset.id}"]`;
  if (el.dataset.user) sel += `[data-user="${el.dataset.user}"]`;
  return sel;
}

export function mountApp(root) {
  function render() {
    const active = document.activeElement;
    const sel = focusSelector(active);
    const selStart = active && active.selectionStart != null ? active.selectionStart : null;
    const selEnd = active && active.selectionEnd != null ? active.selectionEnd : null;
    const scroller = document.getElementById('scrollArea');
    const scrollTop = scroller ? scroller.scrollTop : 0;

    try {
      root.innerHTML = fullMarkup(store.data);
    } catch (err) {
      // Beklenmedik bir render hatası uygulamayı tamamen kilitlemesin: hatayı
      // konsola yazıp bir önceki ekranı korur, store.emit() zincirinin (ör.
      // Google Sheets bağlantısı) çökmesini engeller.
      console.error('Render hatası:', err);
      return;
    }

    const newScroller = document.getElementById('scrollArea');
    if (newScroller) newScroller.scrollTop = scrollTop;

    const crossedTier = checkWealthMilestone('main-' + (store.data.connection.url || 'demo'), store.data.__mainWealthEnd);
    if (crossedTier) {
      celebrateMilestone();
      showToast(`🎉 Birikimin ${formatCurrency(crossedTier, store.data.settings.currency)}'yı geçti!`, 2600);
    }

    if (store.data.ui.activeTab === 'chart') {
      requestAnimationFrame(() => mountCharts(store.data));
    }

    setupUserDragDrop();
    animateFills();

    if (sel) {
      const el = document.querySelector(sel);
      if (el) {
        el.focus();
        if (el.setSelectionRange && selStart != null) {
          try { el.setSelectionRange(selStart, selEnd); } catch { /* ignore */ }
        }
      }
    }
  }

  store.subscribe(render);
  store.init().then(render);

  // Çevrimdışı kuyruğu: bağlantı geri gelince ve arada bir (30sn) otomatik dene.
  window.addEventListener('online', () => store.flushQueue());
  setInterval(() => { if (store.data.connection.queueLength > 0) store.flushQueue(); }, 30000);

  /* ---------------- INPUT / CHANGE DELEGATION ---------------- */
  // Bu alanlar tutar/para birimi taşır: yazarken hiçbir şey kaydedilmez,
  // yalnızca odak alandan çıktığında (blur) ya da Enter'a basıldığında
  // "150+45" gibi basit ifadeler hesaplanıp son sayı kaydedilir. Böylece
  // yazarken input hiç yeniden çizilmez ve "+ - * /" karakterlerine izin
  // vermek için bu alanlar type="text" olarak tanımlıdır.
  const AMOUNT_ROLES = new Set([
    'income', 'extraIncome', 'fixedAmount', 'extraAmount', 'pool', 'birikim',
    'allowance', 'personalNote', 'personalSavingsAmount', 'baseline',
    'balanceOverride', 'jointBaseline', 'personalBaseline', 'categoryLimit',
    'templateAmount', 'goalContribAmount', 'goalContributionInput'
  ]);

  function applyFieldValue(t, role, val) {
    switch (role) {
      case 'income': store.updateMonth(m => { m.incomes[t.dataset.user] = Number(val) || 0; }, true); break;
      case 'extraIncome': store.updateMonth(m => { m.extraIncome = Number(val) || 0; }, true); break;
      case 'fixedName': store.updateMonth(m => { const i = m.fixedExpenses.find(x => x.id === t.dataset.id); if (i) i.name = val; }); break;
      case 'fixedAmount': store.updateMonth(m => { const i = m.fixedExpenses.find(x => x.id === t.dataset.id); if (i) i.amount = Number(val) || 0; }, true); break;
      case 'fixedCategory': store.updateMonth(m => { const i = m.fixedExpenses.find(x => x.id === t.dataset.id); if (i) i.categoryId = val || null; }, true); break;
      case 'extraName': store.updateMonth(m => { const i = m.extras.find(x => x.id === t.dataset.id); if (i) i.name = val; }); break;
      case 'extraAmount': store.updateMonth(m => { const i = m.extras.find(x => x.id === t.dataset.id); if (i) i.amount = Number(val) || 0; }, true); break;
      case 'extraCategory': store.updateMonth(m => { const i = m.extras.find(x => x.id === t.dataset.id); if (i) i.categoryId = val || null; }, true); break;
      case 'pool': store.updateMonth(m => { m.pool = Number(val) || 0; }, true); break;
      case 'birikim': store.updateMonth(m => { m.birikim = Number(val) || 0; }, true); break;
      case 'allowance': store.updateMonth(m => { m.allowance[t.dataset.user] = Number(val) || 0; }, true); break;
      case 'personalNote': store.updateMonth(m => { m.personalNote[t.dataset.user] = Number(val) || 0; }, true); break;
      case 'goalContribAmount': store.updateGoalContribution(t.dataset.id, val); break;
      case 'personalSavingsAmount': store.updateMonth(m => {
          if (!m.personalSavings[t.dataset.user]) m.personalSavings[t.dataset.user] = { amount: 0, redirectToJoint: false };
          m.personalSavings[t.dataset.user].amount = Number(val) || 0;
        }, true); break;
      case 'baseline': store.setBaseline(val); break;
      case 'jointBaseline': store.setJointBaseline(val); break;
      case 'personalBaseline': store.setPersonalBaseline(t.dataset.user, val); break;
      case 'balanceOverride': store.setBalanceOverride(val); break;
      case 'userName': store.renameUser(t.dataset.id, val); break;
      case 'categoryName': store.updateCategory(t.dataset.id, { name: val }); break;
      case 'categoryColor': store.updateCategory(t.dataset.id, { color: val }); break;
      case 'categoryLimit': store.updateCategory(t.dataset.id, { limit: val === '' ? null : Number(val) || 0 }); break;
      case 'templateName': store.updateTemplate(t.dataset.id, { name: val }); break;
      case 'templateAmount': store.updateTemplate(t.dataset.id, { amount: Number(val) || 0 }); break;
      default: break;
    }
  }

  function handleFieldChange(e) {
    const t = e.target;
    const role = t.dataset.role;
    if (!role || AMOUNT_ROLES.has(role)) return; // tutar alanları blur'da işlenir
    applyFieldValue(t, role, t.value);
  }
  document.addEventListener('input', handleFieldChange);
  document.addEventListener('change', handleFieldChange);

  // Tutar alanları: odaktan çıkınca ifadeyi hesapla, temiz sayıyı hem
  // input'a hem state'e yaz.
  function handleAmountCommit(e) {
    const t = e.target;
    const role = t.dataset.role;
    if (!role || !AMOUNT_ROLES.has(role)) return;
    if (t.value.trim() === '') { applyFieldValue(t, role, ''); return; }
    const result = evalAmountExpression(t.value);
    t.value = result;
    applyFieldValue(t, role, result);
    flashSaved(t);
  }
  document.addEventListener('blur', handleAmountCommit, true);

  // data-role taşımayan bağımsız tutar alanları (Hızlı Ekle / Hedef formu):
  // aynı hesap makinesi mantığıyla, sadece görünen değeri günceller.
  const STANDALONE_AMOUNT_IDS = new Set(['quickExtraAmount', 'goalTarget', 'goalMonthly']);
  document.addEventListener('blur', (e) => {
    if (e.target.id && STANDALONE_AMOUNT_IDS.has(e.target.id) && e.target.value.trim() !== '') {
      e.target.value = evalAmountExpression(e.target.value);
    }
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.dataset && AMOUNT_ROLES.has(e.target.dataset.role)) {
      e.preventDefault();
      e.target.blur();
    }
  });

  /* ---------------- CLICK DELEGATION ---------------- */
  document.addEventListener('click', function (e) {
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      store.data.ui.activeTab = tabBtn.dataset.tab;
      store.emit();
      return;
    }

    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    switch (action) {
      case 'selectMonth': store.selectMonth(btn.dataset.key); break;
      case 'addMonth': store.addMonth(); break;
      case 'toggleAccordion': store.toggleAccordion(btn.dataset.key); break;

      case 'addFixed': store.updateMonth(m => { m.fixedExpenses.push({ id: crypto.randomUUID(), name: '', amount: 0, categoryId: null }); }, true); break;
      case 'deleteFixed': store.updateMonth(m => { m.fixedExpenses = m.fixedExpenses.filter(i => i.id !== btn.dataset.id); }, true); break;
      case 'deleteExtra': store.updateMonth(m => { m.extras = m.extras.filter(i => i.id !== btn.dataset.id); }, true); break;
      case 'saveAsRecurring': store.saveCurrentFixedAsTemplates(); showToast('Şablon olarak kaydedildi'); break;

      case 'toggleRedirect': store.updateMonth(m => {
          const u = btn.dataset.user;
          if (!m.personalSavings[u]) m.personalSavings[u] = { amount: 0, redirectToJoint: false };
          m.personalSavings[u].redirectToJoint = !m.personalSavings[u].redirectToJoint;
        }, true); break;

      case 'openAddExtra': store.data.ui.quickAddMode = 'expense'; openModal('modalAddExtra'); break;
      case 'openQuickActions': openModal('modalQuickActions'); break;
      case 'chooseQuickAction': store.data.ui.quickAddMode = btn.dataset.mode; openModal('modalAddExtra'); break;
      case 'submitAddExtra': {
        const mode = store.data.ui.quickAddMode || 'expense';
        const amount = evalAmountExpression(document.getElementById('quickExtraAmount').value);
        if (mode === 'expense') {
          const name = document.getElementById('quickExtraName').value.trim();
          const categoryId = document.getElementById('quickExtraCategory').value || null;
          if (name || amount) {
            store.updateMonth(m => { m.extras.push({ id: crypto.randomUUID(), name: name || 'Ekstra masraf', amount, categoryId }); }, true);
            showToast('Gider eklendi');
          }
        } else if (mode === 'income') {
          if (amount) { store.updateMonth(m => { m.extraIncome = (Number(m.extraIncome) || 0) + amount; }, true); showToast('Gelir eklendi'); }
        } else if (mode === 'savings') {
          if (amount) { store.updateMonth(m => { m.birikim = (Number(m.birikim) || 0) + amount; }, true); showToast('Birikime eklendi'); }
        }
        closeModal('modalAddExtra');
        break;
      }

      case 'resetBalanceOverride': store.clearBalanceOverride(); break;
      case 'setWealthLayer': store.setWealthLayer(btn.dataset.layer); break;

      case 'openSettings': openModal('modalSettings'); break;
      case 'closeModal': closeModal(btn.dataset.modal); break;
      case 'setSettingsTab': store.setSettingsTab(btn.dataset.stab); break;
      case 'setTheme': store.setTheme(btn.dataset.theme); break;

      case 'testSheetsConnection': {
        const url = document.getElementById('sheetsUrlInput').value.trim();
        store.testConnection(url)
          .then(() => showToast('Bağlantı başarılı ✓ — şimdi "Kaydet & Senkronize Et"e basın', 2600))
          .catch(err => alert('Bağlantı testi başarısız: ' + err.message));
        break;
      }
      case 'connectSheets': {
        const url = document.getElementById('sheetsUrlInput').value.trim();
        if (!url) { alert('Lütfen önce bir Apps Script Web App URL girin.'); break; }
        store.connect(url)
          .then(() => showToast('Google Sheets ile senkronize edildi'))
          .catch(err => alert('Bağlanılamadı: ' + err.message));
        break;
      }
      case 'flushQueueNow': store.flushQueue(); break;
      case 'disconnectSheets':
        if (confirm('Google Sheets bağlantısı kaldırılacak ve demo moduna dönülecek. Emin misiniz?')) store.disconnect();
        break;

      case 'addUser': {
        const input = document.getElementById('newUserName');
        if (input.value.trim()) { store.addUser(input.value.trim()); input.value = ''; }
        break;
      }
      case 'toggleUserActive': store.toggleUserActive(btn.dataset.id); break;
      case 'removeUser':
        if (confirm('Bu kullanıcı silinecek. Emin misiniz?')) store.removeUser(btn.dataset.id);
        break;

      case 'addCategory': {
        const input = document.getElementById('newCategoryName');
        if (input.value.trim()) { store.addCategory(input.value.trim()); input.value = ''; }
        break;
      }
      case 'removeCategory': store.removeCategory(btn.dataset.id); break;
      case 'toggleTemplateActive': store.toggleTemplateActive(btn.dataset.id); break;
      case 'removeTemplate': store.removeTemplate(btn.dataset.id); break;

      case 'loadSample': loadSampleData(); closeModal('modalSettings'); break;
      case 'resetAll':
        if (confirm('Bu cihazdaki tüm yerel veriler sıfırlanacak. Emin misiniz?')) { location.reload(); }
        break;

      case 'toggleNewGoalForm': store.toggleNewGoalForm(); break;
      case 'submitNewGoal': {
        const name = document.getElementById('goalName').value.trim();
        const target = evalAmountExpression(document.getElementById('goalTarget').value);
        const monthlyRaw = document.getElementById('goalMonthly').value.trim(); const monthly = monthlyRaw ? evalAmountExpression(monthlyRaw) : null;
        const date = document.getElementById('goalDate').value || null;
        if (!name || !target) { alert('Lütfen hedef adı ve tutarını gir.'); break; }
        store.addGoal({ name, targetAmount: target, monthlyContribution: monthly, targetDate: date });
        break;
      }
      case 'deleteGoal':
        if (confirm('Bu hedef silinecek. Emin misiniz?')) store.removeGoal(btn.dataset.id);
        break;
      case 'addGoalContribution': {
        const input = document.querySelector(`[data-role="goalContributionInput"][data-id="${btn.dataset.id}"]`);
        const amount = evalAmountExpression(input.value);
        if (amount > 0) {
          const goal = store.data.goals.find(g => g.id === btn.dataset.id);
          const before = goal ? goalProgressPct(goal, goalCurrentAmount(goal.id, store.data.goalContributions)) : 0;
          store.addGoalContribution(btn.dataset.id, amount);
          input.value = '';
          const after = goal ? goalProgressPct(goal, goalCurrentAmount(goal.id, store.data.goalContributions)) : 0;
          if (before < 100 && after >= 100) {
            celebrateGoalComplete();
            showToast(`🎉 "${goal.name}" hedefine ulaştın!`, 2600);
          } else {
            showToast('Hedefe eklendi');
          }
        }
        break;
      }
      case 'deleteGoalContribution':
        if (confirm('Bu katkı silinecek. Emin misiniz?')) store.removeGoalContribution(btn.dataset.id);
        break;
      default: break;
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.id === 'currencySelect') store.setCurrency(e.target.value);
  });
}

// Bir tutar alanı başarıyla kaydedildiğinde çevresinde kısa bir yeşil
// "onaylandı" titreşimi gösterir.
function flashSaved(t) {
  const field = t.closest('.field');
  if (!field) return;
  field.classList.remove('field-saved');
  void field.offsetWidth;
  field.classList.add('field-saved');
}

function openModal(id) { store.openModalUI(id); }
function closeModal() { store.closeModalUI(); }

// İlerleme halkası ve çubuklarının sıfırdan dolarak gelmesini sağlar.
function animateFills() {
  requestAnimationFrame(() => {
    document.querySelectorAll('.ring-fill[data-offset]').forEach(el => {
      el.style.strokeDashoffset = el.dataset.offset;
    });
    document.querySelectorAll('.progress-fill[data-target-width]').forEach(el => {
      el.style.width = el.dataset.targetWidth;
    });
  });
}

/* ---------------- Kullanıcı listesi sürükle-bırak (pointer tabanlı, dokunmatik uyumlu) ---------------- */
function setupUserDragDrop() {
  const list = document.getElementById('userRowsList');
  if (!list) return;

  list.querySelectorAll('[data-drag-handle]').forEach(handle => {
    handle.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      const row = handle.closest('[data-user-row]');
      if (!row) return;
      let startY = e.clientY;
      row.style.position = 'relative';
      row.style.zIndex = '10';
      row.style.boxShadow = '0 10px 24px rgba(20,30,60,0.18)';

      function onMove(ev) {
        const dy = ev.clientY - startY;
        row.style.transform = `translateY(${dy}px)`;
        const rows = Array.from(list.children);
        const dragIndex = rows.indexOf(row);
        const dragRect = row.getBoundingClientRect();
        const dragMid = dragRect.top + dragRect.height / 2;
        rows.forEach((sibling, i) => {
          if (sibling === row) return;
          const rect = sibling.getBoundingClientRect();
          const mid = rect.top + rect.height / 2;
          if (i < dragIndex && dragMid < mid) {
            list.insertBefore(row, sibling);
            row.style.transform = 'translateY(0px)';
            startY = ev.clientY;
          } else if (i > dragIndex && dragMid > mid) {
            list.insertBefore(row, sibling.nextSibling);
            row.style.transform = 'translateY(0px)';
            startY = ev.clientY;
          }
        });
      }

      function onUp() {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        row.style.transform = '';
        row.style.zIndex = '';
        row.style.boxShadow = '';
        const orderedIds = Array.from(list.children).map(r => r.dataset.userRow);
        store.reorderUsersByIds(orderedIds);
      }

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  });
}

function loadSampleData() {
  const users = store.data.users;
  const key1 = '2026-07', key2 = '2026-08';
  const [u1, u2] = users;
  const mk = (extraExpense, birikim) => ({
    incomes: { [u1.id]: 2450, [u2.id]: 2100 },
    extraIncome: 0,
    fixedExpenses: [
      { id: crypto.randomUUID(), name: 'Kira', amount: 1250, categoryId: store.data.categories[0]?.id || null },
      { id: crypto.randomUUID(), name: 'Vodafone', amount: 45, categoryId: store.data.categories[1]?.id || null },
      { id: crypto.randomUUID(), name: 'Doğalgaz ve Elektrik', amount: 110, categoryId: store.data.categories[1]?.id || null },
      { id: crypto.randomUUID(), name: 'Su', amount: 25, categoryId: store.data.categories[1]?.id || null }
    ],
    extras: [{ id: crypto.randomUUID(), name: extraExpense.name, amount: extraExpense.amount, categoryId: store.data.categories[2]?.id || null }],
    pool: 1000,
    birikim,
    allowance: { [u1.id]: 250, [u2.id]: 250 },
    personalSavings: { [u1.id]: { amount: 100, redirectToJoint: false }, [u2.id]: { amount: 0, redirectToJoint: true } },
    personalNote: { [u1.id]: 0, [u2.id]: 300 },
    balanceOverride: null
  });
  store.data.months = {
    [key1]: mk({ name: 'Yıllık sigorta', amount: 440 }, 0),
    [key2]: mk({ name: 'Tatil harcaması', amount: 450 }, 300)
  };
  store.data.currentMonth = key2;
  store.data.settings.baseline = 28000;
  store.data.settings.jointSavingsBaseline = 2000;
  store.data.settings.personalSavingsBaseline = { [u1.id]: 500, [u2.id]: 300 };
  store.emit();
  showToast('Örnek veriler yüklendi');
}
