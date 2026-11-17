# GENCEBAY ROADS — Teknik işleyiş

GENCEBAY ROADS, üç boyutlu manzaralar arasında hedef baskısı olmadan sürüş sunan bir tarayıcı oyunudur. Beş araç, dört manzara, farklı saat/hava seçenekleri, garaj, fotoğraf modu ve yerel yolculuk günlüğü içerir.

## Oyun ve veri akışı

Klavye, fare veya gamepad girdisi → sabit adımlı araç fiziği → yol/arazi konumu → araç ve kamera → Three.js sahnesi → Canvas/WebGL çıktısı. Ses ve arayüz aynı sürüş durumunu kullanır.

Fizik 1/90 saniyelik sabit adımlarla güncellenir; çizim `requestAnimationFrame` ile yürütülür. Gaz, fren, geri vites, eğim, tutuş, el freni ve araç parametreleri hareketi etkiler. Otomatik sürüş, pure pursuit yöntemiyle ileri bir yol noktasını hedefler ve virajlara göre hızını azaltır.

## Dünya üretimi

- Dünya kodu deterministik kontrol noktalarını belirler. Catmull–Rom eğrileri yolu yumuşatır; noise yükseklik ve arazi çeşitliliği oluşturur.
- Yol çevresindeki arazi aynı yükseklik kaynağına bağlanır. Uzaklaşınca tepeler, vadiler ve göl havzaları oluşur.
- Dünya 160 metrelik parçalarla yönetilir. Görüş alanından çıkan kaynaklar temizlenir; ağaç, kaya ve bitkiler InstancedMesh ile çizilir.
- Floating origin, uzun yolculuklarda çizim koordinatlarını küçük tutar. Yol dışında oyuncuyu izleyen ek arazi penceresi kullanılır.

## Araç, kamera ve atmosfer

Araçlar boyuna gövde geometrileri, camlar, iç mekân, tekerlekler, farlar ve `34 GENCEBAY 34` plakasıyla koddan oluşturulur. Beş model farklı boyut ve sürüş parametrelerine sahiptir. Kamera seçenekleri takip, yakın takip, kokpit ve sinematiktir.

Gökyüzü shader'ı, sis, güneş, yıldızlar ve yağış günün saatine/havaya göre değişir. Gece farları gerçek spot ışığı kullanır. Grafik kalitesi görüş mesafesini, bitki yoğunluğunu, gölgeleri ve parçacık sayısını değiştirir.

Web Audio API motor, lastik, rüzgâr ve çevre seslerini üretir. Ses ilk kullanıcı etkileşimiyle açılır; harici ses dosyası indirilmez. Fotoğraf modu görüntüyü Canvas üzerinden PNG olarak kaydeder.

## Kaynak düzeni

| Bölüm                   | Görev                                                             |
| ----------------------- | ----------------------------------------------------------------- |
| `src/game.js`           | Sahne, oyun durumları, sabit fizik döngüsü ve kaynak bağlantıları |
| `src/world/`            | Seed, spline rota, yükseklik ve dünya parçaları                   |
| `src/vehicles/`         | Araç kataloğu, modeller, fizik ve otomatik sürüş                  |
| `src/render/`           | Kamera, gökyüzü, ışık, sis ve yağış                               |
| `src/core/`             | Girdi, matematik, ayarlar ve yolculuk günlüğü                     |
| `src/ui/`, `src/audio/` | Arayüz ve sentezlenen sesler                                      |
| `scripts/`              | Loopback sunucuları ve dağıtım arşivi                             |
| `.github/`              | Test, bağımlılık denetimi ve Pages yayını                         |

## Veri, dağıtım ve güvenlik

Oyun hesabı, veritabanı veya API anahtarı yoktur. Ayarlar ve günlük `localStorage` içinde tutulur. Üretim sayfası dış bağlantıları ve satır içi betikleri kısıtlayan CSP kullanır. Vite yalnızca geliştirme/derleme aracıdır; üretimde statik `dist` dosyaları sunulur.

`npm run build`, `npm test` ve `npm audit` yerel doğrulamaları çalıştırır. Kaynaklar Three.js 0.180.0, Vite 6.4.6 ve JavaScript ES modüllerini kullanır. Bağımlılıkların lisansları [üçüncü taraf bildirimlerinde](THIRD_PARTY_NOTICES.md) listelenmiştir.

## Kapsam

Masaüstü, WebGL 2 destekli tarayıcılar hedeflenir. Fizik arcade türündedir; trafik, araç hasarı, ragdoll veya mobil dokunmatik sürüş içermez. Gamepad davranışı donanıma ve tarayıcıya bağlıdır. Otomatik testler gerçek donanımdaki bütün performans koşullarını garanti etmez.

Oyun OpenAI Codex yardımıyla geliştirilmiştir. Çalışma sırasında yapay zekâ servisi kullanılmaz. Sakin sonsuz sürüş türü için Slow Roads ilham kaynağıdır; referans oyunun kodu veya varlıkları kullanılmamıştır.
