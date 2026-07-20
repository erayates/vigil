# VIGIL — Art Brief (tüm görsel ihtiyaçlar)

Uygulamanın ihtiyaç duyduğu **bütün** görsel varlıkların tek listesi: ne olduğu,
nerede kullanıldığı, hangi ölçü/formatta gerektiği ve hangi kuralların
değişmemesi gerektiği.

- Kaynak-doğruluk: `docs/assets/asset-registry.yaml` (durum/provenance orada tutulur)
- Görsel yön referansı: `docs/assets/legio-focus-ui-reference.png` (`REF-UI-001`)
- Teslim kuralları: `docs/agent/asset-request-protocol.md`

> Şu anda uygulamadaki **tüm** görseller `scripts/generate_pixel_assets.py` ile
> üretilmiş **scaffold (placeholder)** varlıklardır. Aşağıdakiler onların yerine
> geçecek production varlıklarıdır.

---

## 0. Özet tablo

### Uygulama içi

| ID                 | Ne                                | Öncelik | Bloke ettiği iş   |
| ------------------ | --------------------------------- | ------- | ----------------- |
| `PROD-COMP-001`    | Companion (legionary) sprite      | Yüksek  | Art-lock, v0.5.0  |
| `PROD-UI-001`      | UI kit (çerçeve/buton/ikon)       | Yüksek  | Art-lock, v0.5.0  |
| `PROD-CAMP-001`    | Kamp büyüme sahnesi               | Orta    | **VIGIL-029**     |
| `PROD-COMP-002`    | Kozmetik ekipman overlay'leri     | Orta    | **VIGIL-030**     |
| `PROD-RANK-001`    | Rütbe rozetleri (8) — opsiyonel   | Düşük   | —                 |
| `PROD-ONBOARD-001` | Onboarding + boş durum görselleri | Orta    | v0.5.0 onboarding |
| `PROD-FONT-001`    | Tipografi (lisans!) — opsiyonel   | Orta    | v0.5.0 brand lock |

### Marka ve dağıtım

| ID                 | Ne                              | Öncelik | Bloke ettiği iş    |
| ------------------ | ------------------------------- | ------- | ------------------ |
| `PROD-BRAND-001`   | Marka, uygulama/tepsi ikonu     | Yüksek  | v0.5.0 brand lock  |
| `PROD-INSTALL-001` | Kurulum sihirbazı görselleri    | Orta    | v0.5.0 dağıtım     |
| `PROD-STORE-001`   | Marketplace / mağaza kiti       | Orta    | v0.8.0 public beta |
| `PROD-WEB-001`     | Web, sosyal, doküman görselleri | Düşük   | v0.8.0 public beta |
| `PROD-AUDIO-001`   | Ses seti (görsel değil)         | Düşük   | —                  |

> Mağaza ve web görselleri **art-lock'tan sonra** üretilmeli: scaffold ekranlarla
> mağaza görseli çekilemez.

---

## 1. Global pixel-art kuralları (hepsi için geçerli)

- **Pixel-art**, nearest-neighbour ile tam sayı (2×, 3×, 4×) ölçeklenebilir olmalı.
  Ara ton/anti-alias kenarları ölçeklemede bulanıklaşır.
- **Tek palet:** companion, kamp ve kozmetikler **aynı paleti** paylaşmalı.
- **Saydam arka plan** (belirtilen istisnalar dışında). Sahne dışına arka plan
  "bake" edilmemeli.
- **Fonksiyonel metin gömülmemeli.** Tüm yazılar canlı HTML (çeviri + erişilebilirlik
  için). Süsleme amaçlı yazı (ör. bayraktaki "SPQR") olabilir.
- **Kaynak dosya** (Aseprite/PSD, katmanlı) + **PNG export** birlikte gelmeli.
  Kaynak `assets/source/` altında değiştirilmeden saklanır.

---

## 2. `PROD-COMP-001` — Companion (legionary) sprite seti

**Nerede:** İki yerde aynı karakter —
ana pencerede sağdaki companion paneli (büyük) ve ayrı, her zaman üstte duran
şeffaf companion penceresi (küçük).

| Özellik    | Değer                                              |
| ---------- | -------------------------------------------------- |
| Kare ölçü  | **64 × 96 px**                                     |
| Kare/durum | **en az 4** (döngüsel idle animasyonu)             |
| Sheet      | Durum başına 1 yatay sheet → **256 × 96** (4 × 64) |
| Format     | Saydam PNG + katmanlı kaynak                       |

**Gereken durumlar (8):**

| Durum         | Ne zaman görünür                            |
| ------------- | ------------------------------------------- |
| `idle`        | Görev tanımlanmamış, bekleme                |
| `preparing`   | Başlat'a basıldı, sayaç henüz başlamadı     |
| `focusing`    | Odak nöbeti sürüyor                         |
| `paused`      | Duraklatıldı                                |
| `short-break` | Kısa mola                                   |
| `long-break`  | Uzun mola                                   |
| `complete`    | Nöbet tamamlandı / debrief                  |
| `reform`      | Yarıda bırakıldı (utandırmayan, nötr duruş) |

**Değişmemesi gerekenler:** durumlar arası tutarlı anatomi ve ekipman, aynı palet,
zemine oturma hizası (durum değişince karakter zıplamamalı).

---

## 3. `PROD-COMP-002` — Kozmetik ekipman overlay'leri

**Nerede:** İlerlemeyle açılan kozmetikler (VIGIL-030). Rastgele veya paralı
değil — sadece tamamlanan nöbetlerden kazanılır.

| Özellik  | Değer                                                                             |
| -------- | --------------------------------------------------------------------------------- |
| Ölçü     | **64 × 96 px**, companion kareleriyle **kare-kare hizalı**                        |
| Format   | Saydam PNG **overlay katmanları** + katmanlı kaynak                               |
| Parçalar | `helmet-crest` (miğfer tüyü), `shield-emblem` (kalkan amblemi), `cloak` (pelerin) |

**Kritik:** Overlay'ler base companion'ı **içermemeli** (sadece eklenen parça,
saydam zeminde). Her overlay, companion'ın tüm durum/karelerine hizalanmalı —
yoksa animasyonda kayar.

---

## 4. `PROD-CAMP-001` — Kamp büyüme sahnesi

**Nerede:** Companion panelinin arka planı. Biriken ilerlemeyi (Disciplina)
büyüyen bir kamp olarak gösterir (VIGIL-029).

| Özellik     | Değer                                                                             |
| ----------- | --------------------------------------------------------------------------------- |
| Hedef kutu  | **410 × 460 CSS px** (1600×900 baseline)                                          |
| Kaynak ölçü | Önerilen **104 × 116 px** (4× → 416×464). Farklı verirsen layout'u ona uydururum. |
| Format      | Saydam PNG (aşama başına 1 dosya) + katmanlı kaynak                               |

**Aşamalar (eklemeli):**

| Aşama | İçerik                |
| ----- | --------------------- |
| 1     | Boş arazi             |
| 2     | + ilk çadır           |
| 3     | + palisad (kazık çit) |
| 4     | + gözetleme kulesi    |
| 5     | + tam kamp            |

**Kritik:** Her aşama **o ana kadarki her şeyi** içerir (stage-3 = çadır + palisad).
5 görselin **canvas'ı ve yerleşimi birebir aynı** olmalı, yoksa aşama değişince
sahne zıplar. Aşama sayısı esnektir — **3 aşama da yeterli** (eşikleri ona göre bölerim).

---

## 5. `PROD-UI-001` — Roman pixel UI kit

**Nerede:** Uygulamanın tüm kabuğu. Şu an hepsi scaffold.

### 5.1 Çerçeveler (9-slice)

| Dosya             | Nerede                               |
| ----------------- | ------------------------------------ |
| `outer-frame`     | Tüm pencerenin dış çerçevesi         |
| `parchment-frame` | Odak paneli (açık parşömen zemin)    |
| `stone-frame`     | Kampanya paneli (taş zemin)          |
| `dark-frame`      | İlerleme/özet panelleri (koyu zemin) |
| `red-tab-frame`   | Aktif sekme (üstteki FOCUS sekmesi)  |

**Kural:** 9-slice olarak ölçeklendiğinde **köşeler bozulmamalı**. Kaynağı
büyük ver (ör. 3×) ve slice inset'ini (kaç px köşe) belirt.

### 5.2 Dokular (seamless tile)

| Doku               | Nerede                      |
| ------------------ | --------------------------- |
| `stone-wall-tile`  | Uygulama arka planı         |
| `red-marble-tile`  | Üst başlık şeridi           |
| `parchment-tile`   | Odak paneli zemini          |
| `column-hall-tile` | Companion paneli arka planı |
| `stone-floor-tile` | Companion paneli zemini     |
| `dark-stone-tile`  | Koyu paneller               |

**Kural:** Dört yönde **sorunsuz tekrar** (seamless) etmeli.

### 5.3 Butonlar

Dört renk varyantı: **yeşil** (Start/Record), **kahve** (Pause), **turuncu**
(Reset), **mor/gri** (Skip). Her biri için **5 durum**:
`default`, `hover`, `pressed`, `disabled`, `keyboard-focus`.

**Kural:** Klavye odak göstergesi süslü çerçeve üstünde bile **görünür** olmalı
(erişilebilirlik gereği).

### 5.4 Süslemeler (ornaments)

Defne dalı (metin yanları), elmas/rozet ayraçları, panel şerit uçları,
SPQR sancağı, mangal/alev, öncelik kalkanları (yüksek/orta/düşük),
görev onay kutusu, bayrak.

### 5.5 İkonlar

Şu an hepsi metin karakteri (glyph) olarak duruyor; production'da gerçek ikon olmalı:

| İkon               | Anlam                                  | İkon      | Anlam                |
| ------------------ | -------------------------------------- | --------- | -------------------- |
| Odak               | Focus sekmesi                          | Kahve     | Kısa mola            |
| Ev/çadır           | Uzun mola                              | Grafik    | İstatistikler        |
| Dişli              | Ayarlar                                | Kum saati | Odak süresi          |
| Bayrak             | Kampanya ilerlemesi                    | Alev/ısı  | Disciplina           |
| Takvim/liste       | Bu hafta                               | Elmas     | Tıklama-geçirgenliği |
| ▶ / ‖ / ↻ / ▶▶ / ✔ | Başlat, duraklat, sıfırla, atla, bitir | ＋        | Ekle                 |

Ölçü: **16×16** ve **32×32** (integer-scale), saydam PNG.

---

## 6. `PROD-BRAND-001` — Marka ve uygulama ikonu

**Nerede:** Başlıktaki marka kilidi, tepsi (tray) ikonu, uygulama ikonu, kurulum paketi.

| İhtiyaç               | Ölçü / format                           |
| --------------------- | --------------------------------------- |
| Kare uygulama işareti | **32, 64, 128, 256, 512 px** saydam PNG |
| Windows ikonu         | `.ico` (32/48/256 içerecek şekilde)     |
| macOS ikonu           | `.icns` (ileride)                       |
| Wordmark/logo         | Vektör (SVG) veya onaylı pixel master   |

**Karar gereken:** nihai isim (**VIGIL** mi başka mı), wordmark yazımı, slogan
("DISCIPLINA · FOCUS · VICTORIA" kalsın mı), izinli renk varyantları.

---

## 7. `PROD-AUDIO-001` — Ses seti (görsel değil, tamamlık için)

`focus-start`, `focus-complete`, `short-break`, `long-break`, `subtle-button` —
WAV, normalize edilmiş, agresif savaş efekti olmayan, sahibi/lisansı belli.

---

## 8. `PROD-RANK-001` — Rütbe rozetleri _(opsiyonel)_

**Nerede:** Disciplina ile kazanılan 8 rütbe. Şu an sadece metin + Roma rakamı
gösteriliyor (özet şeridi ve companion sancağı).

| Özellik | Değer                                                                        |
| ------- | ---------------------------------------------------------------------------- |
| Ölçü    | **32 × 32** ve **64 × 64** saydam PNG                                        |
| Adet    | 8: Tiro, Miles, Immunis, Decanus, Tesserarius, Optio, Centurio, Primus Pilus |

**Kural:** rütbeler yükseldikçe görsel ağırlık artmalı, ama hiçbiri "kaybetme/ceza"
hissi vermemeli (progression guardrail'leri). **Vermezsen** mevcut metin gösterimi
kalır — bu varlık zorunlu değil.

---

## 9. `PROD-ONBOARD-001` — İlk çalıştırma ve boş durum görselleri

**Nerede:** v0.5.0 onboarding turu + veri yokken görünen ekranlar.

| Görsel                         | Nerede                                       |
| ------------------------------ | -------------------------------------------- |
| Karşılama / tanıtım (2–3 adım) | İlk açılışta                                 |
| "Henüz nöbet yok"              | Geçmiş ve haftalık özet boşken               |
| "Kamp henüz kurulmadı"         | Kamp sahnesi ilk aşamadan önce _(opsiyonel)_ |

Saydam PNG, aynı palet, metin gömülmeden (yazılar HTML).

---

## 10. `PROD-FONT-001` — Tipografi _(opsiyonel ama önemli)_

**Şu an:** sistem fontları — `Georgia` (gövde) ve `Consolas` (sayaç/etiketler).
Pixel-art kabukla tam uyumlu değil.

| İhtiyaç           | Not                                                          |
| ----------------- | ------------------------------------------------------------ |
| Başlık / wordmark | Pixel veya Roma-serif karakterli                             |
| Gövde             | Küçük puntoda okunur; **Türkçe karakterler** (ğ ş ı İ ö ü ç) |
| Sayaç (rakamlar)  | **Sabit genişlik** — rakam değişince zıplamamalı             |

**⚠️ Lisans kritik:** font uygulamayla dağıtılacaksa **gömme (embedding) ve yeniden
dağıtım izni** olmalı; lisans belgesi dosyayla birlikte gelmeli. **Alternatif:**
sistem fontlarıyla devam — sıfır lisans riski, ek maliyet yok.

---

## 11. `PROD-INSTALL-001` — Kurulum paketi görselleri

**Nerede:** Windows kurulum sihirbazı (Tauri NSIS/MSI). Şu an varsayılan görünüm
kullanılıyor — markasız.

| Görsel                         | Ölçü                          |
| ------------------------------ | ----------------------------- |
| NSIS üst banner                | **150 × 57 px**               |
| NSIS karşılama/bitiş kenarı    | **164 × 314 px**              |
| MSI (WiX) banner               | **493 × 58 px**               |
| MSI iletişim kutusu arka planı | **493 × 312 px**              |
| Kurulum ikonu                  | `.ico` (`PROD-BRAND-001`'den) |

**Kural:** metin gömülmemeli (yerelleştirme), düşük çözünürlükte okunur kalmalı.

---

## 12. `PROD-STORE-001` — Marketplace / mağaza kiti

**⚠️ Önce senden karar gerekiyor: hangi kanaldan dağıtacaksın?** Gereken ölçüler
kanala göre değişir; kanal netleşmeden bu varlık spesifik hâle gelmez.

| Kanal                    | Gereken görseller                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Microsoft Store**      | Store logo 300×300; kutucuklar 71×71, 150×150, 310×150, 310×310; splash 620×300; ekran görüntüleri min 1366×768 (4–6 adet) |
| **itch.io**              | Kapak 630×500 (min 315×250); banner; ekran görüntüleri; GIF önizleme                                                       |
| **Steam** _(ileride)_    | Header 460×215; küçük kapsül 231×87; ana kapsül 616×353; kütüphane 600×900; hero 3840×1240                                 |
| **Kendi siten / GitHub** | Hero görseli + ekran görüntüleri (bkz. §13)                                                                                |

**Ortak kural:** ekran görüntüleri **gerçek uygulamadan**, **art-lock sonrası**
alınmalı. Scaffold ekranlarla mağaza görseli üretilmez.

---

## 13. `PROD-WEB-001` — Web, sosyal ve doküman görselleri

| Görsel                       | Ölçü                                        |
| ---------------------------- | ------------------------------------------- |
| Sosyal önizleme (OG/Twitter) | **1200 × 630 px**                           |
| Favicon                      | **16, 32, 48 px** + `.ico`                  |
| README / landing hero        | ~**1280 × 640 px**                          |
| Özellik anlatım görselleri   | Gerçek ekran görüntüleri (art-lock sonrası) |

---

## 14. Şu an yerine geçilecek placeholder'lar

| Placeholder                                     | Yerine geçecek                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `public/assets/pixel/legionary-*.png` (6 sheet) | `PROD-COMP-001`                                                                                         |
| `public/assets/ui/frames/*.png` (4)             | `PROD-UI-001`                                                                                           |
| `public/assets/ui/textures/*.png` (6)           | `PROD-UI-001`                                                                                           |
| `public/assets/brand/vigil-mark-*.png` (4)      | `PROD-BRAND-001`                                                                                        |
| `src-tauri/icons/*` (ico/icns/png)              | `PROD-BRAND-001`                                                                                        |
| Sistem fontları (Georgia / Consolas)            | `PROD-FONT-001` _(istersen)_                                                                            |
| Tauri varsayılan kurulum sihirbazı              | `PROD-INSTALL-001`                                                                                      |
| (yok — henüz üretilmedi)                        | `PROD-CAMP-001`, `PROD-COMP-002`, `PROD-RANK-001`, `PROD-ONBOARD-001`, `PROD-STORE-001`, `PROD-WEB-001` |

---

## 15. Teslim

1. Kaynak dosyaları (Aseprite/PSD) + PNG export'ları birlikte gönder.
2. Kaynak `assets/source/` altında **değiştirilmeden** saklanır; uygulama export'ları
   `public/assets/` altına belgelenmiş bir dönüştürme adımıyla üretilir.
3. Registry'ye checksum, ölçü, provenance işlenir; varlık önce
   `supplied-pending-review`, sen onaylayınca `approved` olur.
4. Onaydan sonra görsel regresyon baseline'ları yenilenir.

**Kısmi teslim olur:** tek bir varlığı (ör. sadece `PROD-CAMP-001`) göndermen
o işi (VIGIL-029) açar; diğerleri beklemeye devam eder.
