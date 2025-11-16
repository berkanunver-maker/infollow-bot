# Hızlı Referans - AI için 📖

AI'a kopyala-yapıştır yapabileceğiniz hazır talimatlar.

## 🎯 Bu Dosyayı Nasıl Kullanırsınız?

1. Yapmak istediğiniz değişikliği aşağıda bulun
2. Promptu kopyalayın
3. AI'a yapıştırın
4. AI değişikliği yapar

---

## 📋 Hazır Promptlar

### 🔄 Çalışma Sıklığını Değiştir

#### Günde bir kez çalışsın:
```
.env.example dosyasında CRON_SCHEDULE değerini '0 0 * * *' yap
```

#### Her 12 saatte bir:
```
.env.example dosyasında CRON_SCHEDULE değerini '0 */12 * * *' yap
```

#### Her 3 saatte bir:
```
.env.example dosyasında CRON_SCHEDULE değerini '0 */3 * * *' yap
```

---

### ⏱️ Bot Hızını Değiştir

#### Daha yavaş (güvenli):
```
.env.example dosyasında:
- MIN_DELAY=5000
- MAX_DELAY=10000
yap
```

#### Çok yavaş (en güvenli):
```
.env.example dosyasında:
- MIN_DELAY=10000
- MAX_DELAY=20000
yap
```

#### Daha hızlı (RİSKLİ):
```
.env.example dosyasında:
- MIN_DELAY=500
- MAX_DELAY=1500
yap
```

---

### 🐦 Tweet Metnini Özelleştir

#### Emojileri değiştir:
```
src/twitter/client.ts dosyasındaki generateTweetText fonksiyonunda:
- '📊' → '🔔'
- '📈' → '⬆️'
- '📉' → '⬇️'
- '✅' → '➕'
- '❌' → '➖'
değiştir
```

#### Türkçe yap:
```
src/twitter/client.ts dosyasındaki generateTweetText fonksiyonunda:
- 'Instagram Following Update' → 'Instagram Takip Güncellemesi'
- 'Following:' → 'Takip:'
- 'New Follows' → 'Yeni Takipler'
- 'Unfollowed' → 'Takipten Çıkanlar'
yap
```

---

### 📊 Snapshot Sayısını Değiştir

#### Daha az snapshot sakla (5 tane):
```
src/bot.ts dosyasında deleteOldSnapshots(config.instagram.targetUsername, 10)
satırındaki 10'u 5 yap
```

#### Daha fazla sakla (20 tane):
```
src/bot.ts dosyasında deleteOldSnapshots(config.instagram.targetUsername, 10)
satırındaki 10'u 20 yap
```

---

### 📸 Screenshot Ayarları

#### Screenshot'ları kapat:
```
src/bot.ts dosyasında screenshot alma kodunu yorum satırı yap.
takeProfileScreenshot çağrısı olan 73-82 satırları /* */ ile sar.
```

#### Tam sayfa screenshot:
```
src/scrapers/instagram-secure.ts dosyasındaki takeProfileScreenshot
fonksiyonunda fullPage: false değerini fullPage: true yap
```

---

### 📝 Log Seviyesini Değiştir

#### Daha az log (sadece hatalar):
```
.env.example dosyasında LOG_LEVEL=error yap
```

#### Daha fazla log (debug):
```
.env.example dosyasında LOG_LEVEL=debug yap
```

---

### 🎯 Sadece Büyük Değişiklikleri Tweetle

#### 10+ kişi değişince tweetle:
```
src/bot.ts dosyasında:
if (this.diffDetector.hasChanges(diff)) {

kodunu:

if (diff.newFollows.length >= 10 || diff.unfollows.length >= 10) {

yap
```

---

### 👤 Kullanıcı Bilgilerini Genişlet

#### Tweet'lerde tam isim göster:
```
src/twitter/client.ts dosyasındaki generateTweetText fonksiyonunda:

• @${user.username}${user.isVerified ? ' ✓' : ''}

satırını:

• @${user.username} (${user.fullName})${user.isVerified ? ' ✓' : ''}

yap
```

---

## 🛠️ Sorun Giderme Promptları

### Logları görüntüle:
```
logs/combined.log dosyasının son 50 satırını göster
```

### Hata loglarını görüntüle:
```
logs/error.log dosyası varsa son 30 satırını göster
```

### Konfigürasyonu kontrol et:
```
npm run validate komutunu çalıştır ve sonucu göster
```

### Son değişiklikleri gör:
```
git diff komutunu çalıştır ve değişiklikleri listele
```

### Değişiklikleri geri al:
```
git checkout -- [DOSYA_ADI] komutuyla dosyayı eski haline getir
```

---

## 📁 Dosya Yolları Referansı

Promptlarınızda bu dosya yollarını kullanın:

### Konfigürasyon:
- `.env.example` - Ayar şablonu
- `src/config.ts` - Kod içi konfigürasyon

### Ana Dosyalar:
- `src/bot.ts` - Ana bot logic
- `src/index.ts` - Tek çalıştırma
- `src/worker.ts` - Sürekli çalışma

### Scraping:
- `src/scrapers/instagram-secure.ts` - Instagram scraper

### Twitter:
- `src/twitter/client.ts` - Tweet gönderme

### Utilities:
- `src/utils/diff.ts` - Değişiklik hesaplama
- `src/utils/storage.ts` - Dosya kaydetme
- `src/utils/logger.ts` - Loglama

---

## 💡 Prompt Yazma İpuçları

### ✅ İyi Prompt:
```
"src/twitter/client.ts dosyasındaki generateTweetText
fonksiyonunda satır 35'teki emoji'yi değiştir"
```

### ❌ Kötü Prompt:
```
"Twitter'ı düzenle"
```

### ✅ İyi Prompt:
```
".env.example dosyasında MIN_DELAY=1000 değerini 3000 yap"
```

### ❌ Kötü Prompt:
```
"Delay'i uzat"
```

---

## 🔍 Bilgi Edinme Promptları

### Bir fonksiyonu anlamak için:
```
"src/twitter/client.ts dosyasındaki generateTweetText fonksiyonunu
oku ve ne yaptığını açıkla"
```

### Bir değişkeni bulmak için:
```
"Tüm dosyalarda 'MIN_DELAY' değişkenini ara ve nerede
kullanıldığını listele"
```

### Bir dosyayı anlamak için:
```
"src/bot.ts dosyasını oku ve ana akışı adım adım açıkla"
```

---

## 🎨 Özelleştirme Şablonları

### Kendi tweet formatınız:
```
src/twitter/client.ts dosyasındaki generateTweetText
fonksiyonunu şu formata göre düzenle:

[ŞU FORMATI YAZI]

Örnek:
🔔 @hesap için takip güncellemesi
📈 Yeni: X kişi
📉 Gitti: Y kişi
```

### Kendi loglama formatınız:
```
src/utils/logger.ts dosyasındaki log formatını değiştir:
- Timestamp formatı: 'YYYY-MM-DD HH:mm:ss' → '[İSTEDİĞİNİZ]'
- Level gösterimi: '[${level}]' → '[İSTEDİĞİNİZ]'
```

---

## 🚀 Hızlı Başlangıç Kombinasyonu

Yeni kurulumda bunları sırayla yapın:

```
1. "npm install komutunu çalıştır"

2. ".env.example dosyasını .env olarak kopyala"

3. "AI_GUIDE.md dosyasını göster"

4. ".env dosyasını düzenlemek için aç"

5. "npm run validate komutunu çalıştır"

6. "npm run dev komutunu çalıştır"
```

---

## 📊 Değişiklik Şablonu

Her değişiklikte bu adımları izleyin:

```
1. "[DOSYA] dosyasını oku"
2. "[DEĞİŞİKLİĞİ YAP]"
3. "Değişikliği göster"
4. "npm run validate çalıştır"
5. "git diff ile değişiklikleri kontrol et"
```

---

**Hatırlatma:** Bu promptları kopyala-yapıştır yapabilirsiniz!
