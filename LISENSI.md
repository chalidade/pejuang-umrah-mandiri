# Lisensi Pejuang Umrah Pro

Model: **sekali bayar, seumur hidup**. Satu kunci bisa dipakai di **2 HP**.
Server lisensi jalan di Cloudflare Workers + D1 (gratis, tidak tidur).
Selama server belum disiapkan, aplikasi tetap jalan seperti biasa dan semua fitur terbuka.

## Yang gratis vs Pro

| Fitur | Gratis | Pro |
|---|---|---|
| Tabungan | 3 setoran | Tanpa batas |
| Pengeluaran | 5 catatan | Tanpa batas |
| Persiapan | 3 langkah pertama penuh, sisanya separuh | Semua penuh |
| Sinkron bareng pasangan | Terkunci | Terbuka |

Batasnya bisa diubah di `src/lib/lisensi.ts` (`GRATIS`).

## Setup sekali (±15 menit)

1. **Daftar Cloudflare** di https://dash.cloudflare.com/sign-up (gratis).
2. **Buat database D1**: menu *Storage & Databases → D1 → Create*, nama `pejuang-umrah-lisensi`.
   Salin **Database ID**-nya. Tabel dibuat otomatis saat server pertama kali dipanggil.
3. **Buat API token**: *My Profile → API Tokens → Create Token → template "Edit Cloudflare Workers"*,
   tambahkan izin **Account · D1 · Edit**. Salin tokennya.
4. **Catat Account ID**: ada di sidebar kanan halaman Workers & Pages.
5. **Buat kunci admin**: kata sandi panjang buatanmu sendiri (min. 24 karakter acak). Ini untuk halaman Admin lisensi.
6. Di GitHub repo → *Settings → Secrets and variables → Actions*:
   - **Secrets**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, `ADMIN_KUNCI`
7. Jalankan workflow **Deploy server lisensi (Cloudflare)** (tab Actions → Run workflow).
   Di log akan muncul alamat server, mis. `https://pejuang-umrah-lisensi.<akun>.workers.dev`.
8. Masih di *Secrets and variables → Actions*, tab **Variables**:
   - `LISENSI_API` = alamat server dari langkah 7 (tanpa `/` di akhir)
   - `LISENSI_BELI` = link beli, mis. `https://wa.me/62812xxxx?text=Halo%2C%20mau%20beli%20Pejuang%20Umrah%20Pro`
9. Jalankan ulang workflow **Deploy web (GitHub Pages)**. Paywall sekarang aktif.

## Menjual kunci (manual)

1. Pembeli transfer, konfirmasi lewat WhatsApp.
2. Buka **Pengaturan → Untuk tim → Admin lisensi** (atau `/admin-lisensi`), masukkan kunci admin.
3. Isi nama + nomor WA pembeli → **Buat kunci** → **Kirim via WhatsApp**.
4. Pembeli buka **Pengaturan → Pejuang Umrah Pro**, tempel kunci, **Aktifkan**.

Di halaman admin juga bisa: cari pembeli, lepas HP lama (kalau pembeli ganti HP), cabut kunci (refund/disebar), dan pulihkan.

## Catatan

- Setelah aktif, aplikasi tetap Pro meski offline. Saat online, status dicek ulang sehari sekali, jadi kunci yang dicabut akan terkunci lagi.
- Tanda tangan lisensi pakai ECDSA P-256; kunci privat hanya ada di database D1, tidak pernah di aplikasi.
- Pengunci ada di sisi aplikasi, jadi orang yang paham teknis tetap bisa membongkarnya. Untuk aplikasi seharga ini, itu risiko yang wajar.
- **Play Store**: menjual fitur digital di dalam aplikasi Android wajib lewat Google Play Billing (atau *user choice billing* yang tersedia di Indonesia). Aman: jual kunci lewat website/WhatsApp untuk versi PWA, dan untuk versi Play Store sembunyikan tombol beli atau pakai Play Billing nanti.
