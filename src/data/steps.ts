export interface PrepStep {
  id: string
  title: string
  when: string
  body: string
  tips: string[]
}

// Urutan persiapan umroh mandiri. Isi perlu dicek ulang tiap ada perubahan aturan.
export const PREP_STEPS: PrepStep[] = [
  {
    id: 'paspor',
    title: 'Paspor berlaku minimal 6 bulan',
    when: '4–6 bulan sebelum berangkat',
    body: 'Masa berlaku paspor dihitung dari tanggal berangkat. Kalau kurang dari 6 bulan, perpanjang dulu di kantor imigrasi atau lewat aplikasi M-Paspor.',
    tips: ['Pastikan nama di paspor sama persis dengan tiket pesawat', 'Simpan foto paspor di tempat aman'],
  },
  {
    id: 'vaksin',
    title: 'Vaksin meningitis, polio, dan e-ICV',
    when: '1–3 bulan sebelum berangkat',
    body: 'Lakukan vaksinasi di klinik atau KKP yang melayani vaksin perjalanan. Minta sertifikat vaksin internasional elektronik (e-ICV).',
    tips: ['Jadwalkan minimal 10 hari sebelum berangkat', 'Bawa paspor saat vaksin'],
  },
  {
    id: 'tiket',
    title: 'Tiket pesawat pulang-pergi',
    when: '2–4 bulan sebelum berangkat',
    body: 'Tiket PP adalah salah satu syarat umroh mandiri. Bandingkan rute langsung dan transit, dan cek apakah mendarat di Jeddah atau Madinah karena ini menentukan miqat.',
    tips: ['Harga biasanya naik menjelang Ramadan dan liburan sekolah', 'Cek batas bagasi untuk air zamzam'],
  },
  {
    id: 'hotel',
    title: 'Hotel di Makkah dan Madinah',
    when: '1–3 bulan sebelum berangkat',
    body: 'Pilih hotel berdasarkan jarak jalan kaki ke Masjidil Haram dan Masjid Nabawi. Hotel yang lebih jauh lebih murah, tapi perhitungkan biaya transport dan tenaga.',
    tips: ['Cek apakah harga sudah termasuk sarapan', 'Simpan alamat hotel dalam bahasa Arab di kartu darurat'],
  },
  {
    id: 'nusuk',
    title: 'Akun Nusuk dan visa umroh',
    when: '1–2 bulan sebelum berangkat',
    body: 'Daftarkan akun di platform resmi Nusuk, lalu ajukan visa umroh mandiri. Ikuti juga ketentuan pendaftaran dari Kementerian Haji dan Umrah RI.',
    tips: ['Gunakan email yang aktif', 'Siapkan foto paspor dan pas foto latar putih'],
  },
  {
    id: 'asuransi',
    title: 'Asuransi perjalanan',
    when: '2–4 minggu sebelum berangkat',
    body: 'Pilih asuransi yang menanggung biaya kesehatan di Arab Saudi dan pembatalan penerbangan.',
    tips: ['Simpan nomor polis dan kontak klaim di kartu darurat'],
  },
  {
    id: 'raudhah',
    title: 'Jadwal (tasrih) Raudhah',
    when: 'Setelah visa terbit',
    body: 'Masuk Raudhah di Masjid Nabawi memerlukan izin yang dipesan lewat aplikasi Nusuk. Kuotanya terbatas, jadi pesan sejak jauh hari.',
    tips: ['Cek ulang jadwal yang tersedia setiap pagi'],
  },
  {
    id: 'manasik',
    title: 'Belajar manasik',
    when: '2–4 minggu sebelum berangkat',
    body: 'Pelajari urutan ibadah umroh, doa-doa utama, dan larangan ihram. Ikuti kelas manasik dan simulasikan bersama teman seperjalanan.',
    tips: ['Baca panduan di tab Ibadah', 'Hafalkan talbiyah'],
  },
  {
    id: 'esim',
    title: 'eSIM atau kartu SIM Saudi',
    when: '1 minggu sebelum berangkat',
    body: 'Roaming dari operator Indonesia biasanya mahal. Siapkan eSIM atau beli kartu SIM lokal di bandara.',
    tips: ['Pastikan HP kamu mendukung eSIM', 'Unduh peta offline Makkah dan Madinah'],
  },
  {
    id: 'riyal',
    title: 'Tukar riyal secukupnya',
    when: '1 minggu sebelum berangkat',
    body: 'Bawa uang tunai secukupnya untuk hari-hari pertama. Sisanya bisa dibayar dengan kartu atau ditarik di ATM setempat.',
    tips: ['Catat kurs yang kamu dapat di menu Biaya'],
  },
]
