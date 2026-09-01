import './styles.css';
import { mountApp } from './components/App.js';

mountApp(document.getElementById('app'));

// PWA: Service Worker kaydı — ana ekrana eklenebilirlik ve temel offline
// destek sağlar. Sadece üretim/HTTPS ortamında ve tarayıcı destekliyorsa çalışır.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      // Service worker kaydı başarısız olsa bile uygulama normal şekilde çalışmaya devam eder.
    });
  });
}
