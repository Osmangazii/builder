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

---

## Mevcut Hedef
- Sıradaki adımı bekliyor.