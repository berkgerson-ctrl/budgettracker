# Bütçe — Google Sheets Destekli Aylık Bütçe Uygulaması

Modern, modüler (ES6) ve GitHub Pages'te barındırılabilen; verilerini yerel
depolama yerine kendi **Google E-Tablonuzda** tutan çok kullanıcılı bütçe ve
birikim takip uygulaması.

## Özellikler

- **Google Sheets veri katmanı** — tüm okuma/yazma işlemleri bir Google Apps
  Script Web App üzerinden e-tablonuza yapılır. Tarayıcıda yalnızca bağlantı
  adresi (URL) saklanır.
- **Dinamik kullanıcı yönetimi** — Ayarlar → Kullanıcılar sekmesinden istediğiniz
  kadar kullanıcı ekleyebilir, pasifleştirebilir veya silebilirsiniz. Gelir,
  harçlık ve kişisel birikim alanları bu listeye göre otomatik şekillenir.
- **4 katmanlı birikim görünümü** — Kullanıcı başına kişisel birikim, Ortak
  Birikim hesabı, Ana Varlık zinciri ve Hedef Odaklı Tasarruf Planlayıcısı;
  hepsi Varlık sekmesinde ayrı katmanlar olarak izlenir.
- **Hedef odaklı tasarruf planlayıcısı** — Hedef adı, tutar ve aylık bütçe ya
  da vade tarihi girin; uygulama kaç ayda tamamlanacağını (veya vadeye
  yetişmek için aylık ne kadar gerektiğini) otomatik hesaplar ve ilerleme
  çubuğuyla gösterir.
- **Çoklu para birimi** — EUR / USD / TRY arasında anında geçiş.
- **Düzenli işlem şablonları** — Kira, fatura gibi sabit giderleri şablon
  olarak kaydedin; yeni ay eklediğinizde otomatik kopyalanır.
- **Kategori bazlı bütçeleme** — Sabit gider ve ekstralara kategori atayın,
  limit belirleyin; Chart.js ile aylık gelir/gider çubuk grafiği ve kategori
  dağılım donut grafiği görün.
- **Telefona yüklenebilir (PWA)** — GitHub Pages'e yayınladığınızda tarayıcı
  "Ana ekrana ekle / Yükle" seçeneği sunar; uygulama diğer mağaza uygulamaları
  gibi simgesiyle ana ekranda/app çekmecesinde görünür ve tam ekran açılır.
- **Bootstrap Icons** — Tüm arayüz ikonları [icons.getbootstrap.com](https://icons.getbootstrap.com)
  kaynaklı, MIT lisanslı SVG ikonlardır (`bootstrap-icons` paketi üzerinden).

## Proje Yapısı

```
index.html
vite.config.js
public/
  manifest.webmanifest    → PWA manifesti (ana ekrana ekleme)
  sw.js                    → Service Worker (offline destek)
  icons/                   → uygulama ikonları (192/512, maskable, apple-touch)
src/
  main.js                 → giriş noktası + service worker kaydı
  state.js                → merkezi store, tüm hesaplamalar
  styles.css               → Tailwind + özel stiller
  services/
    sheetsApi.js           → Google Apps Script ile HTTP iletişimi
  utils/
    dates.js, format.js    → tarih ve para birimi yardımcıları
  components/
    App.js                 → orkestrasyon + event delegation
    Header.js, MonthPills.js
    HomeScreen.js, ExpensesScreen.js, WealthScreen.js
    GoalsScreen.js, ChartScreen.js
    SettingsModal.js, QuickAddModal.js
    icons.js                → Bootstrap Icons tabanlı ikon seti
google-apps-script/
  Code.gs                  → Apps Script backend kodu (Google'a elle yapıştırılır)
.github/workflows/
  deploy.yml                → GitHub Pages otomatik yayın
```

## 1. Google Sheets Backend Kurulumu

1. [sheets.google.com](https://sheets.google.com) üzerinden yeni bir e-tablo açın (örn. "Bütçe Verisi").
2. **Uzantılar → Apps Script**'i açın.
3. Varsayılan `Code.gs` içeriğini silip bu repodaki `google-apps-script/Code.gs`
   dosyasının tam içeriğini yapıştırın.
4. Sağ üstten **Dağıt → Yeni Dağıtım**'a tıklayın.
   - Tür: **Web Uygulaması**
   - Yürütme kimliği: **Ben (hesabınız)**
   - Erişimi olanlar: **Herkes**
5. Dağıt'a basın, Google izin isteyecektir — hesabınızla onaylayın.
6. Oluşan **Web App URL**'sini kopyalayın (`https://script.google.com/macros/s/AKfycb.../exec` formatında).
7. Uygulamayı açın → sol üstteki ayarlar simgesi → **Bağlantı** sekmesi →
   URL'yi yapıştırıp **Bağlantıyı Test Et**, ardından **Kaydet & Senkronize Et**.

E-tablonuzdaki sekmeler (Settings, Users, Months, Goals, GoalContributions,
RecurringTemplates, Categories) ilk senkronizasyonda otomatik oluşturulur;
elle hazırlamanıza gerek yoktur.

> Not: Apps Script Web App'lere CORS ön kontrolünü tetiklememek için istekler
> `Content-Type: text/plain` ile gönderilir; gövde yine JSON'dur ve `Code.gs`
> içinde `JSON.parse` ile ayrıştırılır. Bu, statik siteler (GitHub Pages) ile
> Apps Script entegrasyonunda bilinen, güvenilir bir örüntüdür.

## 2. Yerel Geliştirme

```bash
npm install
npm run dev
```

`http://localhost:5173` adresinde açılır. Bağlantı kurulana kadar uygulama
**demo modunda** çalışır (veriler yalnızca tarayıcı belleğinde tutulur, sayfa
yenilenince sıfırlanır) — Ayarlar → Genel → "Örnek Verilerle Doldur" ile hızlı
önizleme yapabilirsiniz.

## 3. GitHub Pages'e Yayınlama

### Otomatik (önerilen)
1. Bu projeyi kendi GitHub reponuza gönderin (`git push`).
2. Repo **Settings → Pages → Build and deployment → Source** kısmından
   **GitHub Actions**'ı seçin.
3. `main` dalına her push'ta `.github/workflows/deploy.yml` otomatik olarak
   `npm run build` çalıştırıp `dist/` klasörünü yayınlar.
4. Birkaç dakika içinde `https://kullanici-adiniz.github.io/repo-adi/` adresinde
   canlıya alınır.

### Manuel
```bash
npm run build
# dist/ klasörünün içeriğini gh-pages dalına veya Pages kaynağınıza kopyalayın
```

`vite.config.js` içinde `base: './'` kullanıldığı için repo adı fark etmeksizin
her alt-yolda doğru çalışır.

## 4. Telefona Uygulama Olarak Yükleme (PWA)

Site GitHub Pages'te (HTTPS) yayınlandıktan sonra:

- **Android / Chrome**: Siteyi açın → sağ üstteki ⋮ menüsü → **"Uygulamayı yükle"**
  ya da adres çubuğunda otomatik çıkan yükleme simgesine dokunun. Uygulama
  simgesi (yeşil kumbara ikonu) ana ekrana ve uygulama çekmecesine eklenir,
  tam ekran (adres çubuğusuz) açılır.
- **iPhone / Safari**: Paylaş butonu → **"Ana Ekrana Ekle"**.
- Uygulama bir [Web App Manifest](public/manifest.webmanifest) ve basit bir
  [Service Worker](public/sw.js) (`stale-while-revalidate` stratejili, sadece
  aynı kaynaktan gelen GET isteklerini önbekler — Google Sheets'e giden
  isteklere hiç dokunmaz) içerir; bu ikisi olmadan tarayıcılar "yükle" seçeneğini
  göstermez. İkon dosyaları `public/icons/` altındadır, isterseniz kendi
  logonuzla değiştirebilirsiniz (aynı dosya adlarını ve boyutlarını koruyun:
  192×192, 512×512, birer de "maskable" versiyon, 180×180 apple-touch-icon).

## 5. Veri Modeli Notları

- **Ana Varlık zinciri**: Her ay `Gelir − Sabit Gider − Ekstra − (Ortak Hesap + Harçlık)`
  formülüyle hesaplanır; bir önceki ayın bitiş bakiyesi üzerine eklenir.
  Ortak Birikim ve Kişisel Birikim tutarları bu zincire dokunmaz (nötrdür) —
  onlar ayrı katmanlarda birikir.
- **Ortak Hesap**: Giderler ekranında "− Toplam Varlıktan" etiketiyle işaretli;
  Ana Varlık zincirinden düşülür (gerçek harcama gibi davranır).
- **Ortak Birikim / Kişisel Birikim**: "+ Toplam Varlığa" etiketiyle işaretli;
  aylık "Kalan" hesabında gider gibi görünür ama kendi katmanına eklenir, Ana
  Varlığı azaltmaz.
- **Hedefler**: `currentAmount`, katkı kayıtlarının (GoalContributions) toplamı
  olarak hesaplanır; her "Ekle" işlemi ayrı bir satır olarak e-tabloya yazılır.

## Bilinen Sınırlamalar / Sonraki Adımlar

- Bu ortamda gerçek bir Google Apps Script dağıtımına karşı uçtan uca test
  yapılamadı (Google hesabı gerektirir); istemci kodu API sözleşmesine göre
  yazıldı ve demo modunda Playwright ile kapsamlı şekilde test edildi.
  İlk bağlantıda "Bağlantıyı Test Et" ile doğrulamanızı öneririz.
- Çoklu cihazdan **eşzamanlı** düzenleme için satır kilitleme yoktur (Apps
  Script tek seferde bir isteği işler, ancak yarış durumları teorik olarak
  mümkündür). Aile/çift kullanımı için yeterlidir.
- Kategori limitleri şu an yalnızca görsel uyarı amaçlıdır (aşım engellenmez).
