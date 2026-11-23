// Bentuk data konten Destinasi & Tips (src/data/rekomendasi.json) dan pemeriksanya.
// Dipakai oleh aplikasi, halaman Kelola konten, dan scripts/cek-konten.ts saat build.
// Sengaja tanpa import: file ini juga dijalankan langsung oleh Node.

export const KOTA_LIST = ['Makkah', 'Madinah'] as const
export const KATEGORI_LIST = ['Ziarah', 'Kuliner', 'Belanja'] as const
export type Kota = (typeof KOTA_LIST)[number]
export type Kategori = (typeof KATEGORI_LIST)[number]

export interface TempatData {
  nama: string
  kota: Kota
  kategori: Kategori
  ringkas: string
  isi: string[]
  tips: string[]
  maps: string
}
export interface TipData {
  judul: string
  ringkas: string
  isi: string[]
  poin: string[]
}
export interface Konten {
  tempat: TempatData[]
  tips: TipData[]
}

/** "Jabal Nur dan Gua Hira" → "jabal-nur-dan-gua-hira" */
export function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const kosong = (s: unknown) => typeof s !== 'string' || s.trim() === ''

/** Daftar masalah dalam bahasa sehari-hari. Kosong berarti aman diterbitkan. */
export function cekKonten(data: unknown): string[] {
  const err: string[] = []
  const d = data as Partial<Konten>
  if (!d || !Array.isArray(d.tempat) || !Array.isArray(d.tips)) return ['Struktur file rusak: harus ada daftar "tempat" dan "tips".']

  const namaDipakai = new Map<string, number>()
  d.tempat.forEach((t, i) => {
    const label = kosong(t?.nama) ? `Tempat ke-${i + 1}` : `Tempat "${t.nama}"`
    if (kosong(t?.nama)) err.push(`${label}: nama belum diisi.`)
    if (!KOTA_LIST.includes(t?.kota as Kota)) err.push(`${label}: kota harus ${KOTA_LIST.join(' atau ')}.`)
    if (!KATEGORI_LIST.includes(t?.kategori as Kategori)) err.push(`${label}: kategori harus ${KATEGORI_LIST.join(', ')}.`)
    if (kosong(t?.ringkas)) err.push(`${label}: ringkasan belum diisi.`)
    if (!Array.isArray(t?.isi) || t.isi.filter((p) => !kosong(p)).length === 0) err.push(`${label}: penjelasan belum diisi.`)
    if (t?.tips != null && !Array.isArray(t.tips)) err.push(`${label}: tips harus berupa daftar.`)
    if (!kosong(t?.maps) && !/^https:\/\//.test(t.maps)) err.push(`${label}: link Maps harus diawali https://`)
    if (!kosong(t?.nama)) {
      const k = slug(t.nama)
      if (namaDipakai.has(k)) err.push(`${label}: namanya sama dengan tempat lain. Bedakan sedikit.`)
      namaDipakai.set(k, i)
    }
  })

  const judulDipakai = new Set<string>()
  d.tips.forEach((t, i) => {
    const label = kosong(t?.judul) ? `Tips ke-${i + 1}` : `Tips "${t.judul}"`
    if (kosong(t?.judul)) err.push(`${label}: judul belum diisi.`)
    if (kosong(t?.ringkas)) err.push(`${label}: ringkasan belum diisi.`)
    const adaIsi = Array.isArray(t?.isi) && t.isi.some((p) => !kosong(p))
    const adaPoin = Array.isArray(t?.poin) && t.poin.some((p) => !kosong(p))
    if (!adaIsi && !adaPoin) err.push(`${label}: isi penjelasan atau poin tipsnya.`)
    if (!kosong(t?.judul)) {
      const k = slug(t.judul)
      if (judulDipakai.has(k)) err.push(`${label}: judulnya sama dengan tips lain.`)
      judulDipakai.add(k)
    }
  })
  return err
}

/** Rapikan sebelum disimpan: buang baris kosong dan spasi berlebih. */
export function rapikan(k: Konten): Konten {
  const bersih = (xs: string[] | undefined) => (xs ?? []).map((x) => x.trim()).filter(Boolean)
  return {
    tempat: k.tempat.map((t) => ({ nama: t.nama.trim(), kota: t.kota, kategori: t.kategori, ringkas: t.ringkas.trim(), isi: bersih(t.isi), tips: bersih(t.tips), maps: (t.maps ?? '').trim() })),
    tips: k.tips.map((t) => ({ judul: t.judul.trim(), ringkas: t.ringkas.trim(), isi: bersih(t.isi), poin: bersih(t.poin) })),
  }
}

export const mapsUrl = (t: Pick<TempatData, 'nama' | 'kota' | 'maps'>) =>
  t.maps?.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.nama} ${t.kota}`)}`

// ── Usulan lewat GitHub Issue ─────────────────────────────────────────────
// Anggota tim mengirim usulan sebagai issue; pemilik repo memberi label "disetujui";
// workflow .github/workflows/usulan-konten.yml menerapkannya (scripts/terapkan-usulan.ts).
export const PENANDA_USULAN = '<!-- pum-usulan v1 -->'
export type Aksi = 'tambah' | 'ubah' | 'hapus'
export type Usulan =
  | { aksi: Aksi; jenis: 'tempat'; sasaran: string | null; data: TempatData | null }
  | { aksi: Aksi; jenis: 'tips'; sasaran: string | null; data: TipData | null }

/** Terapkan satu usulan ke konten. Melempar Error berbahasa sehari-hari kalau tidak bisa. */
export function terapkanUsulan(k: Konten, u: Usulan): Konten {
  if (!u || !['tambah', 'ubah', 'hapus'].includes(u.aksi) || !['tempat', 'tips'].includes(u.jenis)) throw new Error('Format usulan tidak dikenali.')
  const kunci = (x: TempatData | TipData) => slug('nama' in x ? x.nama : x.judul)
  const daftar = (u.jenis === 'tempat' ? [...k.tempat] : [...k.tips]) as (TempatData | TipData)[]
  const label = u.jenis === 'tempat' ? 'Tempat' : 'Tips'
  const cari = () => {
    const i = daftar.findIndex((x) => kunci(x) === slug(u.sasaran ?? ''))
    if (i < 0) throw new Error(`${label} "${u.sasaran}" tidak ditemukan. Mungkin sudah diubah atau dihapus orang lain.`)
    return i
  }
  if (u.aksi === 'hapus') daftar.splice(cari(), 1)
  else {
    if (!u.data) throw new Error('Isi usulan kosong.')
    if (u.aksi === 'ubah') daftar[cari()] = u.data
    else daftar.push(u.data)
  }
  const hasil = rapikan(u.jenis === 'tempat' ? { ...k, tempat: daftar as TempatData[] } : { ...k, tips: daftar as TipData[] })
  const m = cekKonten(hasil)
  if (m.length) throw new Error(m.join('\n'))
  return hasil
}
