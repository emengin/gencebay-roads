# GENCEBAY ROADS — Doğrulama kapsamı

**17 Kasım 2026 · Güncel kaynak ve Vite 6.4.6 üretim derlemesi**

## Otomatik testler

`npm run build` ve `npm test` başarılıdır: **17/17 test geçti**.

| Kapsam             | Doğrulanan davranış                                                                    |
| ------------------ | -------------------------------------------------------------------------------------- |
| Araçlar            | Beş farklı model, sonlu geometri ve gövdeye bağlı tam plaka metni                      |
| Fizik              | Gaz, sürtünme, fren, geri, el freni, reset ve yol dışına çıkma                         |
| Sabit adım         | 30/144 Hz görüntü yenilemesinde aynı 90 Hz fizik sonucu                                |
| Otomatik sürüş     | Beş araç × üç yol × beş dakika; ayrıca yağmur ve kar sürüşü                            |
| Kamera ve atmosfer | Kamera kadrajı, sonlu hava/parçacık verileri ve geçerli shader bileşenleri             |
| Yol ve arazi       | Seed tutarlılığı, kesintisiz spline/yol kenarları ve komşu arazi sınırları             |
| Kaynak yönetimi    | 20 km parça döngüsü, kaynak temizliği ve floating origin                               |
| Yol dışı dünya     | Oyuncuyu takip eden sınırlı arazi penceresi                                            |
| Depolama           | Ayar/günlük geri yükleme; bozuk veya kullanılamayan saklamaya tolerans                 |
| Dağıtım            | Benzersiz HTML kimlikleri, geçerli UI hedefleri ve yerel/göreli üretim asset adresleri |

Fizik ve geometri testleri hızlandırılmış simülasyonlardır; saatlerce gerçek zamanlı kullanım veya belirli bir FPS garantisi anlamına gelmez.

## Chromium tarayıcı kontrolü

1366×900 masaüstü görünümünde üretim paketi bir alt klasörden açıldı. Garajda araç değişimi, klavyeyle hızlanma, otomatik sürüş, kamera değişimi, gece/yağmur ayarları ve PNG fotoğraf indirme çalıştı. Normal oynanış sırasında JavaScript veya shader hatası gözlenmedi; gece/yağmur sürüşü ve fotoğraf çıktısı görsel olarak incelendi.

Bu kapsam gerçek telefon, fiziksel gamepad, Safari/Firefox, bütün ekran boyutları veya uzun süreli GPU/ısı testi içermez. Sesin kullanıcı etkileşimiyle başlatılması kodda bulunur; öznel ses kalitesi bu kontrolün kapsamı değildir.

## Güvenlik denetimi

- Geliştirme bağımlılıkları güncellendi. `npm audit` üretim ve geliştirme bağımlılıklarında **0 bilinen açık** bildiriyor.
- Üretim CSP'si ile normal oyun, kamera ve fotoğraf akışı çalıştı. Zararsız test betiğinin satır içinde yürütülmesi ve dış adrese bağlantı denemesi tarayıcı tarafından engellendi.
- Kaynakların ve tam Git geçmişinin bilinen erişim anahtarı/özel anahtar desenleriyle taramasında eşleşme bulunmadı. GitHub açık secret-scanning uyarısı bulunmadı.
- Actions eylemleri tam commit kimliklerine sabitlendi; yayın yetkileri derleme işinden ayrıldı. Kimlik bilgilerinin checkout'ta kalıcı tutulması kapatıldı.
- Üretim oyunu sunucu hesabı veya API anahtarı kullanmaz. Yerel başlatıcılar loopback adresini ve hazır `dist` klasörünü kullanır.
- Node ve Windows PowerShell başlatıcıları çalıştırıldı: ana sayfa HTTP 200; üst klasör, kodlanmış yol geçişi, `.env` ve `.git/config` istekleri HTTP 404 ile reddedildi.

Bu sonuçlar denetim anında bilinen ve test edilen kapsamı belirtir. Yeni bağımlılık açıkları veya doğrulanmamış tarayıcı/donanım davranışları için mutlak güvenlik garantisi verilmez. Bildirim kanalı [SECURITY.md](../SECURITY.md) içindedir.
