# Proje Notları

Bu dosya, `fs-builder` projesinin ilerlemesini ve hedeflerini takip etmek için kullanılır.

## Ana Konsept

fs-builder, kullanıcıların sürükle-bırak editörü kullanarak tam donanımlı web uygulamaları oluşturmasına olanak tanıyan, masaüstü (Tauri) ve web tabanlı bir görsel oluşturucudur.

**Teknoloji Yığını:**
- Frontend: React + TypeScript + Vite
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
- CSS Variables (`--bg-main`, `--bg-sidebar`, `--border-color`, `--text-main`, `--accent-color`, vb.) kullanılarak Dark (varsayılan, Catppuccin Mocha benzeri profesyonel görünüm) ve Light olmak üzere iki temalı bir sistem entegre edildi. Tema, header'daki bir buton ile anlık olarak değiştirilebilir.
- **Kritik Kazanım:** Merkez Canvas/Önizleme alanı, tema sisteminden tamamen izole edildi. Canvas zemini (`--canvas-bg`) ve yüzeyi (`--canvas-surface`) temadan bağımsız sabit renkler kullanır. Bu sayede editör teması değiştiğinde kullanıcının oluşturduğu web sayfasının stilleri (inline style) hiçbir şekilde etkilenmez veya bozulmaz.
- Tüm mevcut state yönetimi, eleman seçimi, iç içe konteyner mantığı ve HTML dışa aktarma özellikleri korundu.

### Adım 16: İnteraktif Katmanlar Paneli (DOM Ağacı Görünümü)
- **Durum**: Tamamlandı.
- **Açıklama**: Sol sidebar'da bulunan "Layers" alanı, statik bir placeholder olmaktan çıkarılarak tamamen işlevsel, interaktif bir DOM ağacı görünümüne dönüştürüldü:
  - **Rekürsif Ağaç Yapısı:** Tüm şema hiyerarşisi, her bir elemanın türüne göre görsel simgeler ve girintilerle birlikte rekürsif olarak listelenir. Kapsayıcı (container) elemanlar, alt öğelerini gizleyip gösterebilmek için genişletme/daraltma (expand/collapse) kontrollerine sahiptir.
  - **Çift Yönlü Seçim Senkronizasyonu:** Kanvas üzerinde bir elemana tıklandığında, katmanlar panelinde ilgili satır otomatik olarak vurgulanır ve görünür hale getirilir (scroll into view). Tersi de geçerlidir: Katmanlar panelinde bir satıra tıklandığında, kanvas üzerinde o eleman seçilir ve özellikler paneli güncellenir.
  - **Tip Göstergeleri:** Container, Text ve Button türleri, sol taraflarında farklı simgelerle (📦, 𝜲, 🔘) işaretlenmiştir. Bu sayede kullanıcı ağaçta gezinirken her bir öğenin türünü anında ayırt edebilir.
  - **Tema Uyumu:** Tüm katman paneli stilleri, CSS değişkenlerini (`--bg-hover`, `--bg-active`, `--text-main`, `--text-dim`, `--accent-color`, vb.) kullanarak hem Dark hem de Light temalarda tutarlı ve okunabilir bir görünüm sunar.

### Adım 17: Gelişmiş Text ve Button Özellikleri (Properties System)
- **Durum**: Tamamlandı.
- **Açıklama**: Text ve Button elemanları için özellik düzenleme sistemi kapsamlı bir şekilde genişletildi:
  - **Şema Genişletmesi (`core-schema`):** `TextProps` ve `ButtonProps` arayüzlerine yeni stil ve içerik özellikleri eklendi.
  - **Text Özellikleri:** İçerik metni (text input), font boyutu (`fontSize`, px), metin rengi (`color`, hex color picker), font ağırlığı (`fontWeight`: Normal/Medium/Bold) ve metin hizalama (`textAlign`: Left/Center/Right) için kontroller eklendi.
  - **Button Özellikleri:** Buton etiketi (text input), arka plan rengi (`backgroundColor`, hex color picker), metin rengi (`color`, hex color picker), iç dolgu (`padding`, px) ve köşe yuvarlaklığı (`borderRadius`, px) için kontroller eklendi.
  - **Editör Önizleme Entegrasyonu (`ElementRenderer`):** Tüm yeni özellikler, React inline style olarak dinamik şekilde render edilir. Kullanıcı panelde bir değeri değiştirdiğinde sonuç anında kanvas üzerinde görünür.
  - **HTML Dışa Aktarma Entegrasyonu (`exporters/html.ts`):** Dışa aktarma motoru, text ve button elemanları için yeni stil özelliklerini okuyacak ve oluşturulan HTML çıktısına inline style olarak ekleyecek şekilde güncellendi.
  - **Yeniden Kullanılabilir UI Helper'lar:** PropertiesPanel içinde `TextField`, `NumberField`, `ColorField` ve `SelectField` gibi yardımcı bileşenler tanımlanarak panel kodunun okunabilirliği ve bakımı kolaylaştırıldı.
  - Color picker alanı için özel CSS stilleri (`prop-color-row`, `prop-color-picker`, `prop-color-hex`) eklendi; hem renk seçici hem de hex metin girişi yan yana çalışır.
  - Mevcut container özellikleri, layout yapısı, katman paneli, tema sistemi ve tüm state mantığı korundu.

### Adım 18: Katmanlar Üzerinden Sürükle-Bırak (Layers Drag & Drop)
- **Durum**: Tamamlandı.
- **Açıklama**: Layers panelinde HTML5 native Drag & Drop desteği eklendi:
  - **Yeniden Sıralama ve İç İçe Taşıma:** Kullanıcılar katman ağacında herhangi bir elementi sürükleyerek kardeşleri arasında yeniden sıralayabilir veya bir container'ın içine taşıyabilir.
  - **Drop Zone Algılama:** Mouse Y pozisyonuna göre `before`, `inside`, `after` olmak üzere üç farklı drop zone belirlenir. Her zone için görsel geri bildirim (accent renkli çizgi, kesik outline) sağlanır.
  - **Kısıtlamalar:** Root container sürüklenemez. Bir element kendi alt öğesinin içine bırakılamaz (circular drop engellenir). Aynı parent içinde taşımalarda index otomatik ayarlanır.
  - **State Yönetimi (`App.tsx`):** `extractElement`, `insertElementAt`, `moveElementInTree` gibi yardımcı fonksiyonlar eklendi. Tüm taşıma işlemleri immutable şema güncellemeleri ile yapılır.
  - Tüm mevcut özellikler (selection, properties panel, HTML export) korundu.

### Adım 19: Gelişmiş Canvas Viewport & Alt Araç Barı (Pan/Zoom Controls)
- **Durum**: Tamamlandı.
- **Açıklama**: Canvas görünümü profesyonel bir tasarım aracı deneyimine kavuşturuldu:
  - **Keskin Web Sayfası Görünümü:** Canvas kağıdı (`canvas-paper`) sıfır border-radius ve sıfır padding ile gerçek bir web sayfası gibi görünür. Yapay kenar boşlukları ve gölgeler kaldırıldı.
  - **Pan (El Aracı):** Canvas altındaki dock toolbar'da bulunan el aracı ile veya Space tuşuna basılı tutarak canvas üzerinde kaydırma yapılabilir. `grab`/`grabbing` cursor desteği mevcuttur.
  - **Zoom (+/- / Sıfırla):** %20–300 aralığında yakınlaştırma/uzaklaştırma. Sıfırlama butonu zoom'u %100'e ve pan'i sıfıra döndürür.
  - **Dot Grid Arka Planı:** Canvas zemininde `radial-gradient` ile oluşturulmuş 20px aralıklı nokta deseni. Temadan bağımsız `--canvas-border` rengi kullanır.
  - **Floating Selection Badge:** Seçili elementin sol-üst köşesinde mavi bir badge belirir. Badge'de element türü, hızlı ekleme (+), çoğaltma (⧉) ve silme (🗑) butonları bulunur. Hızlı ekleme butonu Container/Text/Button seçenekli bir popover açar.
  - **Copy/Paste Motoru:** `Ctrl+C` / `Ctrl+V` / `Ctrl+D` klavye kısayolları ile kopyala-yapıştır-çoğalt işlemleri. Her kopyalamada tüm element ağacına yeni unique ID'ler atanır (`deepCloneWithNewIds`). Input/textarea odaklıyken kısayollar devre dışı kalır.
  - Root container'ın editor görünümü `outline` (zero-layout) kullanır, exported HTML'ye hiçbir yardımcı stil sızmaz.
  - Tüm mevcut özellikler (selection, layers, drag-drop, properties panel, theme, HTML export) korundu.

### Adım 20: Canlı Kod Önizleme ve HTML/CSS Ayrıştırma Motoru (Live Code View & CSS Class Generation)
- **Durum**: Tamamlandı.
- **Açıklama**: Canvas altına gerçek zamanlı, katlanabilir bir kod önizleme paneli eklendi:
  - **CodePanel Bileşeni (`CodePanel.tsx`):** Canvas'ın alt kısmında flex column düzeninde konumlanır. Header'ında dosya sekmeleri ve aksiyon butonları bulunur.
  - **Sekmeli Arayüz:** `index.html` (class-based HTML) ve `style.css` (tam CSS stylesheet) olmak üzere iki sekme. Syntax highlighting ile renklendirilmiş monospace kod görünümü.
  - **CSS Class Generation (`class-exporter.ts`):** Her elemente semantic class adları atanır (`fs-container-root`, `fs-text-1`, `fs-button-2`). Tüm inline style'lar HTML'den kaldırılarak ayrı bir CSS çıktısına taşınır.
  - **Gerçek Zamanlı Senkronizasyon:** Her şema değişiminde HTML ve CSS otomatik yeniden üretilir (useMemo ile optimize edilmiştir).
  - **Copy Butonu:** Aktif sekmedeki kodu panoya kopyalar. "✓ Copied!" feedback ile kullanıcıya geri bildirim verir.
  - **Formatlama:** Kod 2-space indent ile temiz ve okunabilir formatta sunulur. Gereksiz default değerler (margin: 5px, padding: 0px gibi) çıktıya eklenmez.
  - **Syntax Highlighting:** HTML için tag'ler mavi (`#569cd6`), attribute'lar cyan (`#9cdcfe`), değerler turuncu (`#ce9178`). CSS için selector'lar mavi, property'ler cyan, değerler turuncu.
  - VS Code benzeri koyu tema (`#1e1e1e` arka plan) ile görsel tutarlılık sağlanır.
  - Mevcut `exportToHtml` (inline style ile export) fonksiyonu korundu — Export HTML butonu için hala kullanılır.
  - Tüm mevcut özellikler (selection, layers, drag-drop, properties panel, pan/zoom, copy/paste, theme) korundu.

---

## Mevcut Hedef
- Sıradaki adımı bekliyor. Görsel editörün çekirdek layout'u, canvas kontrolleri ve export motoru artık sağlam ve üretime hazır bir temele oturmuştur. Bir sonraki ana kilometre taşı: Bileşen Kütüphanesinin Genişletilmesi — Gelişmiş Form ve UI Elemanları (Input, Textarea, Select, List, İkon) ve Ön Tanımlı UI Bileşen Blokları (Pre-built Component Blocks) eklenmesi.
