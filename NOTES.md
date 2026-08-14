# Proje Notları

Bu dosya, `fs-builder` projesinin ilerlemesini ve hedeflerini takip etmek için kullanılır.

## Ana Konsept

fs-builder, kullanıcıların sürükle-bırak editörü kullanarak tam donanımlı web uygulamaları oluşturmasına olanak tanıyan, masaüstü (Tauri) ve web tabanlı bir görsel oluşturucudur.

**Teknoloji Yığını:**
- Frontend: React + TypeScript + Vite
- Stil Sistemi: **Native Tailwind CSS** (Tailwind Play CDN ile canlı derleme)
- Masaüstü: Tauri
- State & Mantık: Performans odaklı ve modüler

---

## Tamamlanan Adımlar

### Adım 1: UI Şema Tanımı
- Her eleman için `id`, `type`, `props`, `children` içeren temel bir şema yapısı TypeScript arayüzleri kullanılarak oluşturuldu.
- Başlangıç olarak `container`, `text`, ve `button` tipleri tanımlandı.

### Adım 2: Basit React Renderer
- Tanımlanan şemayı alıp React elemanlarına dönüştüren bir renderer bileşeni (`ElementRenderer.tsx`) oluşturuldu.

### Adım 3: Editör State Yönetimini Tanıtma
- Şemayı React state'i içinde depolamak.
- Eleman eklemek, güncellemek ve kaldırmak için fonksiyonlar sağlamak.

### Adım 4: Özellikler (Properties) Sistemi
- **Durum**: Tamamlandı.
- **Açıklama**: 3. Adım'da yazılan `updateElement` fonksiyonu bu adımı karşıladığı için ek bir kod yazılmadı.

### Adım 5: Eleman Seçim Mantığı
- **Durum**: Tamamlandı.
- **Açıklama**: Tıklanan elemanı `selectedElementId` state'inde saklama ve seçili elemanı görsel olarak ayırt etme mantığı eklendi.

### Adım 6: Minimal Özellikler Paneli
- **Durum**: Tamamlandı.
- **Açıklama**: `PropertiesPanel.tsx` adında yeni bir bileşen oluşturuldu. Bu panel sadece bir eleman seçildiğinde görünür ve seçilen elemanın özelliklerinin düzenlenmesine olanak tanır.

### Adım 7: Okunabilirlik ve Eleman Ekleme
- **Durum**: Tamamlandı.
- **Açıklama**: CSS basitleştirilerek tutarlı bir aydınlık tema sağlandı ve yeni eleman eklemek için bir "Toolbox" paneli eklendi.

### Adım 8: Konteyner ve İç İçe Yerleştirme (Nesting)
- **Durum**: Tamamlandı.
- **Açıklama**: "Toolbox" paneline "Konteyner Ekle" butonu eklendi. Yeni eleman ekleme mantığı güncellendi: Eğer bir konteyner seçiliyse, yeni eleman onun içine eklenir; değilse ana yapıya eklenir.

### Adım 9: Konteynerler için Minimal Düzen (Layout) Özellikleri
- **Durum**: Tamamlandı.
- **Açıklama**: Konteyner elemanları için `direction` ('vertical' | 'horizontal') ve `gap` (number) özellikleri eklendi. Bu özellikler `PropertiesPanel` üzerinden düzenlenebilir ve `ElementRenderer` bileşeni tarafından flexbox stilleri olarak uygulanır.

### Adım 10: Basit HTML Dışa Aktarma (Export)
- **Durum**: Tamamlandı.
- **Açıklama**: Mevcut şemayı statik bir HTML dosyasına dönüştüren temel bir dışa aktarma özelliği eklendi. Bu özellik, hiyerarşiyi ve temel düzeni (flexbox) korur. `App.tsx` içine bir "Export HTML" butonu eklendi.

### Adım 11: Geliştirilmiş HTML Dışa Aktarma (Stil Uyumu)
- **Durum**: Tamamlandı.
- **Açıklama**: HTML dışa aktarma sistemi, editördeki görsel görünümü daha doğru bir şekilde yansıtacak şekilde iyileştirildi. Gerekli tüm stiller artık dışa aktarılan dosyanın içine bir `<style>` etiketi olarak gömülerek, dosyanın tek başına açıldığında tutarlı görünmesi sağlandı.

### Adım 12: Konteyner Görsel Netliğinin İyileştirilmesi
- **Durum**: Tamamlandı.
- **Açıklama**: Konteyner elemanlarının hem editörde hem de dışa aktarılan HTML'de görsel olarak daha belirgin olması sağlandı. Konteynerlere dolgu (padding), arka plan rengi, kenarlık ve yuvarlak köşeler eklenerek bölümlerin daha net ayırt edilmesi hedeflendi.

### Adım 13: Konteyner Düzen Özelliklerini Düzenlenebilir Hale Getirme
- **Durum**: Tamamlandı.
- **Açıklama**: Konteyner düzen özellikleri (`direction`, `gap`, `padding`) artık `PropertiesPanel` üzerinden düzenlenebilir hale getirildi. Bu değişiklikler anında editör önizlemesine yansır ve dışa aktarılan HTML'de de korunur.

### Adım 14: Güvenli Eleman Silme
- **Durum**: Tamamlandı.
- **Açıklama**: `PropertiesPanel`'e, seçili bir eleman olduğunda görünen bir "Delete Element" butonu eklendi. Bu buton, mevcut silme mantığını kullanarak bir elemanı ve tüm alt elemanlarını şemadan güvenli bir şekilde kaldırır. Kök elemanın silinmesi engellenmiştir ve bir eleman silindikten sonra seçim durumu temizlenir.

### Adım 15: Modern Editör Düzeninin ve Tema Altyapısının Kurulması
- **Durum**: Tamamlandı.
- **Açıklama**: Editör arayüzü, profesyonel görsel IDE'lere ve tasarım araçlarına (Figma, VS Code vb.) benzer şekilde dört bölgeli bir grid layout'a (`index.css`, `App.css`) taşındı:
  - **Header (Üst):** Logo/Proje başlığı, Dark/Light tema değiştirme butonu ve "Export HTML" butonu.
  - **Sol Sidebar:** Üst kısımda "Toolbox" (Container, Text, Button ekleme butonları), alt kısımda "Layers" paneli.
  - **Merkez Canvas (Önizleme):** Kullanıcının oluşturduğu web sayfasının önizlemesini gösteren, izole edilmiş bir alan. `ElementRenderer` bileşeni burada render edilir.
  - **Sağ Sidebar:** Seçili elemanın özelliklerini düzenlemek için `PropertiesPanel` bileşeni.
- CSS Variables (`--bg-main`, `--bg-sidebar`, `--border-color`, `--text-main`, `--accent-color`, vb.) kullanılarak Dark (varsayılan, True Black / Neutral Gray) ve Light olmak üzere iki temalı bir sistem entegre edildi.
- **Kritik Kazanım:** Merkez Canvas/Önizleme alanı, tema sisteminden tamamen izole edildi.

### Adım 16: İnteraktif Katmanlar Paneli (DOM Ağacı Görünümü)
- **Durum**: Tamamlandı.
- **Açıklama**: Rekürsif DOM ağacı, çift yönlü seçim senkronizasyonu, expand/collapse kontrolleri, tip göstergeleri.

### Adım 17: Gelişmiş Text ve Button Özellikleri (Properties System)
- **Durum**: Tamamlandı.
- **Açıklama**: Font size, color, weight, align, padding, border-radius, background-color kontrolleri.

### Adım 18: Katmanlar Üzerinden Sürükle-Bırak (Layers Drag & Drop)
- **Durum**: Tamamlandı.
- **Açıklama**: HTML5 native Drag & Drop ile yeniden sıralama, drop zone algılama, circular drop koruması.

### Adım 19: Gelişmiş Canvas Viewport & Alt Araç Barı
- **Durum**: Tamamlandı.
- **Açıklama**: Pan/Zoom, Floating Selection Badge, Copy/Paste motoru, dot grid arka planı.

### Adım 20: Canlı Kod Önizleme ve HTML/CSS Ayrıştırma Motoru
- **Durum**: Tamamlandı.
- **Açıklama**: CodePanel, syntax highlighting, CSS Class Generation, ZIP Export.

### Adım 21: Native Tailwind CSS Mimarisine Geçiş (Option B Pivot)
- **Durum**: Tamamlandı.
- **Açıklama**: Tailwind Play CDN entegrasyonu, `tailwindClasses` şema alanı, ElementRenderer Tailwind dönüşümü.

### Adım 22: Tailwind Tabanlı Properties Paneli & Pure Exporter Motoru
- **Durum**: Tamamlandı.
- **Açıklama**: `tw.ts` utility modülü, Tailwind class toggle kontrolleri, pure Tailwind HTML export, `class-exporter.ts` yeniden yazımı.

### Adım 23: Akıllı HTML-to-Tailwind Kod İthalatçısı (Smart Importer)
- **Durum**: Tamamlandı.
- **Açıklama**: Harici Tailwind bileşenlerini (Tailwind UI, Flowbite vb.) doğrudan canvas'a aktarmak için kapsamlı bir HTML ayrıştırma ve şema dönüştürme motoru geliştirildi:
  - **HTML Ayrıştırma Motoru (`src/utils/html-importer.ts`):** Browser'ın native `DOMParser` API'sini kullanarak ham HTML string'ini rekürsif olarak işler. Her HTML etiketi (`div`, `section`, `article`, `nav`, `header`, `footer`, `main`, `aside`, `p`, `h1`–`h6`, `span`, `button`, `a`, `label`, `blockquote`, `pre`, `code`, `ul`, `ol`, `li`, `dl`, `dt`, `dd`, `form`) uygun `core-schema` tipine (container/text/button) eşlenir.
  - **Tailwind Class Koruma:** Kaynak HTML'deki `class="..."` attribute'ları olduğu gibi `props.tailwindClasses` alanına aktarılır. Hiçbir class dönüşümü veya kaybı olmaz.
  - **Metin ve Hiyerarşi Koruma:** İç içe geçmiş tüm element yapıları ve metin içerikleri (`textContent`) eksiksiz şekilde şema ağacına dönüştürülür. Birden fazla kök element varsa otomatik olarak `flex flex-col` container'a sarılır.
  - **Import Modal Bileşeni (`ImportModal.tsx`):** Sol Sidebar Toolbox'a eklenen "📥 Import Component" butonu ile açılan, büyük bir textarea içeren modal diyalog. Kullanıcı ham HTML'i yapıştırır, "Import Component" butonuna tıklar ve sonuç anında canvas'ta görünür.
  - **State Entegrasyonu (`App.tsx`):** `handleImport()` ile parse edilen şema seçili container'ın içine veya root'a eklenir ve yeni import edilen element otomatik seçilir. Modal kapandıktan sonra textarea temizlenir.
  - Tüm mevcut özellikler (selection, layers, drag-drop, properties panel, code panel, ZIP export, pan/zoom, theme, Tailwind CDN) korundu.

### Adım 24.1: Tuval Medya Sorgusu ve Görünürlük İzolasyonu (Media Query Isolation Fix)
- **Durum**: Tamamlandı.
- **Açıklama**: Canvas önizlemesinde, Mobile (375px) veya Tablet (768px) moduna geçildiğinde Tailwind Play CDN'in `window.innerWidth` bazlı `@media` derlemesinin neden olduğu layout taşması ve görünürlük hatası giderildi:
  - **JavaScript Tabanlı Responsive Class Filtreleme (`ElementRenderer.tsx`):** CSS `@container` override yaklaşımı terk edildi, bunun yerine ElementRenderer seviyesinde `filterResponsiveClasses()` fonksiyonu ile viewport moduna uymayan responsive Tailwind class'ları (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) className string'inden runtime'da temizleniyor. Örneğin Mobile modunda `hidden md:flex` → `hidden` (gizli kalır), Tablet modunda `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` → `grid-cols-1 md:grid-cols-2` (2 kolon).
  - **Desktop Genişlik Düzeltmesi (`.canvas-transform-layer`):** Desktop modunda canvas div'inin dar kalması sorunu, `.canvas-transform-layer`'a `width: 100%; min-width: 0;` eklenerek çözüldü. Layout zincirindeki shrink-wrap hatası giderildi; Desktop modu artık viewport'un tamamını dolduruyor (`max-width: 1280px` ile sınırlı).
  - **Görsel İyileştirmeler:** Viewport kontrol barındaki emoji ikonlar (`📱` `💻`) Lucide tarzı clean SVG ikonlarla (Smartphone, Tablet, Monitor) değiştirildi. Canvas dock, `rgba(9,9,11,0.92)` şeffaf siyah zemin, `backdrop-filter: blur(8px)`, belirgin gölge ve yuvarlatılmış capsule tasarım ile yenilendi.
  - **`container-type: inline-size`** özelliği `.canvas-paper` üzerinde tutuldu (gelecekteki container query tabanlı özellikler için altyapı hazır).
  - Tüm mevcut özellikler (drag-and-drop, selection badge, layers tree, properties panel, code panel, ZIP export, copy/paste, import modal) korundu ve build başarıyla tamamlandı.

### Adım 25: İnteraktif Davranış Katmanı (Interactive Behavior Layer)
- **Durum**: Tamamlandı.
- **Açıklama**: Görsel builder üzerinden elementlere onClick etkileşimleri tanımlamak için kapsamlı bir altyapı geliştirildi:
  - **Core Schema (`core-schema/src/index.ts`):** `ElementInteraction` arayüzü (`trigger`, `action`, `targetElementId`, `className`) ve tüm element tiplerine `CoreElementProps` üzerinden `interactions[]` desteği eklendi.
  - **Properties Panel (`PropertiesPanel.tsx`):** "INTERACTIONS" accordion bölümü — Target element seçici (akıllı sıralama: ID'li elementler önce, anonimler `─── Other ───` separator'ı ile ayrı), Action seçici (Toggle Class), Class Name inputu, Ekle/Sil butonları.
  - **Canvas Etkileşim Motoru (`ElementRenderer.tsx`):** Element `handleClick` içinde `interactions` array'ini okuyor, `onInteraction()` callback'i ile App.tsx'e tetikliyor. Canvas'ta tıklandığında hedef elementin `tailwindClasses`'ında class toggle ediliyor.
  - **JS Export Motoru (`js-generator.ts`):** `document.getElementById()` tabanlı, zero-dependency vanilla JS üretimi. Her handler block-scoped (`{ const srcEl = ... }`) ile çalışıyor, `JSON.stringify` ile class name güvenli escape.
  - **HTML Export (`class-exporter.ts`):** Etkileşime giren elementlere otomatik `id="..."` attribute'u ekleniyor. Original HTML `id`'leri import sırasında korunuyor.

### Adım 26: Modern Proje Yapısı ve ZIP İhraç Motoru (Export & ZIP Generation)
- **Durum**: Tamamlandı.
- **Açıklama**: Export motoru, profesyonel bir Vite + Tailwind CSS proje şablonu üretecek şekilde kapsamlı bir modernizasyondan geçirildi:
  - **Modern Proje Yapısı (`class-exporter.ts`):** `generateClassExport()` artık 9 dosyalı bir `ProjectFiles` record'u döndürüyor:
    - `package.json` — `dev` (vite), `build` (vite build), `preview` script'leri + `tailwindcss`, `postcss`, `autoprefixer`, `vite` devDependencies.
    - `tailwind.config.js` — `content: ["./index.html", "./src/**/*.{html,js}"]` ile purging ayarları.
    - `postcss.config.js` — Tailwind + Autoprefixer plugin yapılandırması.
    - `vite.config.js` — Minimal Vite yapılandırması (`outDir: "dist"`).
    - `index.html` — Vite giriş noktası (`<link href="/src/css/input.css">` + `<script type="module" src="/src/js/app.js">`).
    - `src/css/input.css` — `@tailwind base/components/utilities` direktifleri.
    - `src/js/app.js` — Etkileşim mantığı, ES6 module olarak.
    - `README.md` — Türkçe kurulum kılavuzu (`npm install` → `npm run dev` → `npm run build`).
  - **Geriye Uyumluluk:** Ayrıca standalone `html` string'i (Tailwind CDN'li, tek dosya) korunuyor — "Export HTML" butonu için.
  - **XSS Koruması:** Tüm text içerikleri `escapeHtml()` ile güvenli hale getirildi (`&`, `<`, `>`, `"`, `'`).
  - **JS Enjeksiyon Koruması:** `js-generator.ts`'de class name'ler `JSON.stringify()` ile güvenli escape edildi.
  - **Code Panel Crash Fix (`CodePanel.tsx`):** Eski `classExport.js` (`undefined`) referansı, yeni `files["src/js/app.js"]` yoluna yönlendirildi. Tüm `useMemo` ve `highlightJs` çağrıları `try/catch` ile sarıldı — JS sekmesine tıklandığında Black Screen hatası giderildi.
  - **Export UI Feedback (`App.tsx`):** Header'da "Generating project…", "Project exported!", "HTML exported!" durum bildirimleri gösteriliyor.
  - **Kullanım Senaryosu:** 
    ```bash
    unzip fs-builder-project.zip -o my-project
    cd my-project
    npm install && npm run dev    # localhost:5173
    npm run build                  # dist/ → Netlify/Vercel'e yüklenebilir
    ```

### Adım 27: Tasarım Odaklı Mimariye Geçiş (Figma Konseptine Pivot & JS Katmanının Kaldırılması)
- **Durum**: Tamamlandı.
- **Açıklama**: Proje, uygulama mantığı ve dinamik JS etkileşimleri yerine saf bir görsel tasarım ve düzenleme aracına (Figma/Webflow tarzı Tailwind Builder) dönüştürüldü:
  - **JS & Etkileşim Katmanının Temizlenmesi:** `core-schema` içerisindeki `interactions` yapısı (ElementInteraction, ClickAction, InteractionProps), `PropertiesPanel`'deki Interactions akordiyonu ve `ElementRenderer`'daki dinamik class toggle mantığı tamamen kaldırıldı. Canvas seçim ve düzenleme etkileşimleri aynen korundu.
  - **Sadeleştirilmiş Export Motoru:** `js-generator.ts` tamamen devreden çıkarıldı (dosya silindi). `class-exporter.ts` artık `src/js/app.js` üretmiyor; proje çıktısı saf HTML + Tailwind CSS içeriyor. Vite şablonunda `index.html`, `tailwind.config.js`, `postcss.config.js`, `vite.config.js`, `package.json`, `README.md` ve `src/css/input.css` bulunuyor — JS dosyası yok.
  - **Code Panel Yenilemesi (`CodePanel.tsx`):** JS sekmesi kaldırıldı. Yeni sekmeler: `index.html` (biçimlendirilmiş HTML), `tailwind.config.js` (Tailwind yapılandırması) ve `Preview` (canlı iframe önizlemesi — Tailwind CDN'li standalone HTML render eder).
  - **Tasarım Odaklı Yeni Vizyon:** Odak noktası; gelişmiş stil kontrolleri (Typography, Spacing, Flexbox/Grid, Colors, Shadows), zengin bileşen kütüphanesi (Image, Form elemanları, Icons) ve piksel hassasiyetinde görsel düzenleme yeteneklerine çevrildi.

### Adım 28: Figma Tarzı Görsel Zenginleştirme, Görsel (Image) Desteği & Gelişmiş Katman Sistemi
- **Durum**: Tamamlandı.
- **Açıklama**: Builder'ın tasarım yetenekleri Figma standartlarına yaklaştırılarak zenginleştirildi:
  - **Yeni Image Elemanı:** Şemaya, Toolbox'a ve Renderer'a `image` tipi eklendi. URL (`src`), `alt` metni ve `object-fit` kontrolleri Properties paneline entegre edildi. Görsel URL'si boşken yüksek kaliteli SVG placeholder gösteriliyor.
  - **Figma Tarzı Katmanlar (Layers Tree):** Katmanlara çift tıklayarak özel isim verebilme (Hero, Navbar vb.) ve her eleman tipi için özel SVG ikonlar (`Box`, `Type`, `Image`, `Button`) eklendi.
  - **Gelişmiş Stil Kontrolleri:** Properties paneline Boyutlandırma (Width/Height/Max-Width), Tipografi (Size/Weight/Align), Kenarlık ve Gölge (Rounded/Shadows) akordiyonları eklendi.
  - **HTML Import/Export Güncellemesi:** Görsel elemanlarının kayıpsız içe ve dışa aktarımı sağlandı.
  - **Görsel Seçim Çerçevesi Düzeltmesi (Image Selection Ring Fix):** Tuval üzerinde `image` elemanları seçildiğinde mavi seçim çerçevesinin (`ring`/`outline`) ve seçim rozetinin düzgün görünmesini engelleyen renderer/stil sorunu giderildi. `<img>` elemanı, **Wrapper Container Pattern** (Figma/Webflow image frame) ile interaktif bir wrapper `<div>` içine alındı:
    - Seçim çift katmanlı gösteriliyor: inset outline + `absolute inset-0 border-2 border-blue-500` explicit inset overlay (Figma tarzı seçim kutusu).
    - `SelectionBadge` diğer elemanlarla aynı şekilde konumlanıyor. `overflow:hidden` wrapper'a konmadı (badge'i kırpardı); yuvarlatmalar (`rounded-*`) wrapper'dan türetilip `<img>`'e inline `border-radius` olarak uygulandı.
    - `<img>` root node olmaktan çıkarıldı: `w-full h-full object-cover pointer-events-none block` sınıflarıyla wrapper'ı dolduruyor; `objectFit` prop'u inline style ile uygulanıyor ve tıklamalar `pointer-events: none` sayesinde doğrudan wrapper'a (seçim mantığına) iletiliyor.
  - **Sıfır Yerleşim Kayması Düzeltmesi (Zero Layout Shift Selection Fix):** Elemanlar seçildiğinde `ring-offset` ve satır içi boşluklar nedeniyle oluşan boyutsal genişleme ve kayma (layout shift) giderildi. Seçim çerçeveleri tamamen elemanın iç sınırına (`inset outline / absolute overlay`) kilitlenerek Figma standartlarında pürüzsüz seçim sağlandı.
    - Tüm element tiplerinde `selectionStyle` artık `outline: 2px solid #3b82f6; outline-offset: -2px` (inset) kullanıyor — outline fiziksel layout alanı kaplamadığı için seçim hiçbir kardeş elemanı itmiyor.
    - Image wrapper'daki `ring-2 ring-blue-500 ring-offset-2` sınıfları kaldırıldı (ring-offset görsel olarak dışa taşıyordu); yerine inset outline + absolute overlay kullanılıyor.
    - Image wrapper `inline-block` → `block` olarak değiştirildi; inline-level box'ların neden olduğu satır içi boşluk/baseline farkı (alt boşluk) ortadan kaldırıldı.
  - **Ayrık Tuval Seçim Katmanı ve Sıfır Kayma Mimarisi (Decoupled Selection Overlay):** Seçim rozeti (`CONTAINER` action badge) elemanların iç DOM akışından tamamen çıkarıldı. Figma mimarisine uygun olarak tuval üstünde bağımsız, koordinat tabanlı (`bounding rect overlay`) bir katmana taşındı. Böylece eleman seçildiğinde oluşan tüm aşağı/yukarı yerleşim zıplamaları (layout shift) %100 sonlandırıldı.
    - **`ElementRenderer.tsx` sadeleşti:** Elementler yalnızca kendi içeriklerini ve stillerini render ediyor; içlerinde hiçbir badge/overlay JSX'i kalmadı. Seçim vurgusu `box-shadow: inset 0 0 0 2px #3b82f6` (sıfır layout etkisi) ile elemanın kendi sınırları içinde çiziliyor.
    - **`SelectionOverlay.tsx` (yeni bileşen):** Seçili elemanın DOM düğümü `document.querySelector('[data-element-id="..."]')` ile bulunup `getBoundingClientRect()` koordinatları tuval viewport'una göre hesaplanıyor. `requestAnimationFrame` döngüsü pan/zoom/scroll sırasında overlay'i gerçek zamanlı takip ediyor. Outline kutusu + action badge (`pointer-events: none` katman, badge butonları `pointer-events: auto`) eleman DOM'undan bağımsız olarak `z-index: 9000+` seviyesinde çiziliyor.
    - Tüm element tiplerine (`container`, `text`, `button`, `image`) `data-element-id` attribute'u eklendi (overlay hedefi için). Akıllı Katman İsimlendirme ve Çift Tıkla Yeniden Adlandırma (Figma Layers UX)
- **Durum**: Tamamlandı.
- **Açıklama**: Katmanlar panelindeki karmaşık ve tekrarlayan "Container" görünümü Figma standartlarında modern bir isimlendirme sistemiyle çözüldü:
  - **Inline Katman Yeniden Adlandırma:** Katman listesindeki herhangi bir elemana çift tıklayarak özel isim (`customLabel`) verebilme ve `Enter`/`Blur` ile anında kaydetme özelliği eklendi.
  - **Akıllı Otomatik Etiketleme:** İsimlendirilmemiş elemanlar için içerik ve layout bazlı akıllı başlıklar üretildi (ör. Metin için ilk 15 karakter, Buton için buton yazısı, Container için `Row`, `Grid`, `Section` etiketleri).
  - **Semantik HTML Import Desteği:** `html-importer.ts` güncellenerek `<header>`, `<nav>`, `<section>`, `<footer>` gibi etiketler ve `id` attribute'ları içe aktarma sırasında otomatik olarak katman isimlerine dönüştürüldü.

---

## Mevcut Hedef
- **🎨 Tasarım Odaklı Builder Vizyonu — Yeni Dönem!**
  Proje artık saf görsel tasarım aracı olarak konumlanmıştır. Tüm JS/interaktif katman kaldırıldı, export motoru pure HTML + Tailwind'e odaklandı.

  | Bileşen | Durum |
  |---|---|
  | Görsel Canvas (Pan/Zoom/Selection) | ✅ Tamamlandı |
  | Tailwind Class Management (Properties Panel) | ✅ Tamamlandı |
  | Responsive Viewport Engine (Mobile/Tablet/Desktop) | ✅ Tamamlandı |
  | Play Mode (Device Shell Simülasyonu) | ✅ Tamamlandı |
  | Layers Panel (Drag & Drop + Rename + Smart Labels + Type Icons) | ✅ Tamamlandı |
  | Image Element (src/alt/object-fit) | ✅ Tamamlandı |
  | Smart HTML Importer (semantik etiket isimlendirme) | ✅ Tamamlandı |
  | Dark/Light Theme Sistemi | ✅ Tamamlandı |
  | Live Code Preview Panel (HTML + Tailwind Config + Preview) | ✅ Tamamlandı |
  | Pure HTML + Tailwind ZIP Export (JS'siz) | ✅ Tamamlandı |

- Bir sonraki aşama planlanan genişletmeler:
  - **Form Elemanları:** `input`/`textarea`/`select` bileşen tiplerinin şemaya eklenmesi.
  - **Gelişmiş Stil Kontrolleri:** Opacity, Transform/Rotate, Position (absolute/fixed) kontrolleri.
  - **Pre-built Component Blocks:** Navbar, Hero, Card, Footer gibi hazır Tailwind bileşenlerinin tek tıkla eklenmesi.
  - **AI Destekli Tasarım Üretimi:** Yapay zeka ile görsel tasarım oluşturma altyapısı (canvas artık bu için hazır).
  - **Tauri Masaüstü Derlemesi:** `apps/desktop` paketinin tamamlanması.
