// Bentuk data konten Panduan (src/data/konten.json): Ibadah, Destinasi, Tips, beserta pemeriksanya.
// Dipakai oleh aplikasi, halaman Kelola konten, scripts/cek-konten.ts, dan scripts/terapkan-usulan.ts.
// Sengaja tanpa import: file ini juga dijalankan langsung oleh Node.

export const KOTA_LIST = ['Makkah', 'Madinah'] as const
export const KATEGORI_LIST = ['Ziarah', 'Kuliner', 'Belanja'] as const
export type Kota = (typeof KOTA_LIST)[number]
export type Kategori = (typeof KATEGORI_LIST)[number]

/** Satu foto atau video. url: link YouTube/TikTok/Instagram, link foto https, atau /media/… (unggahan admin). */
export interface Media {
  url: string
  /** menit mulai untuk YouTube, "mm:ss" atau "h:mm:ss" */
  mulai?: string
  keterangan?: string
}
export interface Doa {
  arab: string
  latin: string
  arti: string
  sumber: string
}
export interface IbadahData {
  judul: string
  kategori: string
  ringkas: string
  isi: string[]
  poin: string[]
  doa: Doa[]
  media: Media[]
}
export interface TempatData {
  nama: string
  kota: Kota
  kategori: Kategori
  ringkas: string
  isi: string[]
  tips: string[]
  maps: string
  media: Media[]
}
export interface TipData {
  judul: string
  ringkas: string
  isi: string[]
  poin: string[]
  media: Media[]
}
export interface Konten {
  kategoriIbadah: string[]
  ibadah: IbadahData[]
  tempat: TempatData[]
  tips: TipData[]
}
export type Jenis = 'ibadah' | 'tempat' | 'tips'
export const LABEL_JENIS: Record<Jenis, string> = { ibadah: 'Materi ibadah', tempat: 'Tempat', tips: 'Tips' }
export const namaItem = (x: IbadahData | TempatData | TipData) => ('nama' in x ? x.nama : x.judul)

/** "Jabal Nur dan Gua Hira" → "jabal-nur-dan-gua-hira" */
export function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Media ─────────────────────────────────────────────────────────────────
export type JenisMedia = 'youtube' | 'tiktok' | 'instagram' | 'foto'
export interface InfoMedia {
  jenis: JenisMedia
  id: string // id video, atau url foto
  embed: string // url iframe (kosong untuk foto)
  thumb: string // gambar pratinjau ('' kalau tidak tersedia)
  buka: string // url untuk dibuka di aplikasinya
  mulai: number // detik mulai (YouTube)
}

/** "1:06" → 66, "1:02:03" → 3723, "90" → 90. Kosong/salah → 0. */
export function detik(s: string | undefined): number {
  if (!s) return 0
  const p = s.trim().split(':').map((x) => Number(x))
  if (p.some((x) => !Number.isFinite(x) || x < 0)) return 0
  return p.reduce((a, b) => a * 60 + b, 0)
}
export const formatMenit = (d: number) => {
  const h = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60), s = Math.floor(d % 60)
  return (h ? `${h}:` : '') + `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
const validMulai = (s: string | undefined) => !s || /^(\d+:)?\d{1,2}:\d{2}$|^\d+$/.test(s.trim())

/** Kenali link. null kalau tidak didukung. */
export function infoMedia(m: Pick<Media, 'url' | 'mulai'>): InfoMedia | null {
  const raw = (m.url ?? '').trim()
  if (/^\/media\/[\w.-]+$/.test(raw)) return { jenis: 'foto', id: raw, embed: '', thumb: raw, buka: raw, mulai: 0 }
  let u: URL
  try { u = new URL(raw) } catch { return null }
  if (u.protocol !== 'https:') return null
  const host = u.hostname.replace(/^www\.|^m\./, '')
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
    let id = ''
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0]
    else if (u.pathname === '/watch') id = u.searchParams.get('v') ?? ''
    else { const mm = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{6,})/); if (mm) id = mm[1] }
    if (!/^[\w-]{6,}$/.test(id)) return null
    const t = detik(m.mulai) || Number((u.searchParams.get('t') ?? u.searchParams.get('start') ?? '0').replace(/s$/, '')) || 0
    return {
      jenis: 'youtube', id, mulai: t,
      embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1${t ? `&start=${t}` : ''}`,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      buka: `https://www.youtube.com/watch?v=${id}${t ? `&t=${t}s` : ''}`,
    }
  }
  if (host === 'tiktok.com') {
    const mm = u.pathname.match(/\/video\/(\d+)/)
    if (!mm) return null
    return { jenis: 'tiktok', id: mm[1], embed: `https://www.tiktok.com/embed/v2/${mm[1]}`, thumb: '', buka: raw, mulai: 0 }
  }
  if (host === 'instagram.com') {
    const mm = u.pathname.match(/^\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/)
    if (!mm) return null
    const kind = mm[1] === 'reels' ? 'reel' : mm[1]
    return { jenis: 'instagram', id: mm[2], embed: `https://www.instagram.com/${kind}/${mm[2]}/embed/`, thumb: '', buka: `https://www.instagram.com/${kind}/${mm[2]}/`, mulai: 0 }
  }
  // selain itu: link langsung ke foto
  if (/\.(jpe?g|png|webp|gif|avif)$/i.test(u.pathname)) return { jenis: 'foto', id: raw, embed: '', thumb: raw, buka: raw, mulai: 0 }
  return null
}

export const PESAN_MEDIA =
  'Link tidak dikenali. Pakai link YouTube, TikTok (yang ada /video/…), Instagram (post atau reel), atau link langsung ke foto (.jpg, .png, .webp).'

// ── Pemeriksa ─────────────────────────────────────────────────────────────
const kosong = (s: unknown) => typeof s !== 'string' || s.trim() === ''

function cekMedia(label: string, media: unknown, err: string[]) {
  if (media == null) return
  if (!Array.isArray(media)) return void err.push(`${label}: foto/video harus berupa daftar.`)
  media.forEach((m: Media, j) => {
    if (kosong(m?.url)) return err.push(`${label}, media ke-${j + 1}: link belum diisi.`)
    if (!infoMedia(m)) err.push(`${label}, media ke-${j + 1}: ${PESAN_MEDIA}`)
    if (!validMulai(m.mulai)) err.push(`${label}, media ke-${j + 1}: menit mulai ditulis seperti 01:06.`)
  })
}

/** Daftar masalah dalam bahasa sehari-hari. Kosong berarti aman diterbitkan. */
export function cekKonten(data: unknown): string[] {
  const err: string[] = []
  const d = data as Partial<Konten>
  if (!d || !Array.isArray(d.tempat) || !Array.isArray(d.tips) || !Array.isArray(d.ibadah) || !Array.isArray(d.kategoriIbadah))
    return ['Struktur file rusak: harus ada "kategoriIbadah", "ibadah", "tempat", dan "tips".']

  const kat = d.kategoriIbadah.filter((k) => !kosong(k))
  if (!kat.length) err.push('Kategori ibadah tidak boleh kosong semua.')
  if (new Set(kat.map(slug)).size !== kat.length) err.push('Ada kategori ibadah yang namanya sama.')

  const unik = (label: string, nama: string, set: Set<string>) => {
    const k = slug(nama)
    if (set.has(k)) err.push(`${label}: judul/nama sama dengan yang lain. Bedakan sedikit.`)
    set.add(k)
  }
  const ada = (xs: unknown) => Array.isArray(xs) && xs.some((p) => !kosong(p))

  const s1 = new Set<string>()
  d.ibadah.forEach((t, i) => {
    const label = kosong(t?.judul) ? `Materi ibadah ke-${i + 1}` : `Materi "${t.judul}"`
    if (kosong(t?.judul)) err.push(`${label}: judul belum diisi.`)
    else unik(label, t.judul, s1)
    if (!kat.includes(t?.kategori)) err.push(`${label}: kategori "${t?.kategori ?? ''}" tidak ada di daftar kategori.`)
    if (kosong(t?.ringkas)) err.push(`${label}: ringkasan belum diisi.`)
    if (!ada(t?.isi) && !ada(t?.poin) && !(t?.media ?? []).length) err.push(`${label}: isi penjelasan, poin, atau video.`)
    ;(t?.doa ?? []).forEach((x, j) => { if (kosong(x?.arab) && kosong(x?.latin)) err.push(`${label}, doa ke-${j + 1}: isi teks Arab atau latin.`) })
    cekMedia(label, t?.media, err)
  })

  const s2 = new Set<string>()
  d.tempat.forEach((t, i) => {
    const label = kosong(t?.nama) ? `Tempat ke-${i + 1}` : `Tempat "${t.nama}"`
    if (kosong(t?.nama)) err.push(`${label}: nama belum diisi.`)
    else unik(label, t.nama, s2)
    if (!KOTA_LIST.includes(t?.kota as Kota)) err.push(`${label}: kota harus ${KOTA_LIST.join(' atau ')}.`)
    if (!KATEGORI_LIST.includes(t?.kategori as Kategori)) err.push(`${label}: jenis harus ${KATEGORI_LIST.join(', ')}.`)
    if (kosong(t?.ringkas)) err.push(`${label}: ringkasan belum diisi.`)
    if (!ada(t?.isi)) err.push(`${label}: penjelasan belum diisi.`)
    if (!kosong(t?.maps) && !/^https:\/\//.test(t.maps)) err.push(`${label}: link Maps harus diawali https://`)
    cekMedia(label, t?.media, err)
  })

  const s3 = new Set<string>()
  d.tips.forEach((t, i) => {
    const label = kosong(t?.judul) ? `Tips ke-${i + 1}` : `Tips "${t.judul}"`
    if (kosong(t?.judul)) err.push(`${label}: judul belum diisi.`)
    else unik(label, t.judul, s3)
    if (kosong(t?.ringkas)) err.push(`${label}: ringkasan belum diisi.`)
    if (!ada(t?.isi) && !ada(t?.poin) && !(t?.media ?? []).length) err.push(`${label}: isi penjelasan, poin, atau video.`)
    cekMedia(label, t?.media, err)
  })
  return err
}

/** Rapikan sebelum disimpan: buang baris kosong dan spasi berlebih. */
export function rapikan(k: Konten): Konten {
  const bersih = (xs: string[] | undefined) => (xs ?? []).map((x) => x.trim()).filter(Boolean)
  const media = (xs: Media[] | undefined) =>
    (xs ?? []).filter((m) => m.url?.trim()).map((m) => {
      const o: Media = { url: m.url.trim() }
      if (m.mulai?.trim()) o.mulai = m.mulai.trim()
      if (m.keterangan?.trim()) o.keterangan = m.keterangan.trim()
      return o
    })
  return {
    kategoriIbadah: bersih(k.kategoriIbadah),
    ibadah: k.ibadah.map((t) => ({
      judul: t.judul.trim(), kategori: t.kategori.trim(), ringkas: t.ringkas.trim(), isi: bersih(t.isi), poin: bersih(t.poin),
      doa: (t.doa ?? []).map((x) => ({ arab: x.arab.trim(), latin: x.latin.trim(), arti: x.arti.trim(), sumber: (x.sumber ?? '').trim() })).filter((x) => x.arab || x.latin),
      media: media(t.media),
    })),
    tempat: k.tempat.map((t) => ({ nama: t.nama.trim(), kota: t.kota, kategori: t.kategori, ringkas: t.ringkas.trim(), isi: bersih(t.isi), tips: bersih(t.tips), maps: (t.maps ?? '').trim(), media: media(t.media) })),
    tips: k.tips.map((t) => ({ judul: t.judul.trim(), ringkas: t.ringkas.trim(), isi: bersih(t.isi), poin: bersih(t.poin), media: media(t.media) })),
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
  | { aksi: Aksi; jenis: 'ibadah'; sasaran: string | null; data: IbadahData | null }
  | { aksi: Aksi; jenis: 'tempat'; sasaran: string | null; data: TempatData | null }
  | { aksi: Aksi; jenis: 'tips'; sasaran: string | null; data: TipData | null }

/** Terapkan satu usulan ke konten. Melempar Error berbahasa sehari-hari kalau tidak bisa. */
export function terapkanUsulan(k: Konten, u: Usulan): Konten {
  if (!u || !['tambah', 'ubah', 'hapus'].includes(u.aksi) || !['ibadah', 'tempat', 'tips'].includes(u.jenis)) throw new Error('Format usulan tidak dikenali.')
  const daftar = [...k[u.jenis]] as (IbadahData | TempatData | TipData)[]
  const label = LABEL_JENIS[u.jenis]
  const cari = () => {
    const i = daftar.findIndex((x) => slug(namaItem(x)) === slug(u.sasaran ?? ''))
    if (i < 0) throw new Error(`${label} "${u.sasaran}" tidak ditemukan. Mungkin sudah diubah atau dihapus orang lain.`)
    return i
  }
  if (u.aksi === 'hapus') daftar.splice(cari(), 1)
  else {
    if (!u.data) throw new Error('Isi usulan kosong.')
    if (u.aksi === 'ubah') daftar[cari()] = u.data
    else daftar.push(u.data)
  }
  let baru: Konten = { ...k, [u.jenis]: daftar }
  // usulan materi ibadah boleh membawa kategori baru
  if (u.jenis === 'ibadah' && u.data && !baru.kategoriIbadah.includes((u.data as IbadahData).kategori))
    baru = { ...baru, kategoriIbadah: [...baru.kategoriIbadah, (u.data as IbadahData).kategori] }
  const hasil = rapikan(baru)
  const m = cekKonten(hasil)
  if (m.length) throw new Error(m.join('\n'))
  return hasil
}
