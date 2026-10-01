import confetti from 'canvas-confetti';

export function burstConfetti(opts = {}) {
  const defaults = { particleCount: 90, spread: 70, origin: { y: 0.6 }, zIndex: 9999 };
  try { confetti({ ...defaults, ...opts }); } catch { /* tarayıcı desteklemiyorsa sessizce geç */ }
}

export function celebrateGoalComplete() {
  burstConfetti({ particleCount: 140, spread: 100, startVelocity: 45, colors: ['#16B893', '#F2BB68', '#A79BFF', '#FF8478'] });
  setTimeout(() => burstConfetti({ particleCount: 70, spread: 120, origin: { y: 0.4 } }), 250);
}

export function celebrateMilestone() {
  burstConfetti({ particleCount: 130, spread: 90, colors: ['#16B893', '#F2BB68', '#A79BFF'] });
}

/* ---------------- Birikim kilometre taşları ---------------- */
const MILESTONE_KEY = 'butce-celebrated-milestones-v1';
const TIERS = [1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

function loadCelebrated() {
  try { return JSON.parse(localStorage.getItem(MILESTONE_KEY) || '{}'); } catch { return {}; }
}
function saveCelebrated(obj) {
  try { localStorage.setItem(MILESTONE_KEY, JSON.stringify(obj)); } catch { /* yoksay */ }
}

// Belirli yuvarlak eşikleri (1.000, 5.000, 10.000, 50.000 ...) ilk kez
// geçtiğinde o eşiği döner (bir kereye mahsus); geçilmediyse null döner.
export function checkWealthMilestone(key, amount) {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const celebrated = loadCelebrated();
  const already = celebrated[key] || 0;
  const crossed = TIERS.filter(t => amount >= t && already < t);
  if (crossed.length === 0) return null;
  const newTier = crossed[crossed.length - 1];
  celebrated[key] = newTier;
  saveCelebrated(celebrated);
  return newTier;
}
