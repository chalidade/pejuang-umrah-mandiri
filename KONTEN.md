# Panduan tim konten

Isi tab **Panduan → Destinasi** dan **Panduan → Tips** bisa diubah tanpa ngoding, langsung dari aplikasi:
**Pengaturan → Kelola konten**, atau https://pejuangumrah.my.id/kelola

Ada dua cara: **kirim usulan** (untuk semua anggota tim) dan **terbitkan langsung** (khusus admin).

## Kirim usulan (anggota tim)

Cukup punya akun GitHub gratis (https://github.com/signup). Tidak perlu diundang, tidak perlu kunci.

1. Buka Kelola konten. Pilih **Destinasi** atau **Tips**, lalu **+ Tambah** atau ketuk **Ubah**.
2. Isi formulirnya:
   - **Penjelasan:** tekan Enter dua kali untuk paragraf baru.
   - **Tips / Poin-poin:** satu per baris.
   - **Link Google Maps:** boleh kosong, aplikasi mencari otomatis dari nama tempat.
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

## Aturan isi

- Tulis sendiri. Jangan menyalin dari aplikasi, buku, atau situs lain tanpa izin.
- Hindari harga dan jam buka yang pasti: cepat berubah.
- Hal yang menyangkut ibadah dicek dulu bersama mutawwif.
- Konten yang tidak lengkap atau rusak tidak akan tayang: aplikasi tetap memakai versi terakhir yang benar.
