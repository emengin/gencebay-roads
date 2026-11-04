# Doğrulama raporu

**Tarih:** 4 Kasım 2026 · **Sürüm:** 1.0.0

## Otomatik testler

Komut: `npm test` (bu ortamda proje içindeki Node 22.16.0 ile aynı Node test runner doğrudan çağrıldı).

**17/17 test başarılı.** Fizik ve geometri testleri Node ortamında çalışır; GPU çizimini veya gerçek tarayıcı görünümünü doğrulamaz.

| Test | Doğrulanan davranış |
| --- | --- |
| Beş araç + plaka | Farklı boyut/siluet parametreleri, 70'ten fazla mesh, sonlu vertex koordinatları, tam plaka metninin çizilmesi, gövde parent'ı, arkaya dönük normal ve gece ışığı |
| Gaz, fren, geri, el freni, reset | Gerçek x/z hareketi, gaz bırakınca yavaşlama, geri vites ve yola yerleşme |
| Manuel arazi sürüşü | Araç şerit dışına çıkıyor; durum değerleri sonlu |
| 30/144 Hz | Aynı 90 Hz fizik adımları aynı konum ve hızı veriyor |
| Uzun otomatik sürüş | 5 araç × 3 yol × 5 dakika = **75 dakika simüle fizik**; şerit sınırları korunuyor, her koşulda 4.5 km'den fazla mesafe |
| Yağmur/kar | Ek 2 × 3 dakika, dağ yolunda otomatik sürüş şerit içinde |
| Seed | Aynı girdiler aynı yol/arazi, başka seed farklı yol |
| Yol sürekliliği | Spline ve chunk sınırlarında konum/kot/yaw sıçraması yok; yol kenarı zemine uyumlu |
| Büyük koordinatlar | 100 milyon m'ye kadar yol izdüşümü kararlı |
| 20 km chunk döngüsü | Low preset ana parça sayısı 11'de sabit, eski geometri dispose olayları tetikleniyor |
| Ortak arazi kenarları | Komşu parçaların sınır vertex'leri aynı dünya koordinatını paylaşıyor |
| Yol dışı sonsuz arazi | Oyuncu 12 km yana ilerlerken ek terrain tile penceresi 25'te sabit; floating origin doğru; yola dönüşte ek parçalar temizleniyor |
| Saklama | Ayar/günlük geri yükleme, bozuk değerlerin düzeltilmesi, kullanılamayan storage'ın oyunu engellememesi |
| Kamera kadrajı | 1366×768 görünüm hesabında her beş aracın plakasının tamamı yakın kamera frustum'unda; yatay izdüşümü 200 px üzerinde. Kokpitte direksiyon merkezi kadrajda. Bu gerçek ekranda metin okuma testi değildir. |
| Atmosfer verileri | 4 kalite × 4 saat × 5 hava kombinasyonunda sonlu parçacık verileri, sis aralığı, gölge ayarı; sky shader include adları Three.js içinde mevcut |
| DOM bağlantıları | HTML id'leri benzersiz; JS UI seçicilerinin hedefleri HTML'de var |
| Production asset'leri | Derlenmiş HTML mevcut, göreli JS/CSS/favicon adresleri yerel dosyalara çözülüyor |

İlk fizik testinde fren sonrası geri vitesin eğimde takılabildiği görüldü. 0.35 m/s duruş eşiği ve duruşta kontrollü bekleme ile düzeltildi. Ek kamera testi uzun pickup'ta plakanın kadraj dışına çıkabildiğini buldu; yakın kamera mesafesi araç boyuna bağlandı. Kokpit baş konumu direksiyonun da görüneceği şekilde geriye alındı. Düzeltmelerden ve kaynak biçimlendirmesinden sonra son production build ve **tam 17 testlik paket yeniden başarıyla çalıştırıldı**.

## Derleme ve paket

- Vite production build başarılı: tüm kaynak modülleri `dist` içinde yerel JS/CSS'ye paketlenir.
- `base: './'`: dağıtım dosyalarında göreli asset adresleri kullanılır.
- Runtime kaynaklarında dış font, CDN, harici model, fetch veya zorunlu API yoktur.
- Three.js ve Vite lisansları yerel dosyalarda korunur.
- Windows `.NET TcpListener` ve Node `http` başlatıcıları yalnızca 127.0.0.1'e bağlanır.
- Node sunucu `/` ve build JS dosyası: **HTTP 200**, JS yanıtı doğru içerik türüyle alındı.
- Windows PowerShell sunucu `/` ve build JS dosyası: **HTTP 200**. URL ile üst klasördeki `package.json` dosyasına erişim girişimi **HTTP 404** ile reddedildi.
- ZIP arşivi Python standart `zipfile` ile açıldı; tüm dosyaların CRC32 ve manifestteki SHA-256 değerleri doğrulandı. ZIP farklı bir klasöre çıkarıldı.
- **ZIP'ten çıkarılan kopyanın** PowerShell sunucusu ayrıca çalıştırıldı: HTML, hash'li oyun JS dosyası ve Three.js lisansı **HTTP 200**. JS içerik türü `text/javascript; charset=utf-8`.
- Son build: yaklaşık **555 KB JS (145 KB gzip)**, **16 KB CSS**, **12 KB HTML**. Teslim arşivi yaklaşık **260 KB**; node_modules ve yerel derleme araçları dahil değil.
- Kaynak JavaScript modülleri `node --check`; Windows sunucu betiği PowerShell parser kontrolünden geçti.

## Gerçek tarayıcı QA durumu

**Tamamlanmadı.** Browser erişim host'u kullanılamadı. Windows bilgisayar kullanım aracı URL'yi güvenle belirleyemediği için kendini durdurdu. Tarayıcı kontrolü başka bir yoldan aşılmadı. Bu yüzden aşağıdakiler başarıyla doğrulandı diye işaretlenmez:

- GPU shader derlemesi ve gerçek sahne görünümü.
- Garaj/oyun/fotoğraf yerleşiminin ekranda kontrolü.
- Kamera yakınlığında plaka metninin okunabilirliği.
- Tuş ve düğmelerin gerçek tarayıcı üzerinden işletilmesi.
- PNG'nin indirilip açılması, seslerin duyulması.
- Gerçek 60 FPS hedefi, GPU belleğinin uzun süre ölçülmesi.
- Chrome, Edge ve Firefox uyumluluğu; fiziksel gamepad.

## Teslim öncesi manuel liste

- [ ] İnterneti kapat, ZIP'i yeni klasöre çıkar, `BASLAT.cmd` ile aç.
- [ ] Yükleme sonrası sinematik garaj görünüyor; konsolda kritik hata yok.
- [ ] Beş aracı seç, altı boyayı dene, yörüngeyle ön/arka/yan siluetleri incele.
- [ ] Her araçla başla ve yakın takipte **34 GENCEBAY 34** metnini araç üstünde oku.
- [ ] W/A/S/D, fren, geri, el freni, teker dönüşü ve ön teker yönünü kontrol et.
- [ ] Gazı bırak, yokuş ve yol dışı hissini karşılaştır. R ile yola dön.
- [ ] F ile en az 10 dakika sür; viraj ve yokuşları gözle, parça geçişlerinde açıklık arama.
- [ ] C ile dört kamerayı dene. Kokpitte direksiyon/panel görünüyor, kamera zemin altına inmiyor.
- [ ] Dört manzara, üç yol türü, beş hava, dört saati dene.
- [ ] Gece H ile farların yolu aydınlattığını, fren lambası ve plakanın görünür olduğunu gör.
- [ ] Fotoğraf modunda sürükle/yakınlaş, PNG indirip aç; ESC ile dön.
- [ ] M ve ses kaydırıcısını dene; sekme değişiminde sürüşün durduğunu kontrol et.
- [ ] U ile HUD gizle, yeniden aç. Ayarlar/ana menü/sıfırlama düğmelerini dene.
- [ ] Seed değiştir, tekrar aynı seed'e dön; aynı güzergâhı gördüğünü doğrula.
- [ ] Günlük için birkaç km sür, garaja dön; sayfayı yenileyip değerleri kontrol et.
- [ ] Dört kaliteyi değiştir, FPS göstergesiyle sunum bilgisayarına uygun olanı seç.
- [ ] En az 30 dakika gerçek sürüşte tarayıcı görev yöneticisinden RAM/GPU kullanımını gözle.
- [ ] `dist` içeriğini hedef hosting alt klasörüne koyup tüm asset'lerin açıldığını kontrol et.

## Bilinen kapsam sınırları

Arcade zemin örneklemeli fizik; ağaç/kaya çarpışması, trafik, hasar, uçuş/devrilme yoktur. Mobil dokunmatik sürüş ve İngilizce arayüz eklenmedi. Sistem masaüstü tarayıcı içindir. İleri/geri yol üretimi ve ek yanal terrain pencereleri sınırlı sayıda mesh tutar; sonsuz sayıda nesneyi aynı anda çizmez. GPU belleği sızıntısızlığı yalnızca dispose mantığıyla desteklenmiştir, gerçek GPU üzerinde ölçülmüş bir iddia değildir.
