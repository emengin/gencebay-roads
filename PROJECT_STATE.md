# GENCEBAY ROADS — Proje durumu

**17 Kasım 2026 · v1.0.1 · Sürüş titremesi düzeltmesi**

## Mimari

Three.js 0.180.0, Vite 6.4.6 ve JavaScript ES modülleri. Oyun `src/game.js` içinde yönetilir. Fizik 90 Hz sabit adımlıdır; dünya/araç koordinatları double hassasiyette tutulur, çizimde floating origin kullanılır. Üretim `dist` dosyaları ve GitHub Pages üzerinden dağıtılır. Dış servis, API anahtarı veya oyuncu hesabı yoktur.

`src/render/vehicle-presentation.js`, son iki fizik pozunu çizim anına göre ara hesaplar. Bu katman fizik durumunu değiştirmez; araç modeli, süspansiyon ve kamera aynı çizim pozunu kullanır. Ek gecikme en fazla bir fizik adımıdır (yaklaşık 11 ms). Kamera dünya ötelemesini doğrudan takip eder, kadraj değişikliklerini yumuşatır.

## Titreme bulgusu ve değişiklikler

- Fizik pozları 90 Hz'den farklı ekran hızlarına ara hesaplama olmadan aktarılıyordu. Sabit hızlı düz yol fikstüründe 60/144 Hz çizimde kareler arası ilerleme 0.278 m değişiyor, araç kadrajı yaklaşık 1.94/3.38 piksel salınıyordu.
- Model animasyonu, pürüzsüz asfaltta da mesafeye bağlı sinüs salınımı üretiyordu. Bu yapay hareket kaldırıldı; gerçek arazi teması, ivmeye bağlı yük aktarımı, yatma ve tekerlek animasyonları korundu.
- Çizim interpolasyonu eklendi. Pause/fotoğraf modu çizim pozunu dondurur; araç/rota değişimi ve kurtarma eski interpolasyon geçmişini sıfırlar.
- Kamera ve bakış hedefi aynı araç ötelemesini alır. Floating origin geçişinde önceki kamera takip noktası da taşınır. Kamera reset'i eski bakış noktasına doğru kaymayı önler.
- Escape ile açılan mola ekranının aynı tuşun tarayıcı varsayılanı tarafından hemen kapanması engellendi.

## Doğrulama ve devam noktası

23/23 Node testi ve üretim build'i başarılı. Yeni regresyonlar 30–240 Hz, değişken kare süreleri, geri sürüş, yön açısı sarması, beş modelde düz yol/yük aktarımı, üç sabit takip kamerası, teleport ve origin geçişini kapsar. Düz yol ölçümünde yapay salınım sıfırlandı ve kadraj farkı kayan nokta hassasiyeti düzeyine indi.

Gerçek Chromium'da aynı otomatik sürüşün önce/sonra ölçümünde kare hareketi hatasının p95 değeri %33.87'den %0.024'e indi (180'er çizim karesi). Pause sırasında çizim pozu değişmedi. Dört kamera, kurtarma, 2048 m origin geçişi ve PNG fotoğraf indirme geçti; konsol/runtime hatası görülmedi. İnceleme için eklenen ölçüm erişimi yalnızca yerel test sunucusunun yanıtında bulunur, kaynak veya üretim paketinde debug API yoktur. Test kapsamı `docs/TEST_RAPORU.md` içindedir.

## Yayın ve sınırlar

`main` push'unda GitHub Actions bağımlılık denetimi, build, test, paket ve Pages yayını yapar. CSP, SHA ile sabitlenmiş Actions, en az yetki ve mevcut güvenlik kontrolleri korunmalıdır. Yalnızca GENCEBAY ROADS kapsamındadır; diğer oyunlarda değişiklik yapılmaz.

HTTPS doğrulaması, HTTPS zaten zorunluyken ayarı tekrar yazmaya çalışmaz. Gereksiz yönetim API çağrısının GITHUB_TOKEN ile 403 üretmesi böylece önlenir; sertifika ve canlı adres denetimi korunur.

Fizik arcade modelidir. Gerçek telefon/gamepad, bütün tarayıcılar ve her donanımda FPS garantisi yoktur. Önceki güvenlik bakımının ve desteklenen özelliklerin ayrıntıları README, SECURITY ve test raporundadır.
