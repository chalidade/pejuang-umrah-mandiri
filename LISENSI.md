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

## Setup

Sudah siap: database D1 `pejuang-umrah-lisensi`, Account ID dan Database ID (di `server/lisensi/wrangler.toml`),
alamat server `https://pejuang-umrah-lisensi.chalidade.workers.dev`.

Tinggal dua secret di GitHub (*Settings → Secrets and variables → Actions → New repository secret*):

1. `CLOUDFLARE_API_TOKEN`: buat di Cloudflare *My Profile → API Tokens → Create Token → Custom token*,
   izin **Account · Workers Scripts · Edit**, **Account · D1 · Edit**, **Account · Account Settings · Read**.
2. `ADMIN_KUNCI`: kata sandi panjang buatanmu sendiri (min. 24 karakter). Dipakai di halaman Admin lisensi.

Lalu jalankan workflow **Deploy server lisensi (Cloudflare)** (tab Actions → Run workflow).
Workflow itu otomatis menerbitkan ulang web, dan paywall langsung aktif.

Opsional (*Variables*): `LISENSI_BELI` = link beli, mis. `https://wa.me/62812xxxx?text=Mau%20beli%20Pejuang%20Umrah%20Pro`.

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
