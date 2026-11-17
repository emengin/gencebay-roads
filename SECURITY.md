# Güvenlik politikası

GENCEBAY ROADS'un desteklenen sürümü `main` dalındaki güncel sürümdür. Üretim oyunu statik dosyalardan oluşur; oyuncu hesabı, sunucu taraflı oturum veya API anahtarı gerektirmez. Ayarlar ve yolculuk günlüğü tarayıcıda saklanır.

## Güvenlik bildirimi

Şüpheli bir açık [GitHub'ın özel güvenlik bildirimi](https://github.com/emengin/gencebay-roads/security/advisories/new) üzerinden iletilebilir. Etkilenen sürümü, tarayıcıyı ve kişisel veri içermeyen yeniden üretme adımlarını ekleyin. Açık issue veya pull request içine erişim anahtarı, parola ya da kişisel bilgi koymayın.

## Bakım ve yayın

- Kilitli bağımlılıklar `npm ci` ile kurulur; test ve `npm audit` denetiminden geçen üretim paketi yayınlanır.
- Üretim içerik güvenliği politikası dış bağlantıları, satır içi betikleri ve dinamik betik derlemeyi engeller. Vite geliştirme sunucusu üretim ortamı olarak kullanılmaz.
- GitHub Actions eylemleri tam commit kimliğine sabitlenir. Yayın yetkisi, test/derleme işinden ayrıdır.
- Yerel başlatıcılar yalnızca loopback arayüzüne bağlanır; kaynak kodu veya üst klasörler yerine `dist` dosyalarını sunar.
- `.env`, anahtar ve sertifika dosyaları kaynak depoya eklenmez. Oyuna servis anahtarı eklenmemelidir.
- Temiz bir tarama koşulsuz güvenlik garantisi değildir; yeni uyarılar ve bağımlılık güncellemeleri düzenli kontrol edilmelidir.
