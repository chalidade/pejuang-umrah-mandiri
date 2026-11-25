# Panduan tim konten

Isi tab **Panduan → Ibadah**, **Destinasi**, dan **Tips** bisa diubah tanpa ngoding, langsung dari aplikasi:
**Pengaturan → Kelola konten**, atau https://pejuangumrah.my.id/kelola

Ada dua cara: **kirim usulan** (untuk semua anggota tim) dan **terbitkan langsung** (khusus admin).

## Kirim usulan (anggota tim)

Cukup punya akun GitHub gratis (https://github.com/signup). Tidak perlu diundang, tidak perlu kunci.

1. Buka Kelola konten. Pilih **Ibadah**, **Destinasi**, atau **Tips**, lalu **+ Tambah** atau ketuk **Ubah**.
2. Isi formulirnya:
   - **Penjelasan:** tekan Enter dua kali untuk paragraf baru.
   - **Tips / Poin-poin:** satu per baris.
   - **Link Google Maps:** boleh kosong, aplikasi mencari otomatis dari nama tempat.
   - **Video dan foto:** tempel link YouTube, TikTok (link lengkap yang ada `/video/…`, bukan `vt.tiktok.com`), Instagram (post atau reel), atau link langsung ke foto. Media pertama tampil paling atas dan jadi gambar di daftar.
   - **Menit mulai (YouTube):** untuk satu video panjang yang dipakai banyak materi, isi menit mulai per materi, misalnya `01:06`. Video langsung mulai dari bagian itu.
   - **Doa (khusus Ibadah):** teks Arab, latin, arti, dan sumber.
3. Tekan **Lanjut kirim usulan**, isi namamu, lalu **Buka GitHub dan kirim**.
4. GitHub terbuka dengan usulan yang sudah terisi. Tekan **Create / Submit new issue**. Selesai.

Beberapa detik kemudian sistem memeriksa usulanmu dan memberi komentar. Kalau ada yang kurang, komentarnya menjelaskan apa yang perlu diperbaiki; kirim usulan baru dari aplikasi.

## Menyetujui usulan (pemilik repo)

1. Buka issue usulan (ada label **usulan-konten**). Baca isinya.
2. Setuju? Beri label **disetujui** (bisa dari aplikasi GitHub di HP).
3. Sistem memasukkan konten, men-deploy website, berkomentar, lalu menutup issue. Sekitar 2 menit kemudian tayang.

Tidak setuju? Tutup issue-nya saja, beri komentar alasannya. Label **disetujui** dari orang tanpa akses tulis diabaikan.

## Terbitkan langsung (admin)

Untuk yang sering mengisi dan sudah dipercaya:

1. Undang dia: repo → Settings → Collaborators → Add people.
2. Dia membuat kunci akses di https://github.com/settings/personal-access-tokens/new
   - **Repository access:** Only select repositories → `pejuang-umrah-mandiri`
   - **Permissions → Contents:** Read and write
3. Di Kelola konten, ketuk **Admin? Masuk dengan kunci akses**, tempel kuncinya.
4. Ubah konten, lalu tekan **Terbitkan**.

Admin juga bisa:
- **Unggah foto** langsung dari HP. Foto dikecilkan otomatis lalu disimpan di repo (`public/media`), dan tampil setelah diterbitkan.
- Mengatur **kategori Ibadah** (tambah, ganti nama, urutkan) lewat tombol **Kategori** di tab Ibadah.

## Aturan isi

- Tulis sendiri. Jangan menyalin dari aplikasi, buku, atau situs lain tanpa izin.
- Video: pakai video milik sendiri atau video yang memang bisa di-embed. Kita hanya menampilkan video aslinya dari YouTube/TikTok/Instagram, tidak mengunduh atau mengunggah ulang.
- Hindari harga dan jam buka yang pasti: cepat berubah.
- Hal yang menyangkut ibadah dicek dulu bersama mutawwif.
- Konten yang tidak lengkap atau rusak tidak akan tayang: aplikasi tetap memakai versi terakhir yang benar.

## Produk dan link afiliasi

Setiap materi Ibadah, Destinasi, dan Tips punya isian **Rekomendasi produk**. Ada juga tab **Produk** untuk perlengkapan umum.

- **Nama produk** dan **link afiliasi** wajib. Link harus lengkap, diawali `https://` (link pendek Shopee `https://s.shopee.co.id/…`, Tokopedia `https://tokopedia.link/…`, dll. boleh).
- **Harga** dan **catatan** boleh kosong. Tulis harga sebagai kisaran, misal `± Rp85 rb`, karena harga toko berubah.
- Di tab **Produk**, pilih **Tombol Beli di checklist** supaya barang itu mendapat tombol Beli di checklist Persiapan.
- Aplikasi otomatis menampilkan nama toko (Shopee, Tokopedia, Lazada, Traveloka, tiket.com, Agoda, Klook, Airalo, dll.) dan catatan bahwa link adalah link afiliasi.
- Pilih produk yang benar-benar layak direkomendasikan. Kepercayaan pengguna lebih mahal dari komisinya.
