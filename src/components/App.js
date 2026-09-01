import { store, activeUsers, monthTotals } from '../state.js';
import { ICON } from './icons.js';
import { renderHeader } from './Header.js';
import { renderMonthPills } from './MonthPills.js';
import { renderHomeScreen } from './HomeScreen.js';
import { renderExpensesScreen } from './ExpensesScreen.js';
import { renderWealthScreen } from './WealthScreen.js';
import { renderGoalsScreen } from './GoalsScreen.js';
import { renderChartScreen, mountCharts } from './ChartScreen.js';
import { renderSettingsModal } from './SettingsModal.js';
import { renderQuickAddModal } from './QuickAddModal.js';

const NAV_ITEMS = [
  { tab: 'home', icon: ICON.home, label: 'Ana sayfa' },
  { tab: 'expenses', icon: ICON.list, label: 'Giderler' },
  { tab: 'goals', icon: ICON.target, label: 'Hedefler' },
  { tab: 'wealth', icon: ICON.wallet, label: 'Varlık' },
  { tab: 'chart', icon: ICON.chart, label: 'Grafik' }
];

function bottomNav(state) {
  const navBtn = (item) => `
    <button data-tab="${item.tab}" class="nav-btn flex flex-col items-center gap-1 py-1 px-1.5 ${state.ui.activeTab === item.tab ? 'active' : ''}" aria-label="${item.label}">
      ${item.icon}
    </button>`;
  return `
    <div class="absolute bottom-0 inset-x-0 px-4 pb-5 pt-3 bg-white rounded-t-[1.75rem] border-t border-line flex items-center justify-around">
      ${NAV_ITEMS.map(navBtn).join('')}
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
          <div id="screenHome" class="${state.ui.activeTab === 'home' ? '' : 'hidden-screen'}">${renderHomeScreen(state)}</div>
          <div id="screenExpenses" class="${state.ui.activeTab === 'expenses' ? '' : 'hidden-screen'}">${renderExpensesScreen(state)}</div>
          <div id="screenWealth" class="${state.ui.activeTab === 'wealth' ? '' : 'hidden-screen'}">${renderWealthScreen(state, mainHistory, jointHistory, personalHistories)}</div>
          <div id="screenGoals" class="${state.ui.activeTab === 'goals' ? '' : 'hidden-screen'}">${renderGoalsScreen(state)}</div>
          <div id="screenChart" class="${state.ui.activeTab === 'chart' ? '' : 'hidden-screen'}">${renderChartScreen(state)}</div>
        </div>
        ${bottomNav(state)}
      </div>
    </div>
    ${renderQuickAddModal(state)}
    ${renderSettingsModal(state)}
    <div id="toast" class="toast fixed bottom-6 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none translate-y-2 bg-ink text-white text-xs px-4 py-2.5 rounded-full shadow-lg z-[60]">Kaydedildi</div>
  `;
}

let toastTimer = null;
function showToast(msg = 'Kaydedildi') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('opacity-0', 'translate-y-2');
  toast.classList.add('opacity-100', 'translate-y-0');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 1100);
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

    root.innerHTML = fullMarkup(store.data);

    const newScroller = document.getElementById('scrollArea');
    if (newScroller) newScroller.scrollTop = scrollTop;

    if (store.data.ui.activeTab === 'chart') {
      requestAnimationFrame(() => mountCharts(store.data));
    }

    setupUserDragDrop();

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

  /* ---------------- INPUT / CHANGE DELEGATION ---------------- */
  function handleFieldChange(e) {
    const t = e.target;
    const role = t.dataset.role;
    if (!role) return;
    const val = t.type === 'number' ? (t.value === '' ? '' : parseFloat(t.value) || 0) : t.value;

    switch (role) {
      case 'income': store.updateMonth(m => { m.incomes[t.dataset.user] = Number(val) || 0; }); break;
      case 'extraIncome': store.updateMonth(m => { m.extraIncome = Number(val) || 0; }); break;
      case 'fixedName': store.updateMonth(m => { const i = m.fixedExpenses.find(x => x.id === t.dataset.id); if (i) i.name = val; }); break;
      case 'fixedAmount': store.updateMonth(m => { const i = m.fixedExpenses.find(x => x.id === t.dataset.id); if (i) i.amount = Number(val) || 0; }); break;
      case 'fixedCategory': store.updateMonth(m => { const i = m.fixedExpenses.find(x => x.id === t.dataset.id); if (i) i.categoryId = val || null; }, true); break;
      case 'extraName': store.updateMonth(m => { const i = m.extras.find(x => x.id === t.dataset.id); if (i) i.name = val; }); break;
      case 'extraAmount': store.updateMonth(m => { const i = m.extras.find(x => x.id === t.dataset.id); if (i) i.amount = Number(val) || 0; }); break;
      case 'extraCategory': store.updateMonth(m => { const i = m.extras.find(x => x.id === t.dataset.id); if (i) i.categoryId = val || null; }, true); break;
      case 'pool': store.updateMonth(m => { m.pool = Number(val) || 0; }); break;
      case 'birikim': store.updateMonth(m => { m.birikim = Number(val) || 0; }); break;
      case 'allowance': store.updateMonth(m => { m.allowance[t.dataset.user] = Number(val) || 0; }); break;
      case 'personalNote': store.updateMonth(m => { m.personalNote[t.dataset.user] = Number(val) || 0; }); break;
      case 'goalContribAmount': store.updateGoalContribution(t.dataset.id, val); break;
      case 'personalSavingsAmount': store.updateMonth(m => {
          if (!m.personalSavings[t.dataset.user]) m.personalSavings[t.dataset.user] = { amount: 0, redirectToJoint: false };
          m.personalSavings[t.dataset.user].amount = Number(val) || 0;
        }); break;
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
  document.addEventListener('input', handleFieldChange);
  document.addEventListener('change', handleFieldChange);

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

      case 'openAddExtra': openModal('modalAddExtra'); break;
      case 'submitAddExtra': {
        const name = document.getElementById('quickExtraName').value.trim();
        const amount = parseFloat(document.getElementById('quickExtraAmount').value) || 0;
        const categoryId = document.getElementById('quickExtraCategory').value || null;
        if (name || amount) {
          store.updateMonth(m => { m.extras.push({ id: crypto.randomUUID(), name: name || 'Ekstra masraf', amount, categoryId }); }, true);
        }
        closeModal('modalAddExtra');
        break;
      }

      case 'resetBalanceOverride': store.clearBalanceOverride(); break;
      case 'setWealthLayer': store.setWealthLayer(btn.dataset.layer); break;

      case 'openSettings': openModal('modalSettings'); break;
      case 'closeModal': closeModal(btn.dataset.modal); break;
      case 'setSettingsTab': store.setSettingsTab(btn.dataset.stab); break;

      case 'testSheetsConnection': {
        const url = document.getElementById('sheetsUrlInput').value.trim();
        store.testConnection(url)
          .then(() => showToast('Bağlantı başarılı ✓'))
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
        const target = parseFloat(document.getElementById('goalTarget').value) || 0;
        const monthly = parseFloat(document.getElementById('goalMonthly').value) || null;
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
        const amount = parseFloat(input.value) || 0;
        if (amount > 0) { store.addGoalContribution(btn.dataset.id, amount); showToast('Hedefe eklendi'); input.value = ''; }
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

function openModal(id) { store.openModalUI(id); }
function closeModal() { store.closeModalUI(); }

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
