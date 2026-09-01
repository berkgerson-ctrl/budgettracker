import { uid, sortedKeys, todayMonthKey, nextMonthKey, monthsUntil } from './utils/dates.js';
import * as api from './services/sheetsApi.js';

const LOCAL_URL_KEY = 'butce-sheets-url-v1';

function defaultUsers() {
  return [
    { id: uid('u'), name: 'Tracy', active: true, redirectToJoint: false },
    { id: uid('u'), name: 'Berk', active: true, redirectToJoint: false }
  ];
}

function defaultCategories() {
  return [
    { id: uid('c'), name: 'Konut', limit: null, color: '#16B893' },
    { id: uid('c'), name: 'Faturalar', limit: null, color: '#E8A23A' },
    { id: uid('c'), name: 'Diğer', limit: null, color: '#F0665A' }
  ];
}

function emptyMonth(users) {
  return {
    incomes: Object.fromEntries(users.map(u => [u.id, 0])),
    extraIncome: 0,
    fixedExpenses: [],
    extras: [],
    pool: 0,
    birikim: 0,
    allowance: Object.fromEntries(users.map(u => [u.id, 0])),
    personalSavings: Object.fromEntries(users.map(u => [u.id, { amount: 0, redirectToJoint: false }])),
    personalNote: Object.fromEntries(users.map(u => [u.id, 0])),
    balanceOverride: null
  };
}

function sanitizeMonth(raw, users) {
  const base = emptyMonth(users);
  if (!raw) return base;
  return {
    incomes: { ...base.incomes, ...(raw.incomes || {}) },
    extraIncome: Number(raw.extraIncome) || 0,
    fixedExpenses: Array.isArray(raw.fixedExpenses) ? raw.fixedExpenses.map(i => ({ id: i.id || uid('f'), name: i.name || '', amount: Number(i.amount) || 0, categoryId: i.categoryId || null, templateId: i.templateId || null })) : [],
    extras: Array.isArray(raw.extras) ? raw.extras.map(i => ({ id: i.id || uid('e'), name: i.name || '', amount: Number(i.amount) || 0, categoryId: i.categoryId || null })) : [],
    pool: Number(raw.pool) || 0,
    birikim: Number(raw.birikim) || 0,
    allowance: { ...base.allowance, ...(raw.allowance || {}) },
    personalSavings: { ...base.personalSavings, ...(raw.personalSavings || {}) },
    personalNote: { ...base.personalNote, ...(raw.personalNote || {}) },
    balanceOverride: typeof raw.balanceOverride === 'number' ? raw.balanceOverride : null
  };
}

/* ---------------- HESAPLAMA FONKSİYONLARI ---------------- */

export function activeUsers(users) {
  return users.filter(u => u.active);
}

export function monthTotals(month, users) {
  const list = activeUsers(users);
  const incomeUsers = list.reduce((s, u) => s + (Number(month.incomes[u.id]) || 0), 0);
  const totalIncome = incomeUsers + (Number(month.extraIncome) || 0);
  const totalFixed = (month.fixedExpenses || []).reduce((a, i) => a + (Number(i.amount) || 0), 0);
  const totalExtras = (month.extras || []).reduce((a, i) => a + (Number(i.amount) || 0), 0);
  const totalAllowance = list.reduce((s, u) => s + (Number(month.allowance[u.id]) || 0), 0);
  const totalPoolAllowance = (Number(month.pool) || 0) + totalAllowance;
  const birikim = Number(month.birikim) || 0;
  const personalSavingsTotal = list.reduce((s, u) => {
    const ps = month.personalSavings[u.id];
    return s + (ps ? Number(ps.amount) || 0 : 0);
  }, 0);
  // "Kalan" (harcanabilir bakiye): Birikim + Kişisel Birikimler de bir gider gibi düşülür.
  const totalOut = totalFixed + totalExtras + totalPoolAllowance + birikim + personalSavingsTotal;
  const net = totalIncome - totalOut;
  // Ana toplam varlık zinciri: Birikim ve kişisel birikimler nötrdür (kaybolmaz, ayrı katmana taşınır).
  const wealthNet = totalIncome - totalFixed - totalExtras - totalPoolAllowance;
  const pct = totalIncome > 0 ? Math.min(100, Math.max(0, (totalOut / totalIncome) * 100)) : 0;
  return { totalIncome, totalFixed, totalExtras, totalAllowance, totalPoolAllowance, birikim, personalSavingsTotal, totalOut, net, wealthNet, pct };
}

// Genel zincir hesaplayıcı: baseline + her ay eklenen değer, override edilebilir.
function computeChain(monthKeys, months, baseline, getMonthlyValue, getOverride) {
  let running = baseline || 0;
  return monthKeys.map(key => {
    const m = months[key];
    const val = getMonthlyValue(m, key);
    const start = running;
    const computedEnd = start + val;
    const override = getOverride ? getOverride(m) : null;
    const overridden = typeof override === 'number';
    const end = overridden ? override : computedEnd;
    running = end;
    return { key, start, net: val, end, computedEnd, overridden };
  });
}

export function categorySpend(months, categoryId) {
  let total = 0;
  Object.values(months).forEach(m => {
    (m.fixedExpenses || []).forEach(i => { if (i.categoryId === categoryId) total += Number(i.amount) || 0; });
    (m.extras || []).forEach(i => { if (i.categoryId === categoryId) total += Number(i.amount) || 0; });
  });
  return total;
}

export function categorySpendForMonth(month, categoryId) {
  let total = 0;
  (month.fixedExpenses || []).forEach(i => { if (i.categoryId === categoryId) total += Number(i.amount) || 0; });
  (month.extras || []).forEach(i => { if (i.categoryId === categoryId) total += Number(i.amount) || 0; });
  return total;
}

export function goalCurrentAmount(goalId, contributions) {
  return contributions.filter(c => c.goalId === goalId).reduce((a, c) => a + (Number(c.amount) || 0), 0);
}

export function goalProgressPct(goal, currentAmount) {
  if (!goal.targetAmount) return 0;
  return Math.min(100, Math.max(0, (currentAmount / goal.targetAmount) * 100));
}

export function goalMonthsToComplete(goal, currentAmount) {
  const remaining = goal.targetAmount - currentAmount;
  if (remaining <= 0) return 0;
  if (!goal.monthlyContribution || goal.monthlyContribution <= 0) return null;
  return Math.ceil(remaining / goal.monthlyContribution);
}

export function goalRequiredMonthly(goal, currentAmount) {
  if (!goal.targetDate) return null;
  const remaining = goal.targetAmount - currentAmount;
  if (remaining <= 0) return 0;
  const months = monthsUntil(goal.targetDate);
  if (!months) return null;
  return remaining / months;
}

/* ---------------- STORE ---------------- */

class Store {
  constructor() {
    this.listeners = new Set();
    const savedUrl = localStorage.getItem(LOCAL_URL_KEY) || '';
    this.data = {
      connection: { url: savedUrl, connected: false, syncing: false, lastSync: null, error: null, demoMode: !savedUrl },
      settings: { currency: 'EUR', baseline: 0, jointSavingsBaseline: 0, personalSavingsBaseline: {} },
      users: defaultUsers(),
      categories: defaultCategories(),
      recurringTemplates: [],
      months: {},
      goals: [],
      goalContributions: [],
      currentMonth: null,
      ui: { activeTab: 'home', openRows: new Set(), wealthLayer: 'main', settingsTab: 'connection', showNewGoalForm: false, openModal: null }
    };
  }

  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { this.listeners.forEach(fn => fn(this.data)); }

  get s() { return this.data; }
  cm() { return this.data.months[this.data.currentMonth]; }
  sortedMonthKeys() { return sortedKeys(this.data.months); }

  async init() {
    if (this.data.connection.url) {
      try { await this.syncFromSheets(); }
      catch (e) { this.data.connection.error = e.message; }
    }
    this.ensureAtLeastOneMonth();
    this.emit();
  }

  ensureAtLeastOneMonth() {
    if (Object.keys(this.data.months).length === 0) {
      const key = todayMonthKey();
      this.data.months[key] = emptyMonth(this.data.users);
    }
    if (!this.data.currentMonth || !this.data.months[this.data.currentMonth]) {
      const keys = this.sortedMonthKeys();
      this.data.currentMonth = keys[keys.length - 1];
    }
  }

  async connect(url) {
    this.data.connection.url = url;
    localStorage.setItem(LOCAL_URL_KEY, url);
    this.data.connection.demoMode = false;
    await this.syncFromSheets();
    this.ensureAtLeastOneMonth();
    this.emit();
  }

  disconnect() {
    localStorage.removeItem(LOCAL_URL_KEY);
    this.data.connection.url = '';
    this.data.connection.connected = false;
    this.data.connection.demoMode = true;
    this.emit();
  }

  testConnection(url) { return api.testConnection(url); }

  async syncFromSheets() {
    this.data.connection.syncing = true; this.emit();
    try {
      const all = await api.fetchAllData(this.data.connection.url);
      if (all.users && all.users.length) this.data.users = all.users;
      if (all.categories && all.categories.length) this.data.categories = all.categories;
      if (all.recurringTemplates) this.data.recurringTemplates = all.recurringTemplates;
      if (all.goals) this.data.goals = all.goals;
      if (all.goalContributions) this.data.goalContributions = all.goalContributions;
      if (all.months) {
        const sanitized = {};
        Object.entries(all.months).forEach(([k, v]) => { sanitized[k] = sanitizeMonth(v, this.data.users); });
        this.data.months = sanitized;
      }
      if (all.settings) {
        if (all.settings.currency) this.data.settings.currency = all.settings.currency;
        if (all.settings.baseline !== undefined) this.data.settings.baseline = Number(all.settings.baseline) || 0;
        if (all.settings.jointSavingsBaseline !== undefined) this.data.settings.jointSavingsBaseline = Number(all.settings.jointSavingsBaseline) || 0;
        if (all.settings.personalSavingsBaseline) {
          try { this.data.settings.personalSavingsBaseline = JSON.parse(all.settings.personalSavingsBaseline); }
          catch { /* already object */ if (typeof all.settings.personalSavingsBaseline === 'object') this.data.settings.personalSavingsBaseline = all.settings.personalSavingsBaseline; }
        }
      }
      this.data.connection.connected = true;
      this.data.connection.lastSync = new Date().toISOString();
      this.data.connection.error = null;
    } finally {
      this.data.connection.syncing = false;
      this.emit();
    }
  }

  /* ----- Push helpers (sessiz başarısızlık yerine hataları connection.error'a yazar) ----- */
  async _push(fn) {
    if (this.data.connection.demoMode) return;
    try {
      this.data.connection.syncing = true; this.emit();
      await fn();
      this.data.connection.lastSync = new Date().toISOString();
      this.data.connection.error = null;
    } catch (e) {
      this.data.connection.error = e.message;
    } finally {
      this.data.connection.syncing = false;
      this.emit();
    }
  }

  pushCurrentMonth() { return this._push(() => api.saveMonth(this.data.connection.url, this.data.currentMonth, this.cm())); }
  pushUsers() { return this._push(() => api.saveUsers(this.data.connection.url, this.data.users)); }
  pushGoals() { return this._push(() => api.saveGoals(this.data.connection.url, this.data.goals)); }
  pushSettings() {
    const flat = { ...this.data.settings, personalSavingsBaseline: JSON.stringify(this.data.settings.personalSavingsBaseline || {}) };
    return this._push(() => api.saveSettings(this.data.connection.url, flat));
  }
  pushRecurring() { return this._push(() => api.saveRecurring(this.data.connection.url, this.data.recurringTemplates)); }
  pushCategories() { return this._push(() => api.saveCategories(this.data.connection.url, this.data.categories)); }
  pushGoalContribution(contribution) { return this._push(() => api.saveGoalContribution(this.data.connection.url, contribution)); }
  pushGoalContributionUpdate(contribution) { return this._push(() => api.updateGoalContribution(this.data.connection.url, contribution)); }
  pushGoalContributionDelete(id) { return this._push(() => api.deleteGoalContribution(this.data.connection.url, id)); }

  /* ----- Ay yönetimi ----- */
  selectMonth(key) {
    if (this.data.months[key]) { this.data.currentMonth = key; this.emit(); }
  }

  addMonth() {
    const keys = this.sortedMonthKeys();
    const last = keys[keys.length - 1];
    const newKey = nextMonthKey(last);
    if (this.data.months[newKey]) { this.data.currentMonth = newKey; this.emit(); return; }
    const prev = this.data.months[last];
    const fresh = emptyMonth(this.data.users);
    const carried = {
      ...fresh,
      incomes: { ...prev.incomes },
      pool: prev.pool,
      birikim: prev.birikim,
      allowance: { ...prev.allowance },
      personalSavings: JSON.parse(JSON.stringify(prev.personalSavings)),
      personalNote: { ...prev.personalNote },
      fixedExpenses: (this.data.recurringTemplates || [])
        .filter(t => t.active)
        .map(t => ({ id: uid('f'), name: t.name, amount: t.amount, categoryId: t.categoryId, templateId: t.id }))
    };
    // recurring template yoksa önceki ayın sabit giderlerini taşı (id'leri yenile)
    if (carried.fixedExpenses.length === 0 && prev.fixedExpenses.length) {
      carried.fixedExpenses = prev.fixedExpenses.map(i => ({ ...i, id: uid('f') }));
    }
    this.data.months[newKey] = carried;
    this.data.currentMonth = newKey;
    this.emit();
    this.pushCurrentMonth();
  }

  updateMonth(mutator, immediate = false) {
    mutator(this.cm());
    this.emit();
    if (immediate) {
      this.pushCurrentMonth();
    } else {
      clearTimeout(this._monthPushTimer);
      this._monthPushTimer = setTimeout(() => this.pushCurrentMonth(), 700);
    }
  }

  /* ----- Kullanıcılar ----- */
  addUser(name) {
    const u = { id: uid('u'), name: name || 'Yeni Kullanıcı', active: true, redirectToJoint: false };
    this.data.users.push(u);
    Object.values(this.data.months).forEach(m => {
      m.incomes[u.id] = 0; m.allowance[u.id] = 0; m.personalNote[u.id] = 0;
      m.personalSavings[u.id] = { amount: 0, redirectToJoint: false };
    });
    this.emit();
    this.pushUsers(); this.pushCurrentMonth();
  }
  toggleUserActive(id) {
    const u = this.data.users.find(x => x.id === id);
    if (u) { u.active = !u.active; this.emit(); this.pushUsers(); }
  }
  removeUser(id) {
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.emit();
    this.pushUsers();
  }
  renameUser(id, name) {
    const u = this.data.users.find(x => x.id === id);
    if (u) { u.name = name; this.emit(); this.pushUsers(); }
  }
  toggleUserRedirect(id) {
    const u = this.data.users.find(x => x.id === id);
    if (u) { u.redirectToJoint = !u.redirectToJoint; this.emit(); this.pushUsers(); }
  }
  reorderUsersByIds(orderedIds) {
    const map = new Map(this.data.users.map(u => [u.id, u]));
    const newList = orderedIds.map(id => map.get(id)).filter(Boolean);
    this.data.users.forEach(u => { if (!orderedIds.includes(u.id)) newList.push(u); });
    this.data.users = newList;
    this.emit();
    this.pushUsers();
  }

  /* ----- Varlık zincirleri ----- */
  mainWealthHistory() {
    const keys = this.sortedMonthKeys();
    return computeChain(keys, this.data.months, this.data.settings.baseline,
      m => monthTotals(m, this.data.users).wealthNet,
      m => m.balanceOverride);
  }

  jointSavingsHistory() {
    const keys = this.sortedMonthKeys();
    return computeChain(keys, this.data.months, this.data.settings.jointSavingsBaseline,
      m => {
        let v = Number(m.birikim) || 0;
        activeUsers(this.data.users).forEach(u => {
          const ps = m.personalSavings[u.id];
          if (ps && ps.redirectToJoint) v += Number(ps.amount) || 0;
        });
        return v;
      }, null);
  }

  personalSavingsHistory(userId) {
    const keys = this.sortedMonthKeys();
    const baseline = (this.data.settings.personalSavingsBaseline || {})[userId] || 0;
    return computeChain(keys, this.data.months, baseline,
      m => {
        const ps = m.personalSavings[userId];
        if (!ps || ps.redirectToJoint) return 0;
        return Number(ps.amount) || 0;
      }, null);
  }
}

/* ---------------- Ek Store metodları (debounce'lu ayarlar & liste yönetimi) ---------------- */

const _timers = {};
function debounced(key, fn, delay = 700) {
  clearTimeout(_timers[key]);
  _timers[key] = setTimeout(fn, delay);
}

Object.assign(Store.prototype, {
  setBaseline(v) { this.data.settings.baseline = Number(v) || 0; this.emit(); debounced('baseline', () => this.pushSettings()); },
  setJointBaseline(v) { this.data.settings.jointSavingsBaseline = Number(v) || 0; this.emit(); debounced('jointBaseline', () => this.pushSettings()); },
  setPersonalBaseline(userId, v) {
    if (!this.data.settings.personalSavingsBaseline) this.data.settings.personalSavingsBaseline = {};
    this.data.settings.personalSavingsBaseline[userId] = Number(v) || 0;
    this.emit();
    debounced('personalBaseline', () => this.pushSettings());
  },
  setCurrency(v) { this.data.settings.currency = v; this.emit(); this.pushSettings(); },
  setBalanceOverride(v) {
    this.cm().balanceOverride = v === '' ? null : (Number(v) || 0);
    this.emit();
    debounced('balanceOverride', () => this.pushCurrentMonth());
  },
  clearBalanceOverride() { this.cm().balanceOverride = null; this.emit(); this.pushCurrentMonth(); },

  setWealthLayer(layer) { this.data.ui.wealthLayer = layer; this.emit(); },
  setSettingsTab(tab) { this.data.ui.settingsTab = tab; this.emit(); },
  openModalUI(id) { this.data.ui.openModal = id; this.emit(); },
  closeModalUI() { this.data.ui.openModal = null; this.emit(); },
  toggleAccordion(key) {
    if (this.data.ui.openRows.has(key)) this.data.ui.openRows.delete(key);
    else this.data.ui.openRows.add(key);
    this.emit();
  },

  addCategory(name) {
    this.data.categories.push({ id: uid('c'), name: name || 'Yeni Kategori', limit: null, color: '#8891A0' });
    this.emit(); this.pushCategories();
  },
  updateCategory(id, patch) {
    const c = this.data.categories.find(x => x.id === id);
    if (c) { Object.assign(c, patch); this.emit(); debounced('category-' + id, () => this.pushCategories()); }
  },
  removeCategory(id) { this.data.categories = this.data.categories.filter(c => c.id !== id); this.emit(); this.pushCategories(); },

  addTemplate(t) { this.data.recurringTemplates.push({ id: uid('t'), active: true, ...t }); this.emit(); this.pushRecurring(); },
  updateTemplate(id, patch) {
    const t = this.data.recurringTemplates.find(x => x.id === id);
    if (t) { Object.assign(t, patch); this.emit(); debounced('template-' + id, () => this.pushRecurring()); }
  },
  toggleTemplateActive(id) {
    const t = this.data.recurringTemplates.find(x => x.id === id);
    if (t) { t.active = !t.active; this.emit(); this.pushRecurring(); }
  },
  removeTemplate(id) { this.data.recurringTemplates = this.data.recurringTemplates.filter(t => t.id !== id); this.emit(); this.pushRecurring(); },
  saveCurrentFixedAsTemplates() {
    const m = this.cm();
    this.data.recurringTemplates = m.fixedExpenses.map(i => ({ id: uid('t'), name: i.name, amount: i.amount, categoryId: i.categoryId, active: true }));
    this.emit(); this.pushRecurring();
  },

  toggleNewGoalForm() { this.data.ui.showNewGoalForm = !this.data.ui.showNewGoalForm; this.emit(); },
  addGoal(goal) {
    this.data.goals.push({ id: uid('g'), createdAt: new Date().toISOString(), status: 'active', ...goal });
    this.data.ui.showNewGoalForm = false;
    this.emit(); this.pushGoals();
  },
  removeGoal(id) { this.data.goals = this.data.goals.filter(g => g.id !== id); this.emit(); this.pushGoals(); },
  addGoalContribution(goalId, amount) {
    const contribution = { id: uid('gc'), goalId, monthKey: this.data.currentMonth, amount: Number(amount) || 0, date: new Date().toISOString() };
    this.data.goalContributions.push(contribution);
    this.emit();
    this.pushGoalContribution(contribution);
  },
  updateGoalContribution(id, amount) {
    const c = this.data.goalContributions.find(x => x.id === id);
    if (!c) return;
    c.amount = Number(amount) || 0;
    this.emit();
    debounced('goalContrib-' + id, () => this.pushGoalContributionUpdate(c));
  },
  removeGoalContribution(id) {
    this.data.goalContributions = this.data.goalContributions.filter(c => c.id !== id);
    this.emit();
    this.pushGoalContributionDelete(id);
  }
});

export const store = new Store();
export { emptyMonth, sanitizeMonth, defaultUsers, defaultCategories };
