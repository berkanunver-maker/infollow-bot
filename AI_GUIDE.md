# AI ile Kod Düzenleme Rehberi 🤖

**Kod bilginiz olmasa bile** bu projeyi AI ile kolayca düzenleyebilirsiniz. Bu rehber size nasıl yapacağınızı gösterir.

## 🎯 Önemli: AI'a Nasıl Talimat Verilir

### ✅ İyi Talimat Örnekleri

```
❌ KÖTÜ: "Kodu düzenle"
✅ İYI:  "src/config.ts dosyasındaki CRON_SCHEDULE varsayılan değerini
         '0 */6 * * *' yerine '0 0 * * *' yap (günde bir çalışsın)"

❌ KÖTÜ: "Twitter ayarını değiştir"
✅ İYI:  "src/twitter/client.ts dosyasında generateTweetText fonksiyonunda
         tweet metninin başındaki '📊' emojisini '🔔' ile değiştir"

❌ KÖTÜ: "Delay'leri uzat"
✅ İYI:  ".env.example dosyasında MIN_DELAY=1000 ve MAX_DELAY=3000
         değerlerini MIN_DELAY=3000 ve MAX_DELAY=6000 yap"
```

## 📋 Sık Yapılan Değişiklikler

### 1. Cron Schedule Değiştirme (Ne Sıklıkla Çalışacak)

**AI'a söyle:**
```
"src/config.ts dosyasında cron.schedule için varsayılan değeri değiştir:
- Günde bir: '0 0 * * *'
- Her 12 saatte: '0 */12 * * *'
- Her 3 saatte: '0 */3 * * *'"
```

**Dosya:** `src/config.ts`
**Satır:** ~28

---

### 2. Delay Sürelerini Değiştirme (Hız Ayarı)

**AI'a söyle:**
```
".env.example dosyasında:
- MIN_DELAY değerini [SÜRE] yap
- MAX_DELAY değerini [SÜRE] yap

Örnek: Daha yavaş için MIN_DELAY=5000, MAX_DELAY=10000"
```

**Dosya:** `.env.example`
**Satırlar:** 52-55

---

### 3. Tweet Metnini Özelleştirme

**AI'a söyle:**
```
"src/twitter/client.ts dosyasındaki generateTweetText fonksiyonunda:
- '📊 Instagram Following Update' metnini '[YENİ METİN]' yap
- Veya emojileri değiştir: 📈 → [emoji], 📉 → [emoji]"
```

**Dosya:** `src/twitter/client.ts`
**Fonksiyon:** `generateTweetText` (satır ~32)

---

### 4. Screenshot Boyutunu Değiştirme

**AI'a söyle:**
```
"src/scrapers/instagram-secure.ts dosyasındaki takeProfileScreenshot
fonksiyonunda screenshot ayarlarını değiştir:
- fullPage: false → true (tam sayfa screenshot için)
- veya viewport ekle: { width: 1920, height: 1080 }"
```

**Dosya:** `src/scrapers/instagram-secure.ts`
**Fonksiyon:** `takeProfileScreenshot`

---

### 5. Loglama Seviyesini Değiştirme

**AI'a söyle:**
```
".env.example dosyasında LOG_LEVEL değerini değiştir:
- 'debug' - Her şeyi logla (çok detaylı)
- 'info'  - Normal (varsayılan)
- 'warn'  - Sadece uyarılar
- 'error' - Sadece hatalar"
```

**Dosya:** `.env.example`
**Satır:** 29

---

### 6. Snapshot Saklama Sayısını Değiştirme

**AI'a söyle:**
```
"src/bot.ts dosyasının sonunda deleteOldSnapshots çağrısındaki
sayıyı değiştir. Şu an 10, bunu [SAYI] yap."
```

**Dosya:** `src/bot.ts`
**Satır:** ~106

---

## 🗂️ Dosya Yapısı (AI'a Göstermek İçin)

### Konfigürasyon Dosyaları
```
.env.example          → Ayarların template'i (delay, cron, vs.)
src/config.ts         → Konfigürasyon yönetimi
```

### Ana Bot Dosyaları
```
src/index.ts          → Tek seferlik çalışma entry point
src/worker.ts         → Cron worker entry point
src/bot.ts            → Ana bot orchestrator
```

### Scraping
```
src/scrapers/instagram.ts         → Basit scraper (eski)
src/scrapers/instagram-secure.ts  → Güvenli scraper (KULLANILAN)
```

### Twitter
```
src/twitter/client.ts → Tweet gönderme, metin oluşturma
```

### Utilities
```
src/utils/logger.ts       → Loglama sistemi
src/utils/storage.ts      → Snapshot kaydetme
src/utils/diff.ts         → Değişiklikleri hesaplama
src/utils/session.ts      → Session yönetimi
src/utils/retry.ts        → Hata durumunda tekrar deneme
src/utils/validator.ts    → Konfigürasyon doğrulama
src/utils/sanitizer.ts    → Güvenlik (input temizleme)
```

## 🚨 Dikkat Edilmesi Gerekenler

### ❌ Bunları Söylemeyin
```
"Hepsini değiştir"
"Optimize et"
"Daha iyi yap"
"Fix et"
```

### ✅ Bunları Söyleyin
```
"[DOSYA] dosyasındaki [FONKSİYON] fonksiyonunda [SATIR] satırını [ŞEKİLDE] değiştir"
"[DOSYA] dosyasına [ŞEYİ] ekle"
"[DEĞİŞKEN] değerini [ESKI] yerine [YENİ] yap"
```

## 📝 Yaygın Senaryolar için Hazır Promptlar

### Senaryo 1: Bot'u daha yavaş çalıştırma
```prompt
"Lütfen şu değişiklikleri yap:

1. .env.example dosyasında:
   - CRON_SCHEDULE=0 */6 * * * yerine 0 0 * * * (günde bir)
   - MIN_DELAY=1000 yerine 5000
   - MAX_DELAY=3000 yerine 10000

2. src/scrapers/instagram-secure.ts dosyasındaki
   scrollAndExtractUsers fonksiyonunda:
   - randomDelay(1500, 3000) çağrısını randomDelay(3000, 6000) yap"
```

---

### Senaryo 2: Tweet formatını değiştirme
```prompt
"src/twitter/client.ts dosyasındaki generateTweetText fonksiyonunda:

1. Başlıktaki emojileri değiştir:
   - 📊 yerine 🔔
   - 📈 yerine ⬆️
   - 📉 yerine ⬇️
   - ✅ yerine ➕
   - ❌ yerine ➖

2. '📊 Instagram Following Update for' metnini
   '🔔 Takip Güncellemesi:' yap

3. 'New Follows' yerine 'Yeni Takipler' yaz
4. 'Unfollowed' yerine 'Takipten Çıkanlar' yaz"
```

---

### Senaryo 3: Sadece büyük değişiklikleri Twitter'da paylaşma
```prompt
"src/bot.ts dosyasında, Twitter'a post etme koşulunu değiştir:

Şu anki kod:
if (this.diffDetector.hasChanges(diff)) {

Yeni kod:
if (diff.newFollows.length >= 5 || diff.unfollows.length >= 5) {

Bu sadece 5+ kişi takip edildiğinde veya takipten çıkıldığında tweet atar."
```

---

### Senaryo 4: Screenshot'ları devre dışı bırakma
```prompt
"src/bot.ts dosyasında screenshot alma kısmını yorum satırı yap:

Şu kodu bul:
let screenshotPath: string | null = null;
if (diff.newFollows.length > 0) {
  screenshotPath = await this.scraper.takeProfileScreenshot(
    diff.newFollows[0].username
  );
} else if (diff.unfollows.length > 0) {
  screenshotPath = await this.scraper.takeProfileScreenshot(
    diff.unfollows[0].username
  );
}

Bu bloğu /* */ ile yorum satırı haline getir.
Ve screenshotPath değişkenini sadece null olarak tanımla."
```

---

### Senaryo 5: Daha fazla kullanıcı bilgisi ekleme
```prompt
"src/twitter/client.ts dosyasındaki generateTweetText fonksiyonunda:

Her kullanıcı için username'in yanına full name de ekle.
Şu formatı kullan: @username (Full Name)

Örnek:
  • @elonmusk (Elon Musk)
  • @billgates (Bill Gates) ✓

Kod değişikliği:
lines.push(\`  • @\${user.username}${user.isVerified ? ' ✓' : ''}\`);
yerine:
lines.push(\`  • @\${user.username} (\${user.fullName})${user.isVerified ? ' ✓' : ''}\`);
"
```

---

## 🔍 Nasıl Sorun Gideririm?

### Problem: Bot çalışmıyor

**AI'a söyle:**
```
"logs/error.log dosyasını oku ve son 50 satırı göster.
Ardından hatayı analiz et ve çözüm öner."
```

---

### Problem: Tweet atılmıyor

**AI'a söyle:**
```
"src/bot.ts dosyasındaki Twitter post kısmını bul ve
logger çağrılarını ekle. Her adımda ne olduğunu görmek istiyorum."
```

---

### Problem: Çok fazla snapshot birikiyor

**AI'a söyle:**
```
"src/bot.ts dosyasında deleteOldSnapshots çağrısındaki
snapshot saklama sayısını 10'dan 5'e düşür."
```

---

## 🎓 AI'a Dosya Gösterme İpuçları

### Dosya yolu verirken:
```
✅ "src/bot.ts dosyasını"
✅ "src/twitter/client.ts dosyasındaki"
✅ ".env.example dosyasında"

❌ "bot dosyasını" (hangi dosya?)
❌ "config'i" (hangi config dosyası?)
```

### Satır belirtirken:
```
✅ "generateTweetText fonksiyonundaki"
✅ "satır 50 civarındaki"
✅ "if (diff.newFollows.length > 0) yazan kısmı"

❌ "oradaki" (nerede?)
❌ "şurayı" (hangi yer?)
```

## 🔧 Debugging İçin Hazır Promptlar

### Log eklemek için:
```prompt
"[DOSYA] dosyasındaki [FONKSİYON] fonksiyonuna debug logları ekle:
- Fonksiyon başında: 'Starting [FONKSIYON]...'
- Her önemli adımda durum logları
- Fonksiyon sonunda: 'Finished [FONKSIYON]'
logger.debug() kullan."
```

### Hata yakalamak için:
```prompt
"[DOSYA] dosyasındaki [FONKSİYON] fonksiyonunu try-catch ile sar.
Catch bloğunda hatayı logla ve anlamlı bir hata mesajı döndür."
```

## 📊 Proje Karmaşıklık Haritası

### 🟢 Kolay Değiştirilebilir (AI için basit)
- `.env.example` - Ayarlar
- `src/config.ts` - Varsayılan değerler
- `src/twitter/client.ts` - Tweet metinleri
- `README.md` - Dokümantasyon

### 🟡 Orta Seviye (Dikkat gerekir)
- `src/bot.ts` - Ana akış
- `src/scrapers/instagram-secure.ts` - Scraping logic
- `src/utils/diff.ts` - Değişiklik hesaplama

### 🔴 Zor (AI'a çok detaylı talimat ver)
- `src/utils/validator.ts` - Validation kuralları
- `src/utils/sanitizer.ts` - Security logic
- `src/scrapers/instagram-secure.ts` - Login ve stealth

## 💡 En İyi Pratikler

### 1. Her Zaman Backup Alın
```
"Değişiklik yapmadan önce [DOSYA] dosyasının bir kopyasını
[DOSYA].backup olarak kaydet"
```

### 2. Küçük Adımlar
```
✅ "Önce sadece emoji değişikliğini yap, sonra test edelim"
❌ "Her şeyi birden değiştir"
```

### 3. Test Edin
```
"Değişiklikten sonra 'npm run validate' komutunu çalıştır ve
sonucu göster"
```

### 4. Değişiklikleri Anlayın
```
"Bu değişiklik ne yapıyor? Başka neyi etkiler?
Yan etkileri var mı?"
```

## 🆘 Acil Durum Promptları

### Bir şey bozuldu:
```
"Son yaptığım değişiklikleri geri al.
Git kullanarak son commit'e dön."
```

### Dosya kayboldu:
```
"Git'te [DOSYA] dosyasının en son halini bul ve
geri yükle."
```

### Çalışmaz hale geldi:
```
"Tüm değişiklikleri gözden geçir ve potansiyel
sorunları listele. Ardından her birini tek tek
test edelim."
```

## 📚 Faydalı Komutlar

AI'a bunları yazdırabilirsiniz:

```bash
# Konfigürasyonu doğrula
npm run validate

# Tek seferlik test
npm run dev

# Logları görüntüle
tail -f logs/combined.log

# Hata logları
tail -f logs/error.log

# Build
npm run build

# Snapshot'ları listele
ls -lh data/snapshots/

# Screenshot'ları listele
ls -lh data/screenshots/
```

## 🎯 Özet: Başarılı AI Talimatı İçin

1. **Dosya adını tam verin**: `src/bot.ts`
2. **Fonksiyon adını belirtin**: `generateTweetText`
3. **Ne değişeceğini açıklayın**: "'📊' emojisini '🔔' yap"
4. **Tam değerleri verin**: "MIN_DELAY=5000" (belirsiz değil)
5. **Test isteyin**: "Sonra validate çalıştır"

---

**Hatırlatma:** Bu rehberi AI'a da gösterebilirsiniz:
```
"AI_GUIDE.md dosyasını oku ve [SENARYO] için
örnek promptu kullanarak değişikliği yap"
```

Başarılar! 🚀
