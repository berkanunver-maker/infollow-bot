# Instagram Follow Tracker Bot 🤖

Otomatik Instagram takip listesi değişikliklerini takip eden ve Twitter'da paylaşan tam otomatik bot sistemi.

## 🎯 Kod Bilmiyorum, Sadece AI Kullanıyorum?

**Harika haber!** Bu proje AI ile kolayca yönetilebilir.

📚 **Hemen başlayın:**
- [AI_GUIDE.md](./AI_GUIDE.md) - AI'a nasıl talimat vereceğinizi öğrenin
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Hazır kopyala-yapıştır promptlar

**Örnek:** *"Tweet'leri Türkçe yapmak istiyorum"* → QUICK_REFERENCE.md'de hazır prompt var!

## ⚠️ ÖNEMLI UYARILAR

**Bu bot Instagram'ın Kullanım Koşullarını ihlal edebilir!**

- ❌ Instagram otomatik scraping'i yasaklar
- ⚠️ Hesabınız geçici veya kalıcı olarak yasaklanabilir
- 🔒 Ana hesabınızda **ASLA** kullanmayın
- 📖 Kullanmadan önce [SECURITY.md](./SECURITY.md) dosyasını okuyun
- 🎓 Yalnızca eğitim amaçlı kullanın

**Kullanım sorumluluğu tamamen size aittir.**

## 🎯 Özellikler

### Ana Özellikler
- ✅ **Playwright ile Instagram Scraping**: Instagram'a giriş yapıp takip listesini otomatik olarak scrape eder
- 📸 **Otomatik Screenshot**: Profil sayfalarından viewport screenshot'ları alır
- 📊 **JSON Snapshot Sistemi**: Her taramayı JSON formatında kaydeder
- 🔍 **Diff Detection**: Önceki taramalarla karşılaştırıp follow/unfollow değişikliklerini tespit eder
- 🐦 **Twitter API v2 Entegrasyonu**: Değişiklikleri otomatik olarak Twitter'da medya ekli tweet olarak paylaşır
- ⏰ **Cron-based Worker**: Periyodik olarak otomatik çalışır
- 📝 **Detaylı Logging**: Tüm işlemleri loglar ve hata yönetimi yapar

### 🔐 Güvenlik Özellikleri
- 🥷 **Stealth Mode**: Bot tespitini zorlaştıran teknikler
  - navigator.webdriver gizleme
  - Gerçekçi browser fingerprint
  - Random user-agent rotation
- 🍪 **Session Persistence**: Tekrarlı login'leri önler, cookie'leri saklar
- ⏱️ **Rate Limiting**: İnsan benzeri davranış için random delays
- 🔄 **Retry Logic**: Exponential backoff ile otomatik yeniden deneme
- 🛡️ **2FA Detection**: İki faktörlü kimlik doğrulama tespiti
- 🌐 **Proxy Support**: IP rotation için proxy desteği

## 📦 Kurulum

### Gereksinimler

- Node.js 18 veya üzeri
- npm veya yarn
- Git (pre-commit hooks için)

### Bağımlılıkları Yükleme

```bash
npm install
```

Playwright browser'larını yükleyin:

```bash
npx playwright install chromium
```

Pre-commit hooks'u kurun:

```bash
npm run prepare
```

## ⚙️ Konfigürasyon

`.env.example` dosyasını `.env` olarak kopyalayın:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyip gerekli bilgileri girin:

**⚠️ ÖNEMLİ:** Ana Instagram hesabınızı kullanmayın! Test/burner hesap oluşturun.

```env
# Instagram Bilgileri
INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password

# Twitter/X API Bilgileri (v2)
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret

# Takip Edilecek Hesap
TARGET_INSTAGRAM_USERNAME=account_to_track

# Cron Zamanlaması (varsayılan: her 6 saatte bir)
CRON_SCHEDULE=0 */6 * * *

# Browser Ayarları
HEADLESS=true
BROWSER_TIMEOUT=60000
```

### Twitter API Anahtarları Alma

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)'a gidin
2. Bir proje ve app oluşturun
3. "Keys and Tokens" bölümünden:
   - API Key & Secret
   - Access Token & Secret
   alın ve `.env` dosyasına ekleyin

## ✅ Konfigürasyonu Doğrulama

Çalıştırmadan önce konfigürasyonunuzu doğrulayın:

```bash
npm run validate
```

Bu komut:
- API anahtarlarını kontrol eder
- Placeholder değerleri tespit eder
- Güvenlik ayarlarını doğrular
- Cron schedule'u kontrol eder

## 🚀 Kullanım

### TypeScript Derleyin

```bash
npm run build
```

### Tek Seferlik Çalıştırma

Bot'u bir kez çalıştırmak için:

```bash
npm start
# veya development modunda:
npm run dev
```

### Cron Worker Modunda Çalıştırma

Bot'u periyodik olarak otomatik çalıştırmak için:

```bash
npm run worker
```

Worker modu:
- Başlangıçta hemen bir kez çalışır
- Ardından belirlediğiniz cron schedule'a göre periyodik olarak çalışır
- Sürekli çalışır durumda kalır (arka planda)

### Production'da Çalıştırma

Production ortamında sürekli çalışması için process manager kullanabilirsiniz:

#### PM2 ile

```bash
# PM2 yükleyin
npm install -g pm2

# Worker'ı başlatın
pm2 start dist/worker.js --name infollow-bot

# Logları görüntüleyin
pm2 logs infollow-bot

# Durumu kontrol edin
pm2 status

# Yeniden başlatın
pm2 restart infollow-bot

# Durdurun
pm2 stop infollow-bot
```

#### Docker ile

```bash
# Docker image oluşturun
docker build -t infollow-bot .

# Container'ı çalıştırın
docker run -d --name infollow-bot --env-file .env infollow-bot
```

## 📁 Proje Yapısı

```
infollow-bot/
├── src/
│   ├── bot.ts                 # Ana bot orchestrator
│   ├── worker.ts              # Cron worker
│   ├── index.ts               # Entry point (tek seferlik)
│   ├── config.ts              # Konfigürasyon yönetimi
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── scrapers/
│   │   └── instagram.ts       # Instagram scraper (Playwright)
│   ├── twitter/
│   │   └── client.ts          # Twitter API v2 client
│   └── utils/
│       ├── logger.ts          # Winston logger
│       ├── storage.ts         # JSON snapshot storage
│       └── diff.ts            # Diff detection
├── data/
│   ├── snapshots/             # JSON snapshots
│   └── screenshots/           # Profile screenshots
├── logs/                      # Log dosyaları
├── .env                       # Environment variables
├── .env.example               # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Cron Schedule Ayarlama

`.env` dosyasındaki `CRON_SCHEDULE` değişkeni ile çalışma sıklığını ayarlayabilirsiniz.

Format: `minute hour day month weekday`

Örnekler:
- `0 */6 * * *` - Her 6 saatte bir
- `0 0 * * *` - Her gün gece yarısı
- `0 */2 * * *` - Her 2 saatte bir
- `0 9 * * *` - Her gün saat 09:00'da
- `0 9,21 * * *` - Her gün 09:00 ve 21:00'de

## 📊 Nasıl Çalışır?

1. **Instagram Login**: Bot Playwright ile Instagram'a giriş yapar
2. **Following List Scraping**: Hedef hesabın takip listesine gider ve tüm kullanıcıları scrape eder
3. **Snapshot Kaydetme**: Scrape edilen veriyi timestamp'li JSON dosyası olarak kaydeder
4. **Diff Hesaplama**: Önceki snapshot ile karşılaştırıp yeni takip edilenler ve takipten çıkılanları tespit eder
5. **Screenshot Alma**: Değişiklik olan profillerden screenshot alır
6. **Twitter'da Paylaşma**: Değişiklikleri özetleyen ve screenshot ekli tweet oluşturur
7. **Cleanup**: Eski snapshot'ları temizler (son 10'u tutar)

## 🛡️ Güvenlik

- `.env` dosyanızı asla paylaşmayın veya commit etmeyin
- Instagram şifrenizi güvenli tutun
- Twitter API anahtarlarınızı koruyun
- Production'da mutlaka environment variables kullanın

## ⚠️ Önemli Notlar

- Instagram'ın rate limiting'e dikkat edin
- Çok sık scraping yapmak hesabınızın kısıtlanmasına neden olabilir
- Önerilen minimum interval: 6 saat
- Bot başarısız giriş denemelerinde otomatik olarak hata loglar

## 🐛 Hata Ayıklama

### Logları Kontrol Etme

```bash
# Tüm loglar
tail -f logs/combined.log

# Sadece hatalar
tail -f logs/error.log
```

### Headless Modu Kapatma

Test ederken browser'ı görmek için:

```env
HEADLESS=false
```

### Timeout Artırma

Yavaş bağlantılarda:

```env
BROWSER_TIMEOUT=120000
```

## 📝 Lisans

MIT

## 🤝 Katkıda Bulunma

Pull request'ler kabul edilir. Büyük değişiklikler için önce bir issue açın.

---

Made with ❤️ for Instagram follow tracking
