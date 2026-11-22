# Pejuang Umrah Mandiri

Teman perjalanan umroh mandiri untuk anak muda: persiapan dokumen, estimasi biaya, tabungan, catatan pengeluaran (SAR/IDR), panduan manasik offline, penghitung tawaf & sa'i, dan kartu darurat.

Satu kode web (React + Vite, PWA offline-first) dibungkus [Capacitor](https://capacitorjs.com) menjadi aplikasi **Android** dan **iOS**. Semua data pengguna tersimpan lokal di perangkat (IndexedDB via Dexie). Belum ada backend.

> ⚠️ Konten panduan ibadah di `src/data/guide.ts` masih **draf** dan wajib di-review mutawwif/ustadz sebelum rilis. Jangan menyalin materi dari aplikasi lain tanpa izin tertulis.

## Fitur MVP

| Menu | Isi |
| --- | --- |
| Beranda | Hitung mundur keberangkatan, progres persiapan, ringkasan tabungan & pengeluaran |
| Persiapan | 10 langkah (paspor → riyal) dengan status, checklist barang bawaan yang bisa ditambah |
| Biaya | Estimasi biaya hemat/nyaman (bisa diedit & dibagikan), target tabungan, pengeluaran multi-mata uang |
| Ibadah | Urutan umroh dari miqat sampai tahallul + doa Arab/latin/arti, penghitung tawaf & sa'i dengan getaran |
| Darurat | Nomor darurat Saudi, kartu alamat hotel berbahasa Arab, info medis |
| Umroh bareng | Samakan data dengan partner lewat kode yang dikirim via WhatsApp, tanpa akun dan tanpa server |

## Sinkronisasi tanpa server

Semua data tetap di perangkat. Menu **Umroh bareng** mengemas data perjalanan menjadi satu kode teks (`PUM1z:…`, JSON ter-gzip dalam base64) yang dikirim lewat WhatsApp, lalu digabung di HP partner (`src/lib/sync.ts`).

- Tiap catatan punya `uid` dan `updatedAt`. Saat digabung, perubahan paling baru yang menang.
- Hapus disimpan sebagai penanda (`deleted`) supaya ikut tersinkron.
- Info medis dan kontak darurat tidak ikut dikirim.
- Supaya dua HP sama persis, kedua pihak saling mengirim kode.

## Struktur

```
src/
  data/        konten statis (langkah persiapan, checklist, biaya default, panduan)
  pages/       satu file per layar
  components/  Layout (bottom nav) dan komponen UI
  db.ts        skema IndexedDB (Dexie)
android/       proyek Android (Capacitor)
ios/           proyek iOS (Capacitor, Swift Package Manager)
resources/     sumber ikon & splash (generate ulang: npx @capacitor/assets generate)
```

## Menjalankan

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # hasil di dist/
npx cap sync         # salin dist/ ke android/ dan ios/
```

## Rilis Android (Google Play)

Build otomatis berjalan di GitHub Actions (`.github/workflows/android.yml`) setiap push ke `main`:

- **Selalu**: APK debug, bisa diunduh dari tab *Actions → run terbaru → Artifacts* untuk dicoba di HP.
- **Setelah secrets dipasang**: AAB rilis yang sudah ditandatangani, siap di-upload ke Play Console. `versionCode` otomatis memakai nomor run.

### 1. Buat keystore (sekali saja, simpan baik-baik)

```bash
keytool -genkey -v -keystore pejuang-umrah.jks -keyalg RSA -keysize 2048 -validity 10000 -alias pejuang-umrah
base64 -w0 pejuang-umrah.jks > keystore.b64   # macOS: base64 -i pejuang-umrah.jks
```

Kalau keystore hilang, kamu tidak bisa lagi meng-update aplikasi di Play Store (kecuali memakai Play App Signing, yang sangat disarankan).

### 2. Pasang secrets di GitHub

*Settings → Secrets and variables → Actions → New repository secret*:

| Secret | Isi |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | isi file `keystore.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | password keystore |
| `ANDROID_KEY_ALIAS` | `pejuang-umrah` |
| `ANDROID_KEY_PASSWORD` | password key |

Untuk build lokal, buat `android/keystore.properties` (sudah di-ignore git):

```
storeFile=/path/ke/pejuang-umrah.jks
storePassword=...
keyAlias=pejuang-umrah
keyPassword=...
```

lalu `cd android && ./gradlew bundleRelease`.

### 3. Upload ke Play Console

1. Daftar akun [Google Play Console](https://play.google.com/console) (biaya sekali bayar).
2. Buat aplikasi baru → aktifkan **Play App Signing**.
3. Isi listing: nama, deskripsi, ikon 512px (`public/icons/icon-512.png`), screenshot, kebijakan privasi (wajib, bisa berupa halaman web sederhana), formulir keamanan data (aplikasi ini tidak mengirim data ke server).
4. Upload AAB ke **Internal testing** dulu, lalu Closed testing. Akun developer personal baru wajib menjalankan closed testing dengan sejumlah tester selama periode tertentu sebelum boleh rilis produksi. Cek syarat terbarunya di Play Console.
5. Promosikan ke Production.

## Rilis iOS (App Store)

Membutuhkan **Mac dengan Xcode** dan akun **Apple Developer Program** (berbayar tahunan).

```bash
npm install && npm run build && npx cap sync ios
npx cap open ios
```

Di Xcode: pilih Team di *Signing & Capabilities*, atur versi/build, lalu *Product → Archive → Distribute App → App Store Connect*. Uji lewat TestFlight sebelum submit review.

## Identitas aplikasi

- App ID / package: `com.chalidade.pejuangumrah` (tidak bisa diganti setelah rilis di Play Store)
- Nama di HP: Pejuang Umrah
- Warna: biru langit `#1857F0`, kuning matahari `#FFB423`, putih `#FFFFFF` (tema "Langit" dengan coretan tulisan tangan Caveat)

## Roadmap berikutnya

- Split bill antar teman (siapa bayar apa)
- Sinkron otomatis/real-time (butuh server relay kecil)
- Trip Pass (pembayaran: Google Play Billing / StoreKit)
- Pengingat miqat, mode offline peta, kuliner hidden gem, hack umroh
- Tanya Mutawwif & mutawwif on-call
- Doa titipan dan kartu recap trip
