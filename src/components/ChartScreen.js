import { Chart, registerables } from 'chart.js';
import { monthTotals, categorySpendForMonth } from '../state.js';
import { monthLabel, monthShort } from '../utils/dates.js';
import { formatCurrency } from '../utils/format.js';

Chart.register(...registerables);

let barChartInstance = null;
let donutChartInstance = null;

export function renderChartScreen(state) {
  return `
    <div class="pt-2 pb-1">
      <h2 class="font-extrabold text-xl text-ink">Grafik</h2>
      <p class="text-xs text-ink-soft">Aylık gelir-gider ve kategori dağılımı</p>
    </div>
    <div class="card rounded-2xl p-4 mt-4">
      <p class="text-sm font-bold text-ink mb-3">Aylık Gelir / Gider</p>
      <div style="height:220px;"><canvas id="barChartCanvas"></canvas></div>
    </div>
    <div class="card rounded-2xl p-4 mt-4 mb-4">
      <p class="text-sm font-bold text-ink mb-3">Kategori Dağılımı (${monthLabel(state.currentMonth)})</p>
      <div style="height:220px;"><canvas id="donutChartCanvas"></canvas></div>
      <div id="categoryLegend" class="mt-4 space-y-1.5"></div>
    </div>
  `;
}

export function mountCharts(state) {
  const keys = Object.keys(state.months).sort();
  const labels = keys.map(k => monthShort(k));
  const incomeData = keys.map(k => monthTotals(state.months[k], state.users).totalIncome);
  const expenseData = keys.map(k => monthTotals(state.months[k], state.users).totalOut);

  const barCtx = document.getElementById('barChartCanvas');
  if (barCtx) {
    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Gelir', data: incomeData, backgroundColor: '#16B893', borderRadius: 6, maxBarThickness: 22 },
          { label: 'Gider', data: expenseData, backgroundColor: '#F0665A', borderRadius: 6, maxBarThickness: 22 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 10 } } },
          x: { ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  const m = state.months[state.currentMonth];
  const catValues = state.categories.map(c => categorySpendForMonth(m, c.id));
  const catLabels = state.categories.map(c => c.name);
  const catColors = state.categories.map(c => c.color || '#8891A0');

  const donutCtx = document.getElementById('donutChartCanvas');
  if (donutCtx) {
    if (donutChartInstance) donutChartInstance.destroy();
    donutChartInstance = new Chart(donutCtx, {
      type: 'doughnut',
      data: { labels: catLabels, datasets: [{ data: catValues, backgroundColor: catColors, borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '65%' }
    });
  }

  const legend = document.getElementById('categoryLegend');
  if (legend) {
    legend.innerHTML = state.categories.map((c, i) => {
      const over = c.limit && catValues[i] > c.limit;
      return `
      <div class="flex items-center justify-between text-xs">
        <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${c.color || '#8891A0'}"></span>${c.name}</span>
        <span class="font-semibold ${over ? 'text-coral' : 'text-ink'}">${formatCurrency(catValues[i], state.settings.currency)}${c.limit ? ` / ${formatCurrency(c.limit, state.settings.currency)}` : ''}</span>
      </div>`;
    }).join('') || `<p class="text-xs text-ink-faint italic">Henüz kategori eklenmedi.</p>`;
  }
}
