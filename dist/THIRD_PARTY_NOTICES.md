# Üçüncü taraf içerikler

Oyun çalışırken internetten model, font, ses, resim veya kod indirmez.

| Bileşen | Sürüm | Lisans | Kullanım |
| --- | --- | --- | --- |
| [Three.js](https://threejs.org/) | 0.180.0 | MIT | WebGL çizimi, matematik, geometri ve RoundedBoxGeometry |
| [Vite](https://vite.dev/) | 6.3.5 | MIT | Yalnızca geliştirme ve production derlemesi |

Orijinal lisanslar `licenses/THREE-LICENSE.txt` ve `licenses/VITE-LICENSE.txt` içinde korunur. Vite lisans dosyası kendi paketine dahil bağımlılık bildirimlerini de içerir. `package-lock.json`, geliştirme araçlarının tam bağımlılık ağacını sabitler. `npm ci` ile kurulan paketlerin kendi lisans dosyaları node_modules altında yer alır; node_modules teslim ZIP'ine dahil edilmez.

Beş araç, arazi, ağaçlar, kayalar, yol, tabelalar, plaka, favicon ve sosyal paylaşım çizimi bu proje için kodla oluşturulmuştur. Dışarıdan bir GLB/glTF modeli alınmamıştır. Sesler Web Audio API ile çalışma anında sentezlenir. Harici müzik, kayıt veya ücretli API kullanılmaz. Yazı tipleri cihazın sistem fontlarıdır.

[Slow Roads](https://slowroads.io/) ve [geliştiricinin resmi Web Edition sayfası](https://topographinteractive.itch.io/slow-roads), sakin sonsuz sürüş fikrine ilham vermiştir. Referans oyunun kodu, modelleri, sesleri, ekran görüntüleri veya markası bu projeye kopyalanmamıştır. Slow Roads bu projenin sponsoru değildir.

Kaynak kodun lisansı: kökteki `LICENSE` (MIT). Node.js/Python/PowerShell, kullanıcı sistemindeki çalıştırma ortamlarıdır; teslim paketinde bu çalışma ortamlarının ikili dosyaları bulunmaz. Windows başlatıcısı sistemde bulunan PowerShell ve .NET'i kullanır.
