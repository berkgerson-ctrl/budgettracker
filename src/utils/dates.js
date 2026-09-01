export const MONTHS_TR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
export const MONTHS_TR_SHORT = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS_TR[m - 1]} ${y}`;
}

export function monthShort(key) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS_TR_SHORT[m - 1]} '${String(y).slice(2)}`;
}

export function nextMonthKey(key) {
  let [y, m] = key.split('-').map(Number);
  m += 1;
  if (m > 12) { m = 1; y += 1; }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function sortedKeys(obj) {
  return Object.keys(obj).sort();
}

export function todayMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function uid(prefix = 'x') {
  return prefix + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
}

// Hedef tarihe kaç tam ay kaldığını hesaplar
export function monthsUntil(dateStr, fromDate = new Date()) {
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const months = (target.getFullYear() - fromDate.getFullYear()) * 12 + (target.getMonth() - fromDate.getMonth());
  return Math.max(1, months);
}

export function formatDateTR(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
}
