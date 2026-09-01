/**
 * Bootstrap Icons (MIT lisanslı, https://icons.getbootstrap.com) üzerinden
 * içe aktarılan SVG ikonlar. Vite'ın `?raw` özelliğiyle dosya içeriği build
 * zamanında ham metin olarak alınır; genişlik/yükseklik öznitelikleri
 * kaldırılarak uygulamanın kendi boyutlandırma (w-5 h-5 vb. sarmalayıcı)
 * sistemiyle uyumlu hale getirilir.
 */
import houseDoorFill from 'bootstrap-icons/icons/house-door-fill.svg?raw';
import receipt from 'bootstrap-icons/icons/receipt.svg?raw';
import plusLg from 'bootstrap-icons/icons/plus-lg.svg?raw';
import wallet2 from 'bootstrap-icons/icons/wallet2.svg?raw';
import barChartFill from 'bootstrap-icons/icons/bar-chart-fill.svg?raw';
import bullseye from 'bootstrap-icons/icons/bullseye.svg?raw';
import gearFill from 'bootstrap-icons/icons/gear-fill.svg?raw';
import cashCoin from 'bootstrap-icons/icons/cash-coin.svg?raw';
import receiptCutoff from 'bootstrap-icons/icons/receipt-cutoff.svg?raw';
import tagFill from 'bootstrap-icons/icons/tag-fill.svg?raw';
import creditCardFill from 'bootstrap-icons/icons/credit-card-fill.svg?raw';
import peopleFill from 'bootstrap-icons/icons/people-fill.svg?raw';
import piggyBankFill from 'bootstrap-icons/icons/piggy-bank-fill.svg?raw';
import trash3Fill from 'bootstrap-icons/icons/trash3-fill.svg?raw';
import arrowUpRight from 'bootstrap-icons/icons/arrow-up-right.svg?raw';
import arrowDownRight from 'bootstrap-icons/icons/arrow-down-right.svg?raw';
import chevronDown from 'bootstrap-icons/icons/chevron-down.svg?raw';
import pencilFill from 'bootstrap-icons/icons/pencil-fill.svg?raw';
import xLg from 'bootstrap-icons/icons/x-lg.svg?raw';
import link45deg from 'bootstrap-icons/icons/link-45deg.svg?raw';
import checkLg from 'bootstrap-icons/icons/check-lg.svg?raw';
import personCircle from 'bootstrap-icons/icons/person-circle.svg?raw';
import arrowRepeat from 'bootstrap-icons/icons/arrow-repeat.svg?raw';
import globeAmericas from 'bootstrap-icons/icons/globe-americas.svg?raw';
import gripVertical from 'bootstrap-icons/icons/grip-vertical.svg?raw';
import starFill from 'bootstrap-icons/icons/star-fill.svg?raw';
import sliders from 'bootstrap-icons/icons/sliders.svg?raw';

// Sabit width/height özniteliklerini kaldırır ki ikon, sarmalayıcı elemanın
// (örn. w-5 h-5) boyutuna göre otomatik ölçeklensin.
function clean(svg) {
  return svg.replace(/\s(width|height)="[^"]*"/g, '');
}

export const ICON = {
  home: clean(houseDoorFill),
  list: clean(receipt),
  plus: clean(plusLg),
  wallet: clean(wallet2),
  chart: clean(barChartFill),
  target: clean(bullseye),
  gear: clean(gearFill),
  settings: clean(sliders),
  income: clean(cashCoin),
  fixed: clean(receiptCutoff),
  extra: clean(tagFill),
  pool: clean(creditCardFill),
  allowance: clean(peopleFill),
  savings: clean(piggyBankFill),
  trash: clean(trash3Fill),
  arrowUp: clean(arrowUpRight),
  arrowDown: clean(arrowDownRight),
  chevronDown: clean(chevronDown),
  pencil: clean(pencilFill),
  close: clean(xLg),
  link: clean(link45deg),
  check: clean(checkLg),
  user: clean(personCircle),
  repeat: clean(arrowRepeat),
  tag: clean(tagFill),
  globe: clean(globeAmericas),
  drag: clean(gripVertical),
  star: clean(starFill)
};
