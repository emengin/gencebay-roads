# Referans analizi ve mimari kararlar

## İnceleme kapsamı

4 Kasım 2026 geliştirme oturumunda [slowroads.io](https://slowroads.io/) doğrudan web aracıyla açıldı. Sayfa JavaScript ağırlıklı olduğu için okunabilir HTML metni elde edilemedi. Etkileşimli tarayıcı açma girişimi, tarayıcı erişim host'unun olmaması nedeniyle başarısız oldu; Windows aracı da mevcut URL'yi güvenle belirleyemediği için durdu. Dolayısıyla referansın kamerası ve sürüşü bizzat oynanarak incelendi denemez.

[Geliştiricinin resmi Web Edition açıklaması](https://topographinteractive.itch.io/slow-roads), sonsuz ve sakin sürüşü, yapılandırılabilir manzaraları ve seed çeşitliliğini doğrular. [Resmi Steam ürün sayfası](https://store.steampowered.com/app/3431300/Slow_Roads/) da manzaralı, amaç baskısı olmayan sürüş fikrini anlatır. Buradan hareketle tasarım hedefi sakin sürüş, ufuk derinliği ve ekranda az sayıda kontrol olarak seçildi. Referansın kapalı kaynak iç uygulaması hakkında kesin algoritma iddiası yapılmadı.

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
