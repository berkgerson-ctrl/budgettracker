/**
 * Bütçe Uygulaması — Google Apps Script Web App Backend
 * ------------------------------------------------------
 * Bu dosyayı bağlı olduğu Google E-Tablonun Apps Script düzenleyicisine
 * (Uzantılar → Apps Script) yapıştırın, ardından "Dağıt → Yeni Dağıtım →
 * Web Uygulaması" ile "Yürütme kimliği: Ben" ve "Erişimi olanlar: Herkes"
 * seçenekleriyle yayınlayın. Oluşan URL'yi uygulamanın Ayarlar panelindeki
 * "Google Sheets Bağlantısı" alanına yapıştırın.
 *
 * Tüm sekmeler (sheet) eksikse otomatik olarak oluşturulur; e-tabloyu elle
 * hazırlamanıza gerek yoktur.
 */

const SHEETS = {
  SETTINGS: 'Settings',
  USERS: 'Users',
  MONTHS: 'Months',
  GOALS: 'Goals',
  GOAL_CONTRIBUTIONS: 'GoalContributions',
  RECURRING: 'RecurringTemplates',
  CATEGORIES: 'Categories'
};

function doGet(e) {
  return jsonResponse({ ok: true, result: { message: 'Bütçe API çalışıyor. Uygulama üzerinden POST isteği kullanın.' } });
}

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    const action = body.action;
    const payload = body.payload || {};
    let result;

    switch (action) {
      case 'ping':
        result = { pong: true, time: new Date().toISOString() };
        break;
      case 'getAll':
        result = getAllData();
        break;
      case 'saveMonth':
        result = saveMonth(payload.monthKey, payload.data);
        break;
      case 'saveUsers':
        result = saveUsers(payload.users);
        break;
      case 'saveGoals':
        result = saveGoals(payload.goals);
        break;
      case 'saveGoalContribution':
        result = saveGoalContribution(payload);
        break;
      case 'updateGoalContribution':
        result = updateGoalContributionRow(payload);
        break;
      case 'deleteGoalContribution':
        result = deleteGoalContributionRow(payload);
        break;
      case 'saveSettings':
        result = saveSettings(payload.settings);
        break;
      case 'saveRecurring':
        result = saveRecurring(payload.templates);
        break;
      case 'saveCategories':
        result = saveCategories(payload.categories);
        break;
      default:
        throw new Error('Bilinmeyen işlem: ' + action);
    }

    return jsonResponse({ ok: true, result });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSS() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(name, headers) {
  const ss = getSS();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ---------------- Months (ay verisi JSON blob olarak tek satırda) ---------------- */

function saveMonth(monthKey, data) {
  const sh = getOrCreateSheet(SHEETS.MONTHS, ['monthKey', 'dataJson', 'updatedAt']);
  const values = sh.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === monthKey) { rowIndex = i + 1; break; }
  }
  const row = [monthKey, JSON.stringify(data), new Date().toISOString()];
  if (rowIndex > 0) sh.getRange(rowIndex, 1, 1, 3).setValues([row]);
  else sh.appendRow(row);
  return { saved: true };
}

function readMonths() {
  const sh = getOrCreateSheet(SHEETS.MONTHS, ['monthKey', 'dataJson', 'updatedAt']);
  const values = sh.getDataRange().getValues();
  const months = {};
  for (let i = 1; i < values.length; i++) {
    const [monthKey, dataJson] = values[i];
    if (!monthKey) continue;
    try { months[monthKey] = JSON.parse(dataJson); } catch (e) { /* bozuk satırı atla */ }
  }
  return months;
}

/* ---------------- Users ---------------- */

function saveUsers(users) {
  const sh = getOrCreateSheet(SHEETS.USERS, ['id', 'name', 'active', 'redirectToJoint']);
  sh.clearContents();
  sh.appendRow(['id', 'name', 'active', 'redirectToJoint']);
  (users || []).forEach(u => sh.appendRow([u.id, u.name, !!u.active, !!u.redirectToJoint]));
  return { saved: true };
}

function readUsers() {
  const sh = getOrCreateSheet(SHEETS.USERS, ['id', 'name', 'active', 'redirectToJoint']);
  const values = sh.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < values.length; i++) {
    const [id, name, active, redirectToJoint] = values[i];
    if (!id) continue;
    users.push({ id: String(id), name, active: active === true || active === 'TRUE', redirectToJoint: redirectToJoint === true || redirectToJoint === 'TRUE' });
  }
  return users;
}

/* ---------------- Goals & Contributions ---------------- */

function saveGoals(goals) {
  const sh = getOrCreateSheet(SHEETS.GOALS, ['id', 'name', 'targetAmount', 'monthlyContribution', 'targetDate', 'createdAt', 'status']);
  sh.clearContents();
  sh.appendRow(['id', 'name', 'targetAmount', 'monthlyContribution', 'targetDate', 'createdAt', 'status']);
  (goals || []).forEach(g => sh.appendRow([g.id, g.name, g.targetAmount, g.monthlyContribution || '', g.targetDate || '', g.createdAt, g.status || 'active']));
  return { saved: true };
}

function readGoals() {
  const sh = getOrCreateSheet(SHEETS.GOALS, ['id', 'name', 'targetAmount', 'monthlyContribution', 'targetDate', 'createdAt', 'status']);
  const values = sh.getDataRange().getValues();
  const goals = [];
  for (let i = 1; i < values.length; i++) {
    const [id, name, targetAmount, monthlyContribution, targetDate, createdAt, status] = values[i];
    if (!id) continue;
    goals.push({
      id: String(id), name, targetAmount: Number(targetAmount) || 0,
      monthlyContribution: monthlyContribution ? Number(monthlyContribution) : null,
      targetDate: targetDate || null, createdAt, status: status || 'active'
    });
  }
  return goals;
}

function saveGoalContribution(payload) {
  const sh = getOrCreateSheet(SHEETS.GOAL_CONTRIBUTIONS, ['id', 'goalId', 'monthKey', 'amount', 'date']);
  sh.appendRow([payload.id, payload.goalId, payload.monthKey, payload.amount, new Date().toISOString()]);
  return { saved: true };
}

function updateGoalContributionRow(payload) {
  const sh = getOrCreateSheet(SHEETS.GOAL_CONTRIBUTIONS, ['id', 'goalId', 'monthKey', 'amount', 'date']);
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === payload.id) {
      sh.getRange(i + 1, 4).setValue(payload.amount); // "amount" sütunu
      return { saved: true };
    }
  }
  return { saved: false, error: 'Kayıt bulunamadı' };
}

function deleteGoalContributionRow(payload) {
  const sh = getOrCreateSheet(SHEETS.GOAL_CONTRIBUTIONS, ['id', 'goalId', 'monthKey', 'amount', 'date']);
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === payload.id) {
      sh.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  return { deleted: false };
}

function readGoalContributions() {
  const sh = getOrCreateSheet(SHEETS.GOAL_CONTRIBUTIONS, ['id', 'goalId', 'monthKey', 'amount', 'date']);
  const values = sh.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < values.length; i++) {
    const [id, goalId, monthKey, amount, date] = values[i];
    if (!id) continue;
    list.push({ id: String(id), goalId: String(goalId), monthKey, amount: Number(amount) || 0, date });
  }
  return list;
}

/* ---------------- Recurring Templates ---------------- */

function saveRecurring(templates) {
  const sh = getOrCreateSheet(SHEETS.RECURRING, ['id', 'name', 'amount', 'categoryId', 'active']);
  sh.clearContents();
  sh.appendRow(['id', 'name', 'amount', 'categoryId', 'active']);
  (templates || []).forEach(t => sh.appendRow([t.id, t.name, t.amount, t.categoryId || '', !!t.active]));
  return { saved: true };
}

function readRecurring() {
  const sh = getOrCreateSheet(SHEETS.RECURRING, ['id', 'name', 'amount', 'categoryId', 'active']);
  const values = sh.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < values.length; i++) {
    const [id, name, amount, categoryId, active] = values[i];
    if (!id) continue;
    list.push({ id: String(id), name, amount: Number(amount) || 0, categoryId: categoryId || null, active: active === true || active === 'TRUE' });
  }
  return list;
}

/* ---------------- Categories ---------------- */

function saveCategories(categories) {
  const sh = getOrCreateSheet(SHEETS.CATEGORIES, ['id', 'name', 'limit', 'color']);
  sh.clearContents();
  sh.appendRow(['id', 'name', 'limit', 'color']);
  (categories || []).forEach(c => sh.appendRow([c.id, c.name, c.limit ?? '', c.color || '']));
  return { saved: true };
}

function readCategories() {
  const sh = getOrCreateSheet(SHEETS.CATEGORIES, ['id', 'name', 'limit', 'color']);
  const values = sh.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < values.length; i++) {
    const [id, name, limit, color] = values[i];
    if (!id) continue;
    list.push({ id: String(id), name, limit: limit === '' ? null : Number(limit), color: color || null });
  }
  return list;
}

/* ---------------- Settings (key-value) ---------------- */

function saveSettings(settings) {
  const sh = getOrCreateSheet(SHEETS.SETTINGS, ['key', 'value']);
  sh.clearContents();
  sh.appendRow(['key', 'value']);
  Object.entries(settings || {}).forEach(([k, v]) => sh.appendRow([k, typeof v === 'object' ? JSON.stringify(v) : v]));
  return { saved: true };
}

function readSettings() {
  const sh = getOrCreateSheet(SHEETS.SETTINGS, ['key', 'value']);
  const values = sh.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < values.length; i++) {
    const [key, value] = values[i];
    if (!key) continue;
    settings[key] = value;
  }
  return settings;
}

/* ---------------- Toplu okuma ---------------- */

function getAllData() {
  return {
    settings: readSettings(),
    users: readUsers(),
    months: readMonths(),
    goals: readGoals(),
    goalContributions: readGoalContributions(),
    recurringTemplates: readRecurring(),
    categories: readCategories()
  };
}
