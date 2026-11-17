# Referans analizi ve mimari kararlar

## Tasarım referansı

[Slow Roads](https://slowroads.io/) ve [resmi Web Edition açıklaması](https://topographinteractive.itch.io/slow-roads), hedef baskısı olmadan manzaralar arasında sürüş fikrine referans olmuştur. GENCEBAY ROADS bu türü kendi araçları, Türkçe arayüzü, fotoğraf modu ve yolculuk günlüğüyle yorumlar.

Referans oyunun kapalı kaynak iç algoritmaları hakkında eşdeğerlik iddiası yoktur. Aşağıdaki yöntemler bu projenin kendi uygulamasını açıklar; harici kod, model veya ses varlıkları kopyalanmamıştır.

## Gencebay Roads uygulaması

1. **Yol merkezli üretim:** İleri yön parametresi z. Seed ile örneklenen kontrol noktaları Catmull–Rom ile yumuşatılır. Yol yüksekliği düşük frekanslı noise ve sinüsle değişir. Başlangıç yumuşak biçimde düz tutulur.
2. **Uyumlu arazi:** Dünya yükseklik fonksiyonu her konumun yola izdüşümünü bulur. Yol yakınında arazi yol kotuna oturur; uzaklıkla noise tepeleri ve sırtlar eklenir. Böylece yol ayrı, zemin ayrı bağımsız bir animasyon değildir.
3. **Chunk yaşam döngüsü:** Her parça 160 m, yanal örnekler yol yakınında sık, uzakta seyrektir. Komşu kenarlar aynı dünya fonksiyonunu örnekler. Kaliteye bağlı sabit sayıda parça tutulur. Geride kalan geometri, instance buffer ve tabela dokuları dispose edilir.
4. **Floating origin:** Fizik double dünya koordinatlarını korur. Araç render merkezinden 2048 m uzaklaşınca sahne 1024 m katına kaydırılır. Kamera ve bakış hedefi aynı farkla kayar.
5. **Araçlar:** Özgün boyuna loft gövdeler; ayrık tavan, eğimli camlar, sütunlar, iç mekân, teker ve lamba parçaları. Beş araç yalnızca boya varyantı değildir.
6. **Plaka:** 1024×236 CanvasTexture üzerinde tam metin; materyal arka yüzündeki 0.99×0.228 m düzleme uygulanır. Düzlem gövdeye parent edilir. Gece emissive map ve ışık kullanılır.
7. **Sürüş:** Sabit 1/90 s adım, hızla azalan direksiyon açısı, bisiklet modeli, tutuşa göre yaw limiti, direnç ve eğim etkisi. Arazi sürüşünde farklı direnç ve grip. Araç kütlesi direksiyon tepki süresine yansır; hızlanma ve fren her araçta ayrı kalibre edilmiştir.
8. **Otomatik:** Hızla büyüyen ileri bakış noktası, hedef şeride pure pursuit direksiyonu, yol eğriliğine göre hız azaltma. Yalnızca mevcut yöne gaz verilmez.
9. **Atmosfer:** Kodla üretilmiş gökyüzü shader'ı, sis, güneş, gece yıldızları, instanced bulut hacimleri ve parçacık yağışı. Farlar yola gerçek spot ışığı gönderir.
10. **Özgün kimlik:** Kiremit/ekru palet, Türkçe yolculuk dili, Gencebay Garage, fotoğraf, günlük ve seyrek Türkçe tabelalar.

Görsel hedef stilize, sakin bir manzaradır. Üretim kodu tamamen bağımsızdır. Referansla birebir görsel veya fizik eşitliği ileri sürülmez; bu özellikle gerçek tarayıcı QA'sı gerektirir.
