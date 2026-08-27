# 📈 Pulseview SPC — Analytics & Statistical Process Control Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.x-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Highcharts](https://img.shields.io/badge/Highcharts-12.x-800080?style=flat-square&logo=highcharts)](https://www.highcharts.com/)
[![Zustand](https://img.shields.io/badge/Zustand-State-orange?style=flat-square)](https://zustand.docs.pmnd.rs/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-red?style=flat-square&logo=react-query)](https://tanstack.com/query/latest)

> **Pulseview SPC**, endüstriyel üretim hatlarında ve iş istasyonlarında (kamera, kaynak, boyutsal kontrol vb.) üretilen gerçek zamanlı ölçüm verilerini izlemek, proses kararlılığını analiz etmek ve istatistiksel kontrol sağlamak amacıyla geliştirilmiş modern, yüksek performanslı bir **İstatistiksel Proses Kontrol (SPC)** izleme panosudur.

---

## ✨ Temel Özellikler & Grafik Modları

Pulseview SPC, üretim kalite kontrolü için 4 temel analiz modu sunar:

### 1. 📊 Individual Values (Bireysel Değerler Modu)
* **Histogram (Distribution):** Ölçüm değerlerinin frekans dağılımını gösteren yatay çubuk grafik (`{Ölçüm Adı} Population`). Örnek sayısı ($n$) ve spesifikasyon dışı (NOK) parça oranını anlık hesaplar.
* **Timeline Chart:** Ölçüm değerlerinin zaman eksenindeki serisi (`{Ölçüm Adı} Values`). Üst/Alt İzleme Limitleri (Max, Min), Üst/Alt Kontrol Limitleri (UCL, LCL) ve Ortalama (Mean) sınır çizgilerini sol etiketlerle gösterir.

### 2. 📉 SPC (Statistical Process Control)
* **X-Bar Average Chart:** Her 200 ölçüm noktasından (veya seçilen alt gruptan) hesaplanan ortalama değerlerin kontrol grafiği. Sarı izleme bölgesi ve yeşil kontrol bandı (UCL/LCL) ile tolerans kontrolü sağlar; nominal değer kırmızı kesikli çizgi olarak vurgulanır.
* **Standard Deviation & Process Capability Chart:** Standart sapma ($\sigma$) trendi ile proses yeterlilik indekslerini ($C_p$ ve $C_{pk}$) eşzamanlı çizer.

### 3. 🔵 Pallet Analysis (Palet Analizi)
* **Pallet Scatter Plot:** $X$ ekseninde palet numarası, $Y$ ekseninde ölçüm değeri bulunan dağılım grafiği. Palet bazlı tolerans kaymalarını ve proses anomalilerini tespit etmeyi sağlar.

### 4. 📈 Compare Analysis (Karşılaştırma Analizi)
* **Multi-Series Overlay:** Birden fazla ölçüm tipinin tek bir zaman serisi üzerinde katmanlı olarak karşılaştırılması. Shared tooltip ve alt lejant (legend) ile hızlı korelasyon analizi sunar.

---

## ⚡ Performans ve Mimari Yetenekleri

* 🚀 **Highcharts WebGL Boost:** 30.000+ ölçüm noktasında dahi takılmasız, 60 FPS donanım hızlandırmalı grafik renderleme (`boostThreshold: 1000`, `turboThreshold: 30000`).
* 🔄 **Dinamik Reflow & Responsive:** Ekran çözünürlüğü değişimlerinde veya menü geçişlerinde `ResizeObserver` tabanlı `useChartReflow` hook'u ile kusursuz otomatik boyutlandırma.
* 🎛️ **Cascade Parametre Filtreleme:** İstasyon $\rightarrow$ Ürün $\rightarrow$ Ölçüm Tipi hiyerarşisinde güvenli durum yönetimi ve dinamik popülasyon boyutu seçimi (1 – 30.000).
* 🌓 **Endüstriyel Koyu Tema (Industrial Dark UI):** Fabrika kontrol odaları ve izleme monitörleri için optimize edilmiş, göz yormayan yüksek kontrastlı arayüz.
* 📦 **Modüler & Tip Güvenli:** Uçtan uca TypeScript tip tanımları (`/src/types/spc.ts`) ve ayrılmış mimari katmanları (UI / State / API / Data Mappers).

---

## 🏗️ Teknoloji Yığını

| Katman | Teknoloji / Kütüphane |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Görselleştirme** | Highcharts & Highcharts-React (Boost Module / WebGL) |
| **Server State / Cache** | TanStack React Query v5 |
| **UI State Management** | Zustand (DevTools destekli) |
| **Stil & Tasarım** | Tailwind CSS v4 + Vanilla CSS Variables |
| **İkon Seti** | Lucide React |
| **Tip Sistemi** | TypeScript 5 |

---

## 📁 Dizin Yapısı

```bash
pulseview-analytics-frontend/
├── app/                              # Next.js 16 App Router
│   ├── api/                          # Mock REST API Route Handlers
│   │   ├── individual-values/        # Bireysel ölçüm mock servisi
│   │   ├── measurements/             # Ölçüm tipleri mock servisi
│   │   ├── products/                 # Ürün listesi mock servisi
│   │   ├── spc-values/               # SPC X-Bar/Sigma mock servisi
│   │   └── stations/                 # İstasyonlar mock servisi
│   ├── globals.css                   # Global temalar, token'lar ve Highcharts stilleri
│   ├── layout.tsx                    # Root layout & next/font yapılandırması
│   ├── page.tsx                      # Ana SPC Kontrol Paneli sayfası
│   └── providers.tsx                 # QueryClient & Highcharts başlatıcı provider
├── src/
│   ├── components/
│   │   ├── charts/                   # Grafik bileşenleri
│   │   │   ├── compare/              # Compare Analysis (Chart & Layout)
│   │   │   ├── individual/           # Individual Values (Histogram & Timeline)
│   │   │   ├── pallet/               # Pallet Analysis (Chart & Layout)
│   │   │   ├── shared/               # ChartCard ve ortak görsel bileşenler
│   │   │   └── spc/                  # SPC X-Bar & Std Dev (Chart & Layout)
│   │   └── parameters/               # ParametersBar & MeasurementMultiSelect
│   ├── hooks/                        # useChartReflow & useSpcQueries
│   ├── lib/
│   │   ├── api/                      # spcClient (Merkezi API istemcisi)
│   │   ├── mappers/                  # spcMapper (DTO -> Domain modelleri)
│   │   └── mock/                     # dataEngine & mockDb (Gerçekçi veri üreteci)
│   ├── store/                        # useSpcStore (Zustand Global State)
│   └── types/                        # spc.ts (Kapsamlı tip tanımları)
└── public/                           # Statik görsel ve varlıklar
```

---

## 🚀 Başlangıç ve Kurulum

### Gereksinimler
* **Node.js**: v18.18.0 veya üzeri
* **npm**, **yarn**, veya **pnpm**

### Kurulum Adımları

1. **Repoyu Klonlayın:**
   ```bash
   git clone https://github.com/movith-technologies/pulseview-analytics-frontend.git
   cd pulseview-analytics-frontend
   ```

2. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

3. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```
   Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.

4. **Production Derlemesi Alın ve Çalıştırın:**
   ```bash
   npm run build
   npm run start
   ```

---

## 🔌 Gerçek Backend Entegrasyonu

Proje varsayılan olarak dahili `/api/*` Next.js Route Handlers mock motorunu kullanır. Gerçek backend servisine bağlanmak için:

1. `.env.local` dosyası oluşturun:
   ```env
   NEXT_PUBLIC_API_URL=https://api.pulseview.example.com
   ```
2. [`src/lib/api/spcClient.ts`](src/lib/api/spcClient.ts) dosyasında `BASE_URL` otomatik olarak bu adrese yönlendirilir.

---

## 📜 Lisans & Geliştirici

Bu proje [Movith Technologies](https://github.com/movith-technologies) tarafından geliştirilmektedir.
Tüm hakları saklıdır.
