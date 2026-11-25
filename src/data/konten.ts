// Konten Panduan. Isinya di konten.json dan diedit lewat halaman Kelola konten (/kelola).
// DRAF: wajib dicek ulang bersama mutawwif sebelum rilis.
import data from './konten.json'
import { slug, type IbadahData, type Konten, type Produk, type TempatData, type TipData } from '../lib/konten'

export const REVIEW_NOTE = 'Draf panduan. Belum di-review mutawwif.'
export const REKOM_NOTE = 'Draf rekomendasi. Aturan, jadwal, dan harga bisa berubah, cek lagi sebelum berangkat.'

const k = data as Konten
type WithId<T> = T & { id: string }
const withId = <T,>(xs: T[], nama: (x: T) => string): WithId<T>[] => xs.map((x) => ({ ...x, id: slug(nama(x)) }))

export const KATEGORI_IBADAH: string[] = k.kategoriIbadah
export const IBADAH: WithId<IbadahData>[] = withId(k.ibadah, (x) => x.judul)
export const TEMPAT: WithId<TempatData>[] = withId(k.tempat, (x) => x.nama)
export const TIPS: WithId<TipData>[] = withId(k.tips, (x) => x.judul)
export const PERLENGKAPAN: Produk[] = k.perlengkapan ?? []
