# Krenora Lead Intelligence Platform

Krenora, ticari açıdan güçlü ancak dijital altyapısı gelişime açık yerel işletmeleri keşfetmek ve önceliklendirmek için geliştirilen bir B2B lead intelligence platformudur.

## Başlangıç

```bash
npm install
npm run dev
```

Web uygulaması varsayılan olarak `http://localhost:3000` adresinde çalışır.

## Yapı

- `apps/web`: Next.js App Router kullanıcı arayüzü
- `apps/worker`: uzun süren discovery, crawl ve analiz işleri için worker sınırı
- `packages/database`: Supabase repository ve kuyruk işlemleri
- `packages/discovery`: provider bağımsız keşif orkestrasyonu
- `packages/sources`: harici veri kaynağı adaptörleri
- `packages/verticals`: bağımsız ve versiyonlu sektör modülleri
- `packages/lead-engine`: kaynaklar arası normalizasyon sınırı
- `packages/shared`: ortak domain tipleri ve şemaları
- `packages/scoring`: deterministik ve versiyonlanabilir fırsat skoru

Arayüz, ortam değişkenleri yokken kontrollü örnek veriyle çalışır. Supabase ve Google Places tanımlandığında keşif formu kullanıcı kapsamındaki işleri kuyruğa yazar; ayrı worker bu işleri sahiplenir, sonuçları normalize eder ve kaynak iziyle saklar.

## Supabase bağlantısı

1. `.env.example` dosyasını hem kökte `.env`, hem `apps/web/.env.local` olarak kopyalayın.
2. Supabase proje URL'sini ve publishable key değerini girin.
3. `supabase/migrations` altındaki migration'ı Supabase projesine uygulayın.
4. Uygulamayı yeniden başlatın.

Gerekli istemci değişkenleri:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Bu değerler yoksa uygulama demo modunda çalışır. Tanımlandıklarında cookie tabanlı Supabase SSR oturumu, route koruması ve RLS kapsamındaki gerçek organization repository otomatik olarak etkinleşir.

Keşif worker'ı için kök `.env` dosyasında ayrıca şunlar gerekir:

```bash
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_PLACES_API_KEY=...
```

Web ve worker süreçlerini iki terminalde çalıştırın:

```bash
npm run dev
npm run dev:worker
```

Google Places `place_id` en güçlü provider kimliğidir. Entity resolution ayrıca normalize domain ve telefonu güçlü sinyal; e-posta, ad+adres ve ad+konumu kontrollü sinyal olarak değerlendirir. Yalnızca işletme adına bakarak otomatik birleştirme yapılmaz; belirsiz eşleşmeler inceleme kuyruğuna yazılır. Kuyruk sahiplenme ve eşleştirme uygulama işlemleri veritabanında atomiktir; geçici API hataları en fazla üç denemeyle yeniden planlanır.

Migration'ı Supabase CLI ile uygulamak için:

```bash
npx supabase link --project-ref PROJECT_REF
npx supabase db push
```
