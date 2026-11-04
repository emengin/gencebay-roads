# GENCEBAY ROADS — Sunum rehberi

**BİLP1117 Web Programlama I · Dönem projesi · Teslim: 28 Kasım 2026**

Bu rehber oluşturulan kodu açıklar. Denenmeyen şeyleri denenmiş gibi anlatmayın. Gerçek tarayıcı kontrol listesini sunumdan önce tamamlayın; mevcut doğrulama kapsamı `docs/TEST_RAPORU.md` içindedir.

## 1. Amaç

“Gencebay Roads, tarayıcıda manzara izleyerek araba sürmek için yaptığım bir oyun. Yarış, skor veya bitiş çizgisi yerine kesintisiz bir yolculuk var. Web sayfası yalnızca bilgi göstermiyor; klavye, fare ve JavaScript ile gerçek zamanlı bir 3D dünyayı yönetiyor.”

## 2. Fikri neden seçtim?

Proje fikri, kullanıcının Slow Roads benzeri sakin bir sürüş deneyimini kendi kimliğiyle geliştirme isteğinden doğdu. Bir üniversite ödevinin ötesinde, kişisel alan adında oynanabilecek statik bir ürün hedeflendi. Kendi nedeninizi kendi sözlerinizle anlatın; yapılmayan bir kullanıcı araştırmasını veya kişisel geçmişi eklemeyin.

## 3. Referanstan nasıl ilham aldık?

[Slow Roads](https://slowroads.io/) ve [resmi Web Edition açıklaması](https://topographinteractive.itch.io/slow-roads) tür referansı oldu: sakin sürüş, sürekli üretilen manzaralar, az arayüz. Kapalı kaynak kod veya varlıklar kullanılmadı. Bu oturumda site web aracıyla açıldı; araç kısıtı nedeniyle referans bizzat oynanarak incelenemedi. Uygulanan algoritmalar bu projeye ait bağımsız kararlardır.

## 4. Özgün katkılar

- Her beş araçta da tam `34 GENCEBAY 34` plaka; 3D gövdeye bağlı ve gece aydınlık.
- Gencebay Garage: ayrı siluetlere sahip beş otomobil ve altı boya.
- Gencebay Photo Mode: durdurulmuş sürüşte serbest yörünge ve PNG çıktısı.
- Journey Diary: tarayıcıda saklanan toplam mesafe, en uzun sefer ve son seçimler.
- Seyrek Türkçe yol tabelaları, Türkçe mikro metinler ve özgün ekru/kiremit kimlik.
- Dünya koduyla tekrarlanabilen güzergâh, dört manzara ve hava/saat denetimi.

## 5. Yapay zekâ kullanımı

Bu proje **OpenAI Codex** yardımıyla geliştirildi. Codex görev metnini okudu; mimariyi, JavaScript/HTML/CSS dosyalarını, prosedürel geometriyi, testleri, başlatıcıları ve bu açıklamaları üretti. Terminal ile test ve derleme yaptı. Web aracı resmi referansları ve dokümantasyonu kontrol etmek için kullanıldı. Bilgisayar/tarayıcı aracıyla inceleme denendi fakat araç güvenle URL belirleyemediğinden durdu.

ImageGen, Midjourney, Blender, gerçek GLB model indirme veya dış ses üretim servisi **kullanılmadı**. Araziyi noise ile üretmek, çalışma anında bir yapay zekâ modeli çağırmak değildir. Oyun oynanırken hiçbir AI API'sine bağlanılmaz.

Sunumdan önce kodu okuyup bu rehberdeki veri akışını anlayın. “Tamamını yardımsız yazdım” veya “bütün tarayıcıları test ettim” demeyin. Dersin AI kullanım kurallarına uygun biçimde araç katkısını açıklayın.

## 6. Gerçek geliştirme akışı

1. Görev dosyası, yerel ortam ve resmi referanslar incelendi; boş çalışma alanı belirlendi.
2. Three.js ve Vite kurulup ES modül yapısı, HTML ekranları ve görsel kimlik hazırlandı.
3. Noise/spline yol ve arazi, chunk üretimi ve instanced çevre eklendi.
4. Araç loft geometrileri, plaka, 90 Hz fizik ve kameralar bağlandı.
5. Saat, hava, parçacıklar, farlar, ses, otomatik sürüş, ayarlar, fotoğraf ve günlük eklendi.
6. Production build üretildi. Otomatik test ilk çalıştırmada fren–geri geçiş hatasını yakaladı; durma eşiği ve geri vites beklemesi düzeltildi.
7. Bütün otomatik testler geçirildi; çevrimdışı başlatıcılar ve teslim dokümanları hazırlandı.

Geliştirme sırası tek oturumda bazı sistemlerin birlikte oluşturulduğu gerçek iş akışıdır. Her aşamada elle tarayıcı oynanış testi yapıldığı iddia edilmez.

## 7. Teknolojilerin görevleri

| Teknoloji | Buradaki görevi |
| --- | --- |
| HTML | Düğmeler, seçim alanları, diyaloglar, canvas ve erişilebilir metin |
| CSS | Sıcak palet, yerleşim, responsive boyutlar, geçişler ve HUD |
| JavaScript | Girdi, fizik, seed, geometri üretimi, oyun durumu ve etkileşim |
| Three.js | Kamera, mesh, materyal, ışık, gölge, texture, instancing ve WebGL çizimi |
| Vite | Modülleri birleştirme, geliştirme sunucusu, relative path'li production build |
| localStorage | Sunucusuz ayarlar ve günlük |
| Web Audio API | İşlemciyle üretilen motor ve çevre sesi |

## 8. Oyun döngüsü

`Game.frame(time)` her `requestAnimationFrame` çağrısında çalışır. Önce geçen süre ölçülür ve büyük sekme atlamalarına karşı 0.1 s ile sınırlandırılır. Sürüş aktifse süre accumulator'a eklenir. Accumulator en az 1/90 s içerdiği sürece fizik adımı yapılır. Sonra gövde/teker animasyonu, chunk güncellemesi, kamera, atmosfer, ses ve HUD güncellenir; renderer sahneyi çizer.

Böylece fizik, ekranın 30, 60 veya 144 Hz olmasıyla hızlanmaz. Render kare hızı GPU'ya bağlı kalır. Fotoğraf modu fizik döngüsünü dondurur ama kamera çalışır. Ayarlar açıkken sürüş durur.

## 9. Klavyeden tekerleğe veri akışı

```text
keydown W → Input.keys kümesine KeyW eklenir
Input.read() → throttle=1, brake=0, steer=…
Game.frame() → sabit fizik adımlarını çalıştırır
VehiclePhysics.step() → ivme → hız → yaw → dünya x/z → yükseklik/eğim
Game.syncModel() → dünya konumunu render konumuna çevirir
VehicleModel.animate() → teker dönüşü, direksiyon, gövde/süspansiyon
CameraController.update() → kamerayı takip ettirir
renderer.render() → yeni görüntüyü canvas'a çizer
```

Gaz bırakılınca yuvarlanma/aerodinamik direnç yavaşlatır. Eğim de ivmeyi etkiler. S önce frenler; durmaya yakın küçük bir beklemeden sonra geri ivme verir. El freni hız keser ve yanal kayma ekler. Direksiyonun maksimum açısı hızla azalır; yaw hızı tutuşla sınırlandırılır. Kütle direksiyon tepki süresine etki eder; araçlar ayrıca ayrı hızlanma, fren, grip ve süspansiyon değerleri taşır.

Bu tam bir çok gövdeli fizik motoru değildir. Araç zeminin yüksekliğini örnekler, uçuş/devrilme/çarpışma çözmez.

## 10. Yol, arazi ve sonsuzluk

`hashSeed` dünya kodunu tamsayıya çevirir. `Noise` koordinata bağlı deterministik değerler verir. Yol x konumu, 210 m aralıklı örneklerin Catmull–Rom interpolasyonuyla hesaplanır. Y kotu düşük frekanslı noise ve sinüs bileşimidir. Aynı seed ve yol türü aynı güzergâhı üretir.

Her terrain noktası yola en yakın konuma izdüşürülür. Yol yakınında yükseklik yol kotuna düzleşir, uzakta noise tepeleri güçlenir. Yol şeridi aynı `Route.sample` fonksiyonundan oluşturulur. Komşu parçalar sınırda aynı koordinatları örneklediğinden çatlak oluşmaz. Göl merkezinde arazi aşağı oyulur; su ayrı mesh'tir.

`World.update` 160 m'lik parçaları araç çevresinde tutar. Kaliteye göre Low 11, Medium 15, High 19, Ultra 25 ana parça tutulur. Uzak yanal örnekler daha seyrektir. Yoldan 1200 m'den fazla uzaklaşınca oyuncuyu izleyen en fazla 25 adet 640 m genişliğinde arazi tile'ı da oluşturulur; böylece yol çevresi şeridinin ötesinde arazi sürüşü sürer. Ağaç/çim/kaya kümeleri InstancedMesh ile çok az çizim çağrısında görüntülenir. Silinen parçaların geometry, instance buffer ve tabelaya ait texture/material kaynakları temizlenir.

Fizik koordinatı JavaScript double sayıdır. Render konumu çok büyüyünce floating origin sahne merkezini kaydırır. Bu bir arka planın kaydırılması değildir: gerçek araç x/z değerleri değişir; yalnızca GPU'ya gönderilen sayılar yakın tutulur.

## 11. Plaka texture sistemi

`VehicleModel` üretiminde 1024×236 bir canvas oluşturulur. Beyaz taban, mavi TR şeridi ve siyah **tam metin** çizilir. CanvasTexture sRGB olarak tanımlanıp MeshStandardMaterial üzerine uygulanır. Plaka, aracın boyuna bağlı olarak arka tamponun biraz dışına yerleştirilen 0.99×0.228 m bir PlaneGeometry'dir; y ekseninde π döndürülerek arkaya bakar.

Plakanın parent'ı `body`, onun parent'ı `root` olduğundan araç dönünce plaka da aynı dönüşümü alır. HTML'e yapıştırılmış bir yazı değildir. Her model aynı üretim fonksiyonunu kullandığı için beş araçta aynı tam metin korunur. Gece emissiveMap + küçük bir ışık kullanılır. Yakın takip modu, uzaktan çok küçük görünen metni incelemek içindir.

Otomatik test texture çizim çağrısını, tam metni, parent ilişkisini, yönünü ve gece değerlerini kontrol eder. Gerçek ekranda metnin okunabildiği ayrıca elle görülmelidir.

## 12. Kamera mekanizması

C tuşu `CameraController.mode` değerini 0–3 arasında değiştirir. Takip ve yakın takip, araç yaw'ına göre arka ofset oluşturur. Kokpit, araç matrisinden sürücü başı konumu hesaplar; iç mekândaki direksiyon ve gösterge geometrileri görünür. Sinematik mod araca göre yanal açı kullanır. Kamera ve hedef üstel yumuşatmayla yaklaşır. Kokpitte gecikme olmaması için baş pozisyonu doğrudan uygulanır.

Garaj ve fotoğraf modları yörünge kamerası kullanır. Fare sürükleme azimut/elevasyonu, tekerlek mesafeyi değiştirir. Garajın yatay ekranında off-axis projection aracı sağda tutar. Takip kamerası zeminin altına düşmemek için yüksekliği kontrol eder.

## 13. Teknik zorluklar ve çözümler

| Sorun | Uygulanan çözüm |
| --- | --- |
| Sonsuz dünya bellek biriktirebilir | Sınırlı chunk penceresi + dispose + 20 km yaşam döngüsü testi |
| Yol ve arazi ayrışabilir | Ortak yükseklik/izdüşüm fonksiyonu |
| Parça kenarlarında boşluk | Aynı koordinatı deterministik örnekleme ve kenar testi |
| Çok uzun sürüşte GPU hassasiyeti | Floating origin |
| Binlerce ağaç maliyeti | Tür başına InstancedMesh, seyrek uzak arazi örnekleri |
| Aynı karede fren ve geri geçişi | Duruş eşiği ve 0.25 s geri vites beklemesi; yakalanan test hatası düzeltildi |
| Uzun plaka metni | Yüksek çözünürlüklü geniş canvas ve ayrı 3D yüzey |
| İnternetsiz sunum | Yerel dist + bağımlılıksız localhost başlatıcıları |
| Tarayıcı sesi otomatik başlatamaz | İlk kullanıcı etkileşiminde AudioContext başlatma |
| Otomatik sürüş virajı kaçırabilir | Pure pursuit + eğrilikle hız sınırı + uzun simülasyon testleri |

## 14. Hoca soruları ve cevapları

**Three.js oyun motoru mu?** Grafik kütüphanesidir. Araç fiziği, dünya yaşam döngüsü, girdi ve oyun durumu bizim JavaScript modüllerimizde.

**Gerçekten sonsuz mu?** Dünya tek dosyada hazırlanmış değildir. Matematik fonksiyonları gerektiğinde yeni parçalar üretir; geridekiler kaldırılır. Sayısal bilgisayarların sınırları vardır, ama belirlenmiş bir bitiş çizgisi yoktur.

**Seed neden aynı sonucu verir?** Random kararlar seed/koordinat hash'ine bağlıdır. Aynı girdiler aynı noise, spline ve bitki konumlarını üretir. Bulutlar ve ses ise oynanış determinismi için kritik değildir.

**Neden backend yok?** Oyun tamamen cihazda çizilir ve simüle edilir. Hesap, çok oyuncu veya paylaşılan veritabanı istenmedi. Günlük localStorage'da saklanır.

**FPS düşerse araba yavaşlar mı?** Render daha az kare üretir ama fizik sabit adımla çalışır. Çok uzun bir karede birikim sınırlandırıldığı için aşırı yük altında gerçek zamanla tam eşleşme garanti değildir. Normal aralıkta 30/144 Hz eşdeğerliği test edildi.

**Plaka neden DOM değil?** Materyal olarak mesh'e bağlıdır; perspektife ve araç dönüşüne uyar. Gece emissive olarak görünür.

**Araçlar gerçek modeller mi?** Harici GLB yok. Bu proje için çok parçalı prosedürel modeller üretildi. Gövde, birkaç kutu yerine boyuna profil loft'uyla şekillenir; detaylarda ayrı geometriler kullanılır.

**Araç kütlesi gerçekten kullanılıyor mu?** `VehiclePhysics.step` içinde direksiyonun tepki zamanında kullanılıyor. Tam fiziksel kütle/kuvvet çözücüsü yok; hızlanma/fren/yol tutuş araç başına ayrı arcade parametreleridir.

**Otomatik sürüş nasıl çalışır?** Aracın önünde hedef şerit noktası seçilir. Hedef açı ve mesafeden direksiyon açısı çıkarılır. Yaklaşan eğri keskinse hedef hız düşer. W/A/S/D ile kullanıcı kontrolü devralabilir.

**Daha sonra ne eklenebilir?** Gerçek tarayıcı performans ölçümüne göre iyileştirme, dokunmatik sürüş, İngilizce yerelleştirme, çarpışma ve gelişmiş fizik. Bunları mevcut sürümün özelliği olarak anlatmayın.

## 15. Dört dakikalık demo

| Süre | Göster |
| --- | --- |
| 0:00–0:30 | Amaç ve AI katkısını kısaca açıkla. Garajda beş araç arasında geç; pickup ve SUV farkını göster. |
| 0:30–1:00 | Boya değiştir, oyuna başla. W ile hızlan, S ile fren ve kısa geri sürüş yap. |
| 1:00–1:35 | C ile yakın takip. Araca bağlı tam plakayı göster. R ile yola dön, F ile otomatik sürüşü aç. |
| 1:35–2:10 | Ayarlarda sonbahar, gece ve yağmuru seç. Farları ve stopları göster. |
| 2:10–2:40 | Fotoğraf modunda yörünge yap ve PNG indir. Sürüşe dön. |
| 2:40–3:15 | Seed'i değiştir. Kodda Route, sabit fizik adımı ve plaka parent ilişkisini göster. |
| 3:15–4:00 | Günlüğü, çevrimdışı dist'yi ve test raporunu göster. Doğrulanmamış kapsamı dürüstçe belirt. |

Sunumdan önce interneti kapatıp `BASLAT.cmd` ile prova yapın. Ses seviyesini önceden ayarlayın. Farklı araçlarda yakın takip plakayı gösterin. Gerçek GPU FPS'i gözleyerek sunum bilgisayarında uygun grafik kalitesini seçin.
