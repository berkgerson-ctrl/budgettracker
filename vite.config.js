import { defineConfig } from 'vite';

// GitHub Pages'te proje alt-yolunda (kullanici.github.io/repo-adi/) doğru
// çalışması için göreli yol (base: './') kullanılıyor. Repo adını ayrıca
// belirtmeye gerek kalmaz.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist'
  }
});
