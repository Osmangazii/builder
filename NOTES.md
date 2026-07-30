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

---

## Mevcut Hedef
- Sıradaki adımı bekliyor. Çekirdek framework artık Tailwind ekosistemi ile native girdi/çıktı yapabilen, son derece güçlü bir görsel oluşturucu haline gelmiştir. Bir sonraki ana kilometre taşı: **Bileşen Kütüphanesinin Genişletilmesi** — Özel Gelişmiş Bileşenler (Image Component Source/Alt Binding, Video Embeds, Input/Textarea/Select form elemanları) ve **Tailwind İnteraktif Davranış Katmanı** (menü, accordion, tab gibi dinamik click/toggle utility script'lerinin properties panel üzerinden yönetimi).
