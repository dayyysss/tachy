<p align="center">
  <img src="./image.png" alt="Tachy: Type Faster, Think Clearer" width="100%" style="border-radius: 14px;" />
</p>

<p align="center">
  <strong>Platform latihan dan arena tes mengetik modern, taktil, dan kompetitif dengan mesin anti-cheat deterministik, audio mekanikal presisi, analitik telemetri mendalam, dan konsol admin stealth.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Nuxt_4-00DC82?style=for-the-badge&logo=nuxt&logoColor=white" alt="Nuxt 4" />
  <img src="https://img.shields.io/badge/Vue_3.5-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white" alt="Vue 3.5" />
  <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/DaisyUI_v5-5A0EF8?style=for-the-badge&logo=daisyui&logoColor=white" alt="DaisyUI v5" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Better_Auth-000000?style=for-the-badge&logo=auth0&logoColor=white" alt="Better Auth" />
  <img src="https://img.shields.io/badge/Upstash_Redis-00E599?style=for-the-badge&logo=redis&logoColor=black" alt="Upstash Redis" />
</p>

<p align="center">
  <a href="#-tentang-tachy">Tentang Tachy</a> •
  <a href="#-fitur-unggulan">Fitur Unggulan</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-arsitektur-proyek">Arsitektur</a> •
  <a href="#-instalasi--setup">Instalasi</a> •
  <a href="#-mesin-anti-cheat--keamanan">Anti-Cheat & Keamanan</a> •
  <a href="#-pengalaman-taktil--kustomisasi">Pengalaman Taktil</a> •
  <a href="#-kontribusi--lisensi">Lisensi</a>
</p>

---

## ⚡ Tentang Tachy

**Tachy** (berasal dari bahasa Yunani *takhys*, berarti "cepat") adalah arena tes dan pelatih kecepatan mengetik modern yang dirancang untuk kecepatan, keindahan visual, dan kompetisi yang adil. Aplikasi ini menghadirkan pengalaman mengetik instan tanpa hambatan: setiap pengguna dapat langsung mulai mengetik sejak klik pertama tanpa harus mendaftar akun terlebih dahulu (*zero-friction guest mode*).

Bagi pengguna terdaftar, Tachy menyediakan **Member Workspace** yang melacak setiap sesi latihan: grafik kemajuan WPM (*Words Per Minute*), akurasi karakter per karakter, kalender aktivitas bergaya heatmap GitHub, perkembangan level/XP, serta papan peringkat (*leaderboards*) global dan regional yang diperbarui secara langsung.

Tachy dibangun dengan prinsip integritas kompetitif tinggi. Skor tidak dipercaya begitu saja dari peramban, melainkan diverifikasi oleh mesin **anti-cheat deterministik server-side** yang memutar ulang simulasi ketukan tombol dan menganalisis anomali interval waktu demi mencegah penggunaan bot atau skrip otomatis.

---

## ✨ Fitur Unggulan

### ⌨️ Arena Mengetik & Pengalaman Pengguna
- **Zero-Friction Guest-First**: Akses langsung ke arena latihan tanpa registrasi wajib. Data sesi tamu tersimpan secara lokal dan dapat diimpor otomatis saat membuat akun.
- **Mode Latihan Komprehensif**:
  - **Time**: Uji kecepatan berbasis waktu tetap (15s, 30s, 60s, 120s).
  - **Words**: Tantangan menyelesaikan kuota kata tertentu (10, 25, 50, 100 kata).
  - **Quote**: Mengetik kutipan sastra, buku, dan kalimat inspiratif dengan atribusi penulis.
  - **Code**: Latihan sintaks bahasa pemrograman nyata (JavaScript, TypeScript, Python, HTML/CSS, Go, Rust, C++, C#, Java, PHP, Ruby, Bash, Dart, Kotlin, Lua, JSON, YAML).
  - **Zen**: Mode mengetik bebas tanpa batas waktu dan tanpa tekanan kesalahan untuk latihan relaksasi.
  - **Custom**: Modus teks kustom dengan opsi tanda baca (*punctuation*) dan angka (*numbers*).
- **Multi-Bahasa Data-Driven**: Mendukung berbagai bahasa pengetikan (Bahasa Indonesia, English, Spanish, French, German, Italian, Portuguese, Russian, Turkish, Japanese Romaji, Javanese, Sundanese) berbasis koleksi data modular.
- **Audio Feedback Taktil**: Umpan balik suara ketukan tombol mekanikal realistis dengan profil switch populer (Cherry MX Blue, Brown, Red, Black, ink, tactile) berbasis Web Audio API berlatensi ultra-rendah.
- **Keyboard Visualizer Interaktif**: Tampilan keyboard virtual responsif di layar yang menyorot tombol aktif dan jari yang disarankan secara *real-time*.
- **Diagram Telemetri Sesi (Chart.js)**: Analisis kurva kecepatan WPM, *raw WPM*, dan titik kesalahan sepanjang durasi tes dengan ringkasan konsistensi (*consistency score*).
- **Share Card Beresolusi Tinggi**: Ekspor hasil pencapaian sesi ke kartu gambar SVG/PNG yang siap dibagikan ke media sosial.

### 🏆 Gamifikasi & Papan Peringkat Kompetitif
- **Fair Global Leaderboards**: Papan peringkat terfilter berdasarkan bahasa dan preset mode (harian, mingguan, dan sepanjang masa) yang di-cache menggunakan Upstash Redis Sorted Sets.
- **Sistem Level & XP**: Akumulasi pengalaman (XP) dihitung secara matematis berdasarkan volume kata, durasi, dan tingkat akurasi tes.
- **Streak & Daily Challenge**: Memantau konsistensi latihan harian dengan pelacak streak dan misi mengetik harian.
- **Profil Anggota & Heatmap**: Visualisasi konsistensi latihan tahunan melalui diagram matriks kontribusi 365 hari, rincian rekor terbaik (*personal bests*), serta analisis tombol lemah (*weak keys*).

### 🛡️ Stealth Admin Console & Analitik
- **Stealth Dynamic Routing**: Gerbang login dan antarmuka kontrol admin beroperasi pada segmen URL kustom tersembunyi (`ADMIN_LOGIN_PATH` / `ADMIN_PANEL_PREFIX`), mengabaikan pemindaian bot umum dengan respons `404 Not Found`.
- **Diagram Statistik Telemetri 14 Hari**: Diagram SVG responsif adaptif tema DaisyUI pada dashboard ikhtisar yang memvisualisasikan volume sesi harian, kurva kecepatan rata-rata WPM, distribusi mode tes, dan rasio integritas anti-cheat.
- **Autentikasi Multi-Faktor (2FA TOTP)**: Pengamanan ganda akun administrator dengan Google Authenticator / Authy serta dukungan kode cadangan darurat (*backup recovery codes*).
- **Manajemen Pengguna & Moderasi Anti-Cheat**: Manajemen akun anggota (*User CRUD*), antrean peninjauan hasil tes mencurigakan (*flagged queue*), pembekuan akun (*ban/unban*), dan reset statistik manipulatif.
- **Audit Logging Imutabel**: Setiap mutasi administratif (perubahan status pengguna, konfigurasi sistem, pembaruan branding) dicatat permanen dalam tabel audit database.
- **Penyimpanan Berkas & Kustomisasi Brand**: Penjelajah berkas terintegrasi (*file manager*), pengaturan banner pengumuman darurat, peralihan *maintenance mode*, dan pembaruan aset logo/favicon secara dinamis.

---

## 🏗️ Tech Stack

| Layer | Teknologi | Deskripsi |
|---|---|---|
| **Core Framework** | [Nuxt 4](https://nuxt.com/) (Vue 3.5) | Framework fullstack modern dengan SSR untuk halaman publik dan client-only typing core |
| **Runtime & Package Manager** | [Bun](https://bun.sh/) | Runtime JavaScript performa tinggi untuk eksekusi server, manajemen paket, dan bundling cepat |
| **Styling & Tema** | [Tailwind CSS v4](https://tailwindcss.com/) + [DaisyUI v5](https://daisyui.com/) | Utilitas CSS termutakhir dengan 30+ tema adaptif (termasuk tema khusus *tachy*) |
| **Animasi & Transisi** | [Motion-v](https://motion.dev/) | Transisi mikro kartu metrik, caret ketikan yang mulus, dan animasi antar-halaman |
| **State Management** | [Pinia 3](https://pinia.vuejs.org/) | Manajemen state reaktif untuk sesi tes, preferensi audio, dan konfigurasi pengguna |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/) | Database relasional dengan skema terstruktur, query aman terparameterisasi, dan migrasi instan |
| **Cache & Leaderboard** | [Upstash Redis](https://upstash.com/) | Penyimpanan in-memory berlatensi rendah untuk sorted sets peringkat global dan rate limiting |
| **Autentikasi Pengguna** | [Better Auth](https://better-auth.com/) | Autentikasi berbasis session token, OAuth Google & GitHub, serta proteksi 2FA TOTP |
| **Visualisasi Data** | [Chart.js](https://www.chartjs.org/) + Native SVG | Rendering grafik performa WPM sesi dan diagram aktivitas telemetri admin |
| **Validasi Skema** | [Zod](https://zod.dev/) | Validasi skema tipe data ketat pada formulir antarmuka dan seluruh endpoint API server |
| **Testing & Kualitas Kode** | [Vitest](https://vitest.dev/) + TypeScript Strict | Suite pengujian otomatis untuk anti-cheat replay, generator teks, dan validasi skema |

---

## 📂 Arsitektur Proyek

```text
tachy/
├── image.png                   # Banner resmi Tachy
├── app/                        # Lapisan Antarmuka Pengguna (Nuxt 4 / Vue 3.5)
│   ├── admin/pages/            # Rute Konsol Admin Stealth (Overview, Users, Moderation, Settings, dll.)
│   ├── assets/css/             # Tailwind CSS v4, variabel tema DaisyUI, dan tipografi
│   ├── components/
│   │   ├── admin/              # Komponen dashboard admin (FileManager, CommandPalette)
│   │   ├── auth/               # Modal autentikasi, AuthShell, dan formulir login
│   │   ├── dashboard/          # Kartu statistik profil, heatmap aktivitas, dan grafik tren
│   │   ├── typing/             # Engine utama (TypingArea, LiveStats, VirtualKeyboard, ResultCard)
│   │   └── ui/                 # BrandLogo, ThemePicker, ToastContainer, DialogContainer
│   ├── composables/            # State logic reaktif (useAuth, useTypingEngine, useSound, useSeo, useBrand)
│   ├── layouts/                # Shell layout (default, admin, focus)
│   └── pages/                  # Rute publik (arena beranda, leaderboard, daily, profil, settings)
│
├── server/                     # Lapisan Backend Nitro & API
│   ├── api/
│   │   ├── admin/              # Endpoint API admin (overview, users, moderation, metrics, settings)
│   │   ├── auth/               # Endpoint Better Auth handler (login, register, OAuth, 2FA)
│   │   ├── leaderboard/        # Endpoint data peringkat global & perolehan XP
│   │   ├── me/                 # Endpoint profil member, riwayat tes, avatar, dan ekspor data
│   │   └── tests/              # Validasi token awal dan pengiriman hasil tes (submit post)
│   ├── db/
│   │   ├── schema/             # Skema Drizzle (auth, tests, stats, settings, files)
│   │   └── index.ts            # Koneksi pooler Postgres Drizzle ORM
│   ├── middleware/             # Admin guard (IP allowlist, 2FA check), monitoring, dan security headers
│   └── utils/                  # Replay engine anti-cheat, Redis limiter, dan helper kriptografi
│
├── shared/                     # Modul Bersama Klien & Server (Zero-Duplication)
│   ├── config/                 # Definisi bahasa, audio switch, preset leaderboard, dan peran pengguna
│   ├── data/                   # Koleksi korpus kata multi-bahasa, kutipan, dan kode pemrograman
│   ├── schemas/                # Skema validasi Zod (admin payload, test submission, settings)
│   └── utils/                  # Algoritma WPM/akurasi, generator teks seed, dan kalkulator XP
│
├── public/                     # Aset statis PWA, ikon aplikasi, audio switch sound pack, dan favicon
├── drizzle/                    # Berkas SQL hasil generasi migrasi Drizzle Kit
├── tests/                      # Unit testing Vitest (anti-cheat replay, schema, auth, sound)
├── nuxt.config.ts              # Konfigurasi Nuxt 4, modul PWA, i18n, runtimeConfig, dan rute aturan
└── package.json                # Dependensi proyek dan skrip eksekusi Bun
```

---

## ⚡ Instalasi & Setup

### 1. Kloning Repositori
```bash
git clone https://github.com/dayyysss/tachy.git
cd tachy
```

### 2. Pasang Dependensi
Pastikan [Bun](https://bun.sh/) (v1.2+) telah terpasang di sistem operasi Anda:
```bash
bun install
```

### 3. Konfigurasi Environment Variables
Salin berkas template konfigurasi lingkungan:
```bash
cp .env.example .env
```

Sesuaikan nilai variabel utama pada `.env`:
```env
# Koneksi Database PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/tachy"
DIRECT_URL="postgresql://postgres:password@localhost:5432/tachy"

# In-Memory Cache & Leaderboard (Redis)
UPSTASH_REDIS_REST_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Rahasia Sesi Better Auth
BETTER_AUTH_SECRET="kunci-rahasia-autentikasi-minimal-32-karakter"
BETTER_AUTH_URL="http://localhost:3000"
NUXT_PUBLIC_SITE_URL="http://localhost:3000"

# Kunci Tanda Tangan Sesi Anti-Cheat
TEST_TOKEN_SECRET="kunci-rahasia-tanda-tangan-anti-cheat-sesi"

# Rute Gerbang Admin Stealth (Sesuaikan nilai ini untuk keamanan produksi)
ADMIN_LOGIN_PATH="your-secret-login-path"
ADMIN_PANEL_PREFIX="your-secret-panel-prefix"
ADMIN_REQUIRE_2FA="true"

# Penyedia OAuth (Opsional untuk Login Google/GitHub)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

### 4. Migrasi Database
Jalankan migrasi skema database menggunakan Drizzle Kit:
```bash
# Menjalankan migrasi struktur tabel ke database
bun run db:migrate

# (Opsional) Buka visualisasi Drizzle Studio
bun run db:studio
```

Untuk membuat akun administrator pertama:
```bash
bun run scripts/seed-admin.ts
```

### 5. Jalankan Server Development
```bash
bun run dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000). Konsol admin dapat diakses melalui path yang telah dikonfigurasi pada environment variable (`ADMIN_LOGIN_PATH`).

### 6. Pengujian & Kompilasi Produksi
```bash
# Menjalankan rangkaian unit test otomatis (Vitest)
bun x vitest run

# Kompilasi aplikasi untuk rilis produksi (Nitro Node Server)
bun run build
```

---

## 🔐 Mesin Anti-Cheat & Keamanan

Tachy menerapkan pertahanan berlapis untuk menjamin keadilan papan peringkat dan keamanan platform:

### 1. Verifikasi Keystroke Deterministik (Server-Side)
- **Signed Session Token**: Saat tes dimulai, server menerbitkan token berbatas waktu yang ditandatangani secara kriptografis menggunakan `TEST_TOKEN_SECRET`. Token memuat seed kata acak dan timestamp awal yang tidak dapat diubah oleh klien.
- **Keystroke Replay Simulation**: Saat tes dikirimkan, modul `replaySession` di server menyimulasikan ulang seluruh urutan tombol yang ditekan berdasarkan seed awal untuk menghitung WPM, akurasi, dan konsistensi secara independen.
- **Timing Anomaly Inspection**: Fungsi `assessTest` dan `hardReject` mendeteksi ketukan tidak manusiawi, seperti interval antar-tombol di bawah batas refleks biologis (0–10ms seragam), ritme tombol berpola robotik, atau injeksi teks instan via *clipboard*.

### 2. Stealth Admin Guard
- **Penyamaran Rute Konsol**: Percobaan akses ke jalur admin standar (`/admin`, `/wp-admin`, `/dashboard`) ditolak secara diam-diam. Akses khusus dilindungi rute kustom dinamis `ADMIN_LOGIN_PATH`.
- **404 Not Found Abort**: Permintaan tidak terotorisasi ke rute API administratif (`/api/admin/**`) merespons kode status `404 Not Found` (bukan 403 Forbidden) guna mencegah enumerasi endpoint oleh pemindai otomatis.
- **Zero-Leak SEO Protection**: Rute dan direktori administratif di-exclude dari `sitemap.xml` dan dilindungi header `X-Robots-Tag: noindex, nofollow` agar tidak terindeks oleh mesin pencari.
- **Proteksi Aksi Destruktif**: Operasi kritis seperti penghapusan akun, reset skor, dan pembersihan cache mewajibkan validasi ulang kode 2FA TOTP segar (`x-admin-reauth`).

### 3. Keamanan HTTP & Rate Limiting
- Dilengkapi header keamanan ketat: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` (anti-clickjacking), dan `Strict-Transport-Security` (HSTS).
- Pembatasan frekuensi permintaan (*sliding-window rate limiting*) via Upstash Redis pada endpoint login dan submit tes guna mencegah serangan *brute-force* maupun *DoS*.

---

## 🎨 Pengalaman Taktil & Kustomisasi

Tachy dirancang untuk memuaskan indera penglihatan dan pendengaran para pegiat keyboard mekanikal:
1. **Sintesis Audio Berlatensi Rendah**: Menggunakan Web Audio API terkompresi untuk memicu suara ketukan tombol tanpa jeda input (*zero audio delay*). Tersedia berbagai profil suara switch populer.
2. **Kustomisasi Tema DaisyUI**: Menyediakan puluhan tema bawaan (terang, gelap, retro, cyberpunk, synthwave, forest, aqua, dracula, nord, dan tema eksklusif Tachy) yang tersinkronisasi instan ke seluruh antarmuka dan diagram.
3. **PWA & Aksesibilitas**: Konfigurasi Service Worker PWA (*Progressive Web App*) untuk aksesibilitas saat luring (*offline capability*) serta kepatuhan penuh terhadap standar `prefers-reduced-motion`.
4. **Layout Responsif Mobile**: Navigasi ramah perangkat layar sentuh dengan tata letak visualizer fleksibel dan padding *safe-area*.

---

## 📄 Kontribusi & Lisensi

Kontribusi kode, penambahan daftar kata bahasa baru, atau pelaporan bug sangat diapresiasi! Silakan ajukan melalui [GitHub Issues](https://github.com/dayyysss/tachy/issues) atau kirimkan Pull Request dengan mengikuti standar kode proyek.

Proyek ini dirilis di bawah naungan lisensi [GNU General Public License v3.0 (GPL-3.0)](LICENSE).

---

<p align="center">
  <sub>Dibangun dengan dedikasi tinggi pada kecepatan, ketelitian anti-cheat, dan estetika minimalis modern.</sub>
  <br />
  <sub>© 2026 Tachy Platform. Hak cipta dilindungi.</sub>
</p>
