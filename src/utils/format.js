const LOCALE_MAP = { EUR: 'de-DE', USD: 'en-US', TRY: 'tr-TR' };
export const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'USD', symbol: '$', label: 'Dolar ($)' },
  { code: 'TRY', symbol: '₺', label: 'Türk Lirası (₺)' }
];

export function currencySymbol(code) {
  return (CURRENCIES.find(c => c.code === code) || CURRENCIES[0]).symbol;
}

export function formatCurrency(amount, currency = 'EUR') {
  const val = Number.isFinite(amount) ? amount : 0;
  const locale = LOCALE_MAP[currency] || 'de-DE';
  try {
    return val.toLocaleString(locale, { style: 'currency', currency, maximumFractionDigits: 0 });
  } catch {
    return `${currencySymbol(currency)}${val.toFixed(0)}`;
  }
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Değeri 0/null/undefined olan sayı alanlarını input'ta boş göstermek için
// kullanılır — kullanıcı hiç veri girmediyse kutu boş kalır (placeholder "0"
// görünür), gerçekten "0" yazmışsa yine de kaydedilen veri 0'dır.
export function numOrEmpty(n) {
  return (n === 0 || n === null || n === undefined || Number.isNaN(n)) ? '' : n;
}

// Tutar alanlarına "150+45" gibi basit aritmetik ifadeler yazılabilmesini
// sağlar. Güvenlik için önce karakterler katı bir beyaz listeyle
// doğrulanır (yalnızca rakam, nokta, virgül, boşluk ve + - * / ( ) izinli);
// bu kontrolden geçmeyen hiçbir şey değerlendirilmez.
const SAFE_EXPR = /^[0-9+\-*/(). ,]+$/;
export function evalAmountExpression(raw) {
  if (raw === null || raw === undefined) return 0;
  const str = String(raw).trim();
  if (str === '') return 0;
  const normalized = str.replace(/,/g, '.');
  if (!SAFE_EXPR.test(str) && !SAFE_EXPR.test(normalized)) {
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  }
  try {
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + normalized + ')')();
    return Number.isFinite(result) ? Math.round(result * 100) / 100 : 0;
  } catch {
    return 0;
  }
}
