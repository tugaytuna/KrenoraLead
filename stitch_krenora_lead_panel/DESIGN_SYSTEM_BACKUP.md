# Krenora Lead — Design System Backup

Bu belge, `insight_architecture/DESIGN.md`, Stitch HTML ekranları ve görsel referanslardan öğrenilen tasarım dilinin yedek kaydıdır.

## Kaynak Önceliği

Tasarım uygulanırken aşağıdaki sıra esas alınır:

1. `agents.md`, `product_architecture.md` ve `roadmap.md` içindeki ürün ve teknik kurallar değişmeden korunur.
2. `insight_architecture/DESIGN.md` kanonik tasarım sistemi ve token kaynağıdır.
3. Ekran klasörlerindeki `code.html` dosyaları yerleşim, bileşen ve etkileşim referansıdır.
4. `screen.png` dosyaları görsel sonuç ve genel kompozisyon referansıdır.

HTML prototipindeki bir değer `DESIGN.md` ile çelişirse Markdown içindeki kanonik değer tercih edilir.

## Marka Karakteri

Krenora Lead; otoriter, analitik, stratejik ve güven veren bir B2B SaaS ürünüdür. Ürün kötü işletmeleri bulmaya değil, ticari açıdan güçlü fakat dijital olarak yeterince gelişmemiş işletmeleri keşfetmeye odaklanır.

Tasarımın hissettirmesi gerekenler:

- profesyonel güven,
- veri temelli netlik,
- yüksek hızda karar alma,
- karmaşık veriyi eyleme dönüştürme,
- güçlü işletme ile dijital fırsat arasındaki denge.

Genel stil **Corporate / Modern** ve **Information Dense** olarak tanımlanır. Gösterişli dekorasyon yerine yapı, hiyerarşi ve okunabilirlik önceliklidir.

## Renk Sistemi

### Temel yüzeyler

| Token | Değer | Kullanım |
| --- | --- | --- |
| `background` | `#F7F9FB` | Uygulama arka planı |
| `surface-card` | `#FFFFFF` | Kartlar ve ana içerik yüzeyleri |
| `surface-container-low` | `#F2F4F6` | Sidebar, filtre ve ikincil yüzeyler |
| `surface-container` | `#ECEEF0` | Metrik kartları ve gruplanmış alanlar |
| `surface-container-high` | `#E6E8EA` | Hover ve yükseltilmiş nötr yüzey |
| `surface-container-highest` | `#E0E3E5` | Kontrol rayları ve daha güçlü ayrım |
| `border-subtle` | `#E2E8F0` | İnce sınırlar ve ayırıcılar |

### Metin ve nötr renkler

| Token | Değer | Kullanım |
| --- | --- | --- |
| `on-surface` | `#191C1E` | Ana metin ve başlıklar |
| `on-surface-variant` | `#45464D` | İkincil metinler |
| `text-muted` | `#64748B` | Yardımcı bilgi ve metadata |
| `outline` | `#76777D` | Güçlü kontrol sınırı |
| `outline-variant` | `#C6C6CD` | Hafif kontrol sınırı |

### Marka ve aksiyon renkleri

| Token | Değer | Kullanım |
| --- | --- | --- |
| `primary` | `#000000` | En güçlü aksiyon ve vurgu |
| `primary-container` | `#131B2E` | Fırsat skoru gibi koyu analitik yüzey |
| `secondary` | `#0058BE` | Ana aksiyon, bağlantı ve aktif veri |
| `secondary-container` | `#2170E4` | Aktif navigasyon ve güçlü mavi yüzey |
| `secondary-fixed` | `#D8E2FF` | Açık mavi bilgi etiketi |
| `primary-fixed` | `#DAE2FD` | Dekoratif ve destekleyici mavi ton |

Tasarım anlatısında Deep Navy `#0F172A` ve Vibrant Blue `#3B82F6` marka yönünü ifade eder. Mevcut uygulama tokenlarında bunların işlevini ağırlıklı olarak `#131B2E`, `#0058BE` ve `#2170E4` karşılar.

### İşlevsel renkler

| Anlam | Değer | Kullanım |
| --- | --- | --- |
| Success Emerald | `#10B981` | İşletme gücü, başarı ve sağlıklı sinyal |
| Warning Amber | `#F59E0B` | Dijital zayıflık, teknik borç ve fırsat |
| Error | `#BA1A1A` | Kritik sorun veya başarısızlık |
| Error Container | `#FFDAD6` | Hata kartı ve düşük sağlık göstergesi |

Renk tek başına anlam taşımamalıdır. Durumlar ikon, metin, nokta veya etiketle birlikte sunulmalıdır.

## Tipografi

Ana yazı tipi **Inter**'dır. Veri karşılaştırması ve teknik kimlikler için **JetBrains Mono** kullanılır.

| Rol | Font | Boyut | Ağırlık | Satır yüksekliği |
| --- | --- | --- | --- | --- |
| `headline-lg` | Inter | 32px | 700 | 40px |
| `headline-md` | Inter | 24px | 600 | 32px |
| `headline-sm` | Inter | 18px | 600 | 24px |
| `body-lg` | Inter | 16px | 400 | 24px |
| `body-md` | Inter | 14px | 400 | 20px |
| `body-sm` | Inter | 13px | 400 | 18px |
| `label-caps` | Inter | 11px | 600 | 16px |
| `data-mono` | JetBrains Mono | 13px | 500 | 16px |
| `headline-lg-mobile` | Inter | 24px | 700 | 32px |

Kurallar:

- Büyük başlıklarda sıkı harf aralığı kullanılır.
- Skorlar, yüzdeler, Place ID, teknik durum kodları ve kıyaslanan sayılar `data-mono` rolünü kullanır.
- Küçük büyük-harf etiketleri yalnızca metadata ve bölüm sınıflandırması için kullanılır.
- Veri yoğun ekranlarda okunabilirlik dekoratif tipografiden önce gelir.

## Yerleşim ve Aralık

- Aralık sistemi 4px/8px tabanına oturur.
- Ana grid aralığı `24px` (`gutter: 1.5rem`) değeridir.
- Masaüstü dış marjı `32px`, mobil dış marjı `16px` değeridir.
- İlişkili öğeler arasında `8px`, bileşen içi ana gruplarda `16px`, ayrı bölümlerde `32px` tercih edilir.
- Maksimum içerik genişliği `1440px` değeridir.
- Masaüstünde 12 kolon, tablette 8 kolon, mobilde 4 kolon kullanılır.
- Masaüstü sidebar genişliği `280–288px`, üst bar yüksekliği `64px` değeridir.
- Tablet görünümünde sidebar ikon rayına veya drawer yapısına dönüşür.
- Mobil görünümde veri tabloları Lead Card yapısına dönüşür.

## Köşe Yuvarlaklığı

Kanonik değerler:

| Token | Değer |
| --- | --- |
| `rounded-sm` | `2px` |
| `rounded` | `4px` |
| `rounded-md` | `6px` |
| `rounded-lg` | `8px` |
| `rounded-xl` | `12px` |
| `rounded-full` | `9999px` |

- Standart buton, input ve küçük kartlarda 4px kullanılır.
- Büyük detay kartları ve modallarda 8–12px kullanılabilir.
- CRM durumları ve kısa durum etiketleri pill biçimindedir.
- Arayüz aşırı yuvarlak ve oyuncak hissi vermemelidir.

## Yükseklik ve Derinlik

Derinlik ağır gölgeler yerine tonal katmanlarla oluşturulur:

1. Base: nötr uygulama arka planı.
2. Card: beyaz yüzey ve `1px #E2E8F0` sınır.
3. Dropdown/Modal: beyaz yüzey ve `0 4px 12px rgba(15, 23, 42, 0.08)` gölge.

Kart hover durumlarında çok hafif yükselme veya gölge artışı kullanılabilir. Veri yoğun ekranlarda yoğun gölge kullanılmaz.

## Ortak Uygulama Kabuğu

- Sol tarafta sabit Krenora navigasyonu bulunur.
- Navigasyon sırası: Dashboard, Lead Explorer, Search, Scans; Settings en altta yer alır.
- Aktif navigasyon öğesi mavi yüzey, beyaz metin ve ikonla gösterilir.
- Üst bar yarı saydam açık yüzey, hafif blur, ürün adı, plan rozeti ve profil avatarı içerir.
- İkon sistemi Material Symbols Outlined'dır.
- Logo; koyu lacivert `K` formu ile mavi veri/ağ düğümlerini birleştirir.

## Bileşen Kuralları

### Butonlar ve inputlar

- Birincil aksiyonlar dolu mavi veya çok güçlü aksiyonlarda koyu yüzey kullanır.
- İkincil aksiyonlar nötr yüzey veya ince sınır kullanır.
- Input focus durumu mavi ring veya mavi sınırla belirtilir.
- Hover hareketleri kısa, ölçülü ve dikkat dağıtmayacak şekilde uygulanır.

### Fırsat skoru

- 0–100 skor dairesel gösterge, güçlü kare veya büyük koyu skor kartıyla sunulabilir.
- Yüksek fırsat skoru mavi vurgu kullanır.
- İşletme gücü emerald, dijital fırsat/eksiklik amber ile gösterilir.
- Skorun bileşenleri her zaman açıklanabilir olmalıdır: Business Strength, Digital Opportunity/Weakness, Commercial Potential ve Contactability.

### Veri tabloları

- Yatay ayırıcı ağırlıklı, yüksek yoğunluklu tablo düzeni kullanılır.
- Satır hover rengi çok açık gri `#F1F5F9` civarında olmalıdır.
- İşletme, kategori/lokasyon, Google verisi, fırsat skoru, önerilen hizmetler ve CRM durumu kolay taranmalıdır.
- Sayısal ve karşılaştırmalı alanlar mümkün olduğunca hizalı olmalıdır.

### Durum göstergeleri

- CRM durumları küçük renkli nokta ve `label-caps` metinle gösterilir.
- Büyük ve renkli durum butonlarının arayüzü domine etmesine izin verilmez.
- Running durumunda amber ve ölçülü animasyon; completed durumunda emerald kullanılır.

### Filtreler

- Filtreler kompakt, gruplanmış ve ana veri görünümünden ayrılmadan kullanılabilir olmalıdır.
- Kategori, konum, rating, review count ve score range temel filtrelerdir.
- Seçili değerler chip/pill biçiminde gösterilebilir.

## Ekran Kalıpları

### Dashboard

- Toplam kuruluş, yüksek fırsat, aktif tarama, tamamlanan işler ve ortalama skor metrikleri.
- Discovery Velocity grafiği.
- Worker operasyon ilerlemesi ve tahmini kalan süre.
- Sağ tarafta skora göre sıralı Top Opportunities listesi.

### Lead Explorer

- Üstte ekran başlığı ve kısa açıklama.
- Sol tarafta kompakt filtre paneli.
- Sağda arama, sonuç sayısı, yüksek yoğunluklu tablo ve sayfalama.
- Fırsat skorları dairesel progress göstergesiyle sunulur.
- Önerilen hizmetler küçük etiketler halinde gösterilir.

### Lead Detail

- İşletme adı, kategori, rating, review count, lokasyon ve website özeti.
- Güçlü Opportunity Score kartı ve dört parçalı skor dökümü.
- Yapılandırılmış AI Opportunity Analysis.
- Website Health & Technology bölümü.
- Detected Technologies ve Missing Critical Stack ayrımı.
- Recommended Services ve hafif CRM Activity paneli.

### Search / Discovery

- Target Geography & Scope.
- Industry & Quality Filters.
- Data Sources ve Requirements.
- Belirgin Start Discovery Job aksiyonu.
- Tahmini sonuç sayısı ve süre bilgisi.
- Recent Discovery Jobs kartları ve durumları.

## Hareket ve Etkileşim

- Sayfa açılışında kısa `fade-in` ve hafif dikey hareket kullanılabilir.
- Çalışan işlemlerde pulse veya shimmer kullanılabilir.
- Kart hover hareketi en fazla birkaç piksel olmalıdır.
- Etkileşimler bilgi yoğunluğunu veya veri okunabilirliğini azaltmamalıdır.
- Animasyonlar sistem durumunu açıklamalı ya da etkileşim geri bildirimi sağlamalıdır.

## Ürün Kurallarıyla Tasarım Uyumu

- Arayüz "kötü işletme" anlatısı kurmamalıdır.
- Yüksek iş gücü ile dijital eksiklik birlikte fırsat olarak gösterilmelidir.
- "Takip kodu tespit edilmedi" ifadesi, işletmenin kesinlikle reklam vermediği şeklinde sunulmamalıdır.
- Eski veriler gerçek zamanlıymış gibi gösterilmemeli; tarama ve analiz zamanları görünür olmalıdır.
- AI açıklaması deterministik skorun yerine geçmemeli, skoru yorumlamalıdır.
- İş akışları uzun süren işleri eşzamanlı bekletmemeli; job ilerlemesi görünür olmalıdır.
- Bir işletmenin analizi başarısız olduğunda tüm batch başarısız görünmemelidir.

## Uygulama Kontrol Listesi

- [ ] Teknik ve ürün kuralları korunuyor.
- [ ] Kanonik renk ve tipografi tokenları kullanılıyor.
- [ ] Sayısal veriler gerektiğinde JetBrains Mono ile gösteriliyor.
- [ ] Bilgi hiyerarşisi yoğun fakat taranabilir.
- [ ] Renkler ikon ve metinle destekleniyor.
- [ ] Desktop, tablet ve mobile davranışları düşünülüyor.
- [ ] Tablo mobilde kartlara dönüşüyor.
- [ ] Job ilerlemesi ve veri güncelliği görünür.
- [ ] Skor bileşenleri açıklanabilir.
- [ ] AI içeriği yapılandırılmış ve ikincil yorum katmanı olarak sunuluyor.

