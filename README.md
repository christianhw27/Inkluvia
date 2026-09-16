# Inkluvia - Vue 3 + Tailwind CSS v4 + Cloudinary + Supabase

Proyek starter modern berbasis **Vue 3**, **Vite**, **Tailwind CSS v4**, **Font Poppins**, **Cloudinary** (Video Storage), dan **Supabase** (Database & Auth).

---

## 🚀 Fitur & Setup

- ⚡ **Vue 3 + Vite**: Setup modern dengan HMR ultra-cepat dan Composition API.
- 🎨 **Tailwind CSS v4**: Menggunakan `@tailwindcss/vite` (zero-config, tanpa `tailwind.config.js`).
- ✍️ **Font Poppins**: Terintegrasi secara global via Google Fonts & `@theme` CSS.
- 📹 **Cloudinary Video Storage**: Helper siap pakai di `src/lib/cloudinary.js` untuk direct unsigned video upload dan streaming URL teroptimasi.
- 🗄️ **Supabase Client**: Helper siap pakai di `src/lib/supabaseClient.js` untuk database Postgres dan autentikasi.
- 💎 **Lucide Icons**: Koleksi ikon dari `@lucide/vue`.
- 🔐 **Keamanan**: `.env.local` dan `.env` sudah terdaftar di `.gitignore`.

---

## 🛠️ Konfigurasi Service

Salin `.env.example` ke `.env.local`:
```bash
cp .env.example .env.local
```

Lalu isi kredensial masing-masing saat Anda sudah siap:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Cloudinary (Penyimpanan Video)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-unsigned-upload-preset
```

> **Catatan Cloudinary**: Buat Unsigned Upload Preset di **Settings > Upload > Upload presets > Add preset** dan pilih mode **Unsigned**.

---

## 💻 Cara Menjalankan

```bash
# Menjalankan local development server
npm run dev

# Membangun bundle production
npm run build
```

---

## 📂 Struktur Direktori

```text
inkluvia/
├── .env.example            # Template variabel lingkungan
├── .env.local              # Kredensial lokal (diabaikan git)
├── index.html              # HTML entry dengan Google Fonts (Poppins)
├── package.json
├── vite.config.js          # Konfigurasi Vite & Tailwind CSS v4
├── src/
│   ├── assets/             # Asset statis
│   ├── components/         # Komponen aplikasi Vue
│   ├── lib/
│   │   ├── cloudinary.js   # Helper upload & streaming video Cloudinary
│   │   └── supabaseClient.js # Inisialisasi Supabase client
│   ├── App.vue             # Dashboard verifikasi & contoh kode
│   ├── main.js             # Entry point Vue
│   └── style.css           # Styling dasar Tailwind CSS & tema font Poppins
```
