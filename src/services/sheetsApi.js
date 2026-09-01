/**
 * Google Apps Script Web App ile iletişim katmanı.
 *
 * Apps Script Web App'lere POST isteği atarken CORS ön kontrolünü (preflight)
 * tetiklememek için Content-Type "text/plain;charset=utf-8" olarak gönderilir;
 * gövde yine JSON metnidir ve sunucu tarafında (Code.gs) JSON.parse edilir.
 * Bu, Apps Script + statik site (GitHub Pages) entegrasyonunda bilinen ve
 * güvenilir bir örüntüdür.
 */

async function callApi(url, action, payload = {}) {
  if (!url) throw new Error('Google Sheets bağlantı adresi tanımlı değil.');
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload })
    });
  } catch (err) {
    throw new Error('Sunucuya ulaşılamadı. URL doğru mu ve internet bağlantınız var mı?');
  }
  if (!res.ok) {
    throw new Error(`Sunucu hatası (HTTP ${res.status}). Apps Script dağıtımınızı kontrol edin.`);
  }
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Sunucudan geçersiz yanıt geldi. Apps Script kodunuzu (Code.gs) kontrol edin.');
  }
  if (!data.ok) {
    throw new Error(data.error || 'Bilinmeyen bir hata oluştu.');
  }
  return data.result;
}

export function testConnection(url) {
  return callApi(url, 'ping');
}

export function fetchAllData(url) {
  return callApi(url, 'getAll');
}

export function saveMonth(url, monthKey, data) {
  return callApi(url, 'saveMonth', { monthKey, data });
}

export function saveUsers(url, users) {
  return callApi(url, 'saveUsers', { users });
}

export function saveGoals(url, goals) {
  return callApi(url, 'saveGoals', { goals });
}

export function saveGoalContribution(url, contribution) {
  return callApi(url, 'saveGoalContribution', contribution);
}

export function updateGoalContribution(url, contribution) {
  return callApi(url, 'updateGoalContribution', contribution);
}

export function deleteGoalContribution(url, id) {
  return callApi(url, 'deleteGoalContribution', { id });
}

export function saveSettings(url, settings) {
  return callApi(url, 'saveSettings', { settings });
}

export function saveRecurring(url, templates) {
  return callApi(url, 'saveRecurring', { templates });
}

export function saveCategories(url, categories) {
  return callApi(url, 'saveCategories', { categories });
}
