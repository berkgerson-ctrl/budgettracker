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
