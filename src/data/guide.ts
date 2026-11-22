// DRAF KONTEN — wajib di-review mutawwif/ustadz sebelum rilis.
// Ditulis dari pengetahuan umum manasik umroh. Jangan menyalin materi dari aplikasi lain tanpa izin.

export interface Doa {
  arab: string
  latin: string
  arti: string
  sumber?: string
}

export interface GuideSection {
  id: string
  title: string
  summary: string
  paragraphs: string[]
  points?: string[]
  doa?: Doa[]
  isStep?: boolean // bagian dari urutan pelaksanaan umroh
}

export const REVIEW_NOTE = 'Draf panduan. Belum di-review mutawwif.'

export const GUIDE: GuideSection[] = [
  {
    id: 'pengertian',
    title: 'Apa itu umroh',
    summary: 'Ziarah ke Baitullah dengan rangkaian ibadah tertentu.',
    paragraphs: [
      'Umroh adalah ibadah mengunjungi Ka\'bah di Masjidil Haram dengan berihram dari miqat, tawaf, sa\'i antara Shafa dan Marwah, lalu tahallul. Berbeda dengan haji, umroh bisa dilakukan kapan saja sepanjang tahun.',
      'Rangkaian umroh bisa selesai dalam beberapa jam. Waktu sisanya biasanya dipakai untuk memperbanyak ibadah di Masjidil Haram dan Masjid Nabawi.',
    ],
  },
  {
    id: 'rukun',
    title: 'Rukun dan wajib umroh',
    summary: 'Yang tidak boleh ditinggalkan, dan yang perlu diganti dam bila terlewat.',
    paragraphs: [
      'Ulama berbeda pendapat tentang pembagian rukun dan wajib umroh. Tanyakan pegangan yang kamu ikuti kepada pembimbingmu.',
    ],
    points: [
      'Rukun: ihram (niat), tawaf, dan sa\'i. Sebagian ulama memasukkan tahallul sebagai rukun.',
      'Wajib: berihram dari miqat dan mencukur atau memendekkan rambut.',
      'Rukun yang tertinggal membuat umroh tidak sah sampai dikerjakan. Wajib yang tertinggal diganti dengan dam.',
    ],
  },
  {
    id: 'miqat',
    title: 'Miqat',
    summary: 'Batas tempat mulai berihram. Jangan sampai terlewat.',
    isStep: true,
    paragraphs: [
      'Miqat adalah batas tempat jemaah wajib berniat ihram sebelum masuk wilayah Makkah. Jemaah dari Indonesia yang terbang langsung ke Jeddah melewati miqat di udara, sehingga biasanya berihram di pesawat sebelum pesawat melintasinya.',
      'Jemaah yang ke Madinah lebih dulu berihram dari Dzulhulaifah (Bir Ali) saat berangkat dari Madinah menuju Makkah.',
    ],
    points: [
      'Siapkan pakaian ihram di kabin, bukan di bagasi.',
      'Tanyakan ke awak kabin kapan pesawat mendekati miqat.',
      'Mandi sunnah dan memakai wewangian di badan (bukan di kain ihram) dilakukan sebelum berniat.',
    ],
  },
  {
    id: 'ihram',
    title: 'Niat ihram dan talbiyah',
    summary: 'Mulai masuk keadaan ihram, lalu perbanyak talbiyah.',
    isStep: true,
    paragraphs: [
      'Pria memakai dua helai kain tanpa jahitan yang membentuk pakaian. Wanita memakai pakaian syar\'i yang menutup aurat, tanpa cadar dan sarung tangan.',
      'Setelah berniat, ucapkan talbiyah sesering mungkin sampai tiba di Masjidil Haram dan memulai tawaf. Pria mengeraskan suara, wanita cukup terdengar diri sendiri.',
    ],
    doa: [
      { arab: 'لَبَّيْكَ اللَّهُمَّ عُمْرَةً', latin: 'Labbaika Allāhumma \'umratan', arti: 'Aku penuhi panggilan-Mu ya Allah untuk berumroh.' },
      {
        arab: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
        latin: 'Labbaika Allāhumma labbaik, labbaika lā syarīka laka labbaik, innal ḥamda wan-ni\'mata laka wal-mulk, lā syarīka lak',
        arti: 'Aku penuhi panggilan-Mu ya Allah. Tiada sekutu bagi-Mu. Sesungguhnya segala puji, nikmat, dan kerajaan milik-Mu. Tiada sekutu bagi-Mu.',
        sumber: 'HR. Bukhari dan Muslim',
      },
    ],
  },
  {
    id: 'larangan',
    title: 'Larangan saat ihram',
    summary: 'Hal yang tidak boleh dilakukan sampai tahallul.',
    paragraphs: ['Larangan ini berlaku sejak berniat ihram sampai selesai tahallul.'],
    points: [
      'Memakai wewangian setelah berniat.',
      'Memotong rambut dan kuku.',
      'Pria: memakai pakaian berjahit yang membentuk tubuh dan menutup kepala.',
      'Wanita: memakai cadar dan sarung tangan.',
      'Berburu binatang darat.',
      'Akad nikah dan berhubungan suami istri.',
      'Bertengkar dan berkata kotor.',
    ],
  },
  {
    id: 'tawaf',
    title: 'Tawaf',
    summary: 'Mengelilingi Ka\'bah tujuh kali, mulai dan berakhir di Hajar Aswad.',
    isStep: true,
    paragraphs: [
      'Tawaf dimulai dari garis sejajar Hajar Aswad, dengan Ka\'bah berada di sebelah kiri. Satu putaran dihitung dari Hajar Aswad kembali ke Hajar Aswad. Dalam keadaan suci dari hadats.',
      'Pria disunnahkan idhthiba\' (membuka bahu kanan) selama tawaf umroh dan berjalan cepat (raml) di tiga putaran pertama bila memungkinkan.',
      'Tidak ada doa khusus untuk tiap putaran. Perbanyak doa dan dzikir dengan bahasa yang kamu pahami.',
    ],
    points: ['Gunakan penghitung tawaf di aplikasi ini agar tidak lupa hitungan.', 'Kalau ragu jumlah putaran, ambil hitungan yang lebih sedikit.'],
    doa: [
      { arab: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ', latin: 'Bismillāhi wallāhu akbar', arti: 'Dengan nama Allah, Allah Mahabesar. (Saat memulai tiap putaran di Hajar Aswad.)' },
      {
        arab: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
        latin: 'Rabbanā ātinā fid-dunyā ḥasanah, wa fil-ākhirati ḥasanah, wa qinā \'adzāban-nār',
        arti: 'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari azab neraka. (Antara Rukun Yamani dan Hajar Aswad.)',
        sumber: 'QS. Al-Baqarah: 201',
      },
    ],
  },
  {
    id: 'maqam',
    title: 'Shalat di belakang Maqam Ibrahim dan minum zamzam',
    summary: 'Dua rakaat setelah tawaf, lalu minum air zamzam.',
    isStep: true,
    paragraphs: [
      'Setelah tawaf, tutup kembali bahu kanan, lalu shalat dua rakaat di belakang Maqam Ibrahim. Kalau padat, boleh di bagian mana saja dari masjid.',
      'Setelah shalat, minum air zamzam dan berdoa.',
    ],
  },
  {
    id: 'sai',
    title: 'Sa\'i',
    summary: 'Berjalan tujuh kali antara Shafa dan Marwah, mulai dari Shafa.',
    isStep: true,
    paragraphs: [
      'Sa\'i dimulai di bukit Shafa dan berakhir di Marwah. Shafa ke Marwah dihitung satu kali, Marwah ke Shafa dihitung satu kali lagi, sehingga putaran ketujuh berakhir di Marwah.',
      'Di antara dua lampu hijau, pria disunnahkan berlari kecil. Sa\'i tidak disyaratkan suci dari hadats, tapi lebih utama dalam keadaan suci.',
    ],
    doa: [
      {
        arab: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ',
        latin: 'Innaṣ-ṣafā wal-marwata min sya\'ā\'irillāh',
        arti: 'Sesungguhnya Shafa dan Marwah adalah sebagian syiar Allah. (Dibaca saat mendekati Shafa di awal sa\'i.)',
        sumber: 'QS. Al-Baqarah: 158',
      },
      { arab: 'أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ', latin: 'Abda\'u bimā bada\'allāhu bih', arti: 'Aku memulai dengan apa yang Allah mulai.' },
    ],
  },
  {
    id: 'tahallul',
    title: 'Tahallul',
    summary: 'Mencukur atau memendekkan rambut. Umroh selesai.',
    isStep: true,
    paragraphs: [
      'Pria mencukur habis (lebih utama) atau memendekkan rambut dari seluruh bagian kepala. Wanita memotong ujung rambut sekitar satu ruas jari.',
      'Setelah tahallul, semua larangan ihram gugur dan rangkaian umroh selesai.',
    ],
  },
]
