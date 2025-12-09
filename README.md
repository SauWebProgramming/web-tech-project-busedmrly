# 🎬 CineVault - İnteraktif Medya Kitaplığı

> **🌐 Canlı Demo:** [https://sauwebprogramming.github.io/web-tech-project-busedmrly/](https://sauwebprogramming.github.io/web-tech-project-busedmrly/)

Modern web teknolojileri kullanılarak geliştirilen, film ve dizi koleksiyonlarını yönetmek için tasarlanmış bir Single Page Application (SPA).

## 📋 Proje Hakkında

Bu proje, **Web Teknolojileri** dersi kapsamında hazırlanmış olup, modern istemci tarafı web teknolojilerinin kullanımını göstermektedir.

### 🎯 Temel Özellikler

- **Liste/Grid Görünümü**: Medyaları kartlar halinde veya liste formatında görüntüleme
- **Arama ve Filtreleme**: İsme göre arama, tür/yıl/tip bazlı filtreleme
- **Detay Sayfası**: SPA mantığıyla modal üzerinde detaylı bilgi gösterimi
- **Favoriler Sistemi**: localStorage ile favori medya yönetimi
- **Responsive Tasarım**: Mobil, tablet ve masaüstü uyumlu

## 🛠️ Kullanılan Teknolojiler

| Teknoloji | Kullanım Alanı |
|-----------|----------------|
| **HTML5** | Semantic yapı (nav, main, article, section) |
| **CSS3** | Flexbox, Grid, Animasyonlar, Media Queries |
| **JavaScript ES6+** | const/let, Arrow Functions, async/await, Modules |
| **Fetch API** | Yerel JSON dosyasından veri çekme |
| **localStorage** | Favori ve tercih yönetimi |

## 📁 Proje Yapısı

```
web_teknolojileri_ödev/
├── index.html          # Ana HTML dosyası
├── css/
│   └── style.css       # Tüm stil tanımlamaları
├── js/
│   └── app.js          # JavaScript uygulama mantığı
├── data/
│   └── media.json      # Film ve dizi verileri
└── README.md           # Proje dokümantasyonu
```

## 🚀 Kurulum ve Çalıştırma

### Yerel Sunucu ile Çalıştırma (Önerilen)

Fetch API kullanıldığı için projeyi bir yerel sunucu üzerinden çalıştırmanız gerekmektedir:

#### VS Code Live Server ile:
1. VS Code'da "Live Server" eklentisini yükleyin
2. `index.html` dosyasına sağ tıklayın
3. "Open with Live Server" seçeneğini tıklayın

#### Python ile:
```bash
# Python 3
python -m http.server 8000

# Tarayıcıda açın: http://localhost:8000
```

#### Node.js ile:
```bash
npx serve
```

## ✅ Ödev Gereksinimleri Kontrolü

### HTML5 & CSS3
- [x] Semantic HTML kullanımı (nav, main, article, section)
- [x] Responsive Tasarım (Media Queries + Flexbox/Grid)
- [x] CSS Animasyonları ve Transitions

### Modern JavaScript (ES6+)
- [x] `const` ve `let` kullanımı (`var` yok)
- [x] Arrow Functions (`=>`)
- [x] `async/await` ve `Promise`
- [x] Template Literals

### Asenkron JavaScript
- [x] `fetch()` API kullanımı
- [x] JSON verisi işleme ve DOM'a yazdırma

### Veri Yönetimi
- [x] localStorage kullanımı (favoriler)
- [x] Yerel JSON dosyasından veri çekme

### SPA Özellikleri
- [x] Tek sayfa uygulama mantığı
- [x] Dinamik içerik değişimi
- [x] Modal ile detay gösterimi

## 🎨 Tasarım Özellikleri

- **Koyu Tema**: Sinematik koyu renk paleti
- **Gradient Aksentler**: Kırmızı-turuncu gradient vurgular
- **Smooth Animasyonlar**: Kart hover efektleri, modal animasyonları
- **Modern Tipografi**: Outfit ve Playfair Display fontları
- **Responsive Grid**: CSS Grid ile dinamik yerleşim

## 📱 Responsive Breakpoints

| Cihaz | Genişlik |
|-------|----------|
| Masaüstü | > 1024px |
| Tablet | 768px - 1024px |
| Mobil (Büyük) | 480px - 768px |
| Mobil (Küçük) | < 480px |

## ♿ Erişilebilirlik (A11y)

- ARIA etiketleri kullanımı
- Klavye navigasyonu desteği
- Focus durumları
- Screen reader uyumluluğu
- `prefers-reduced-motion` desteği

