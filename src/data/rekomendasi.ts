// Konten Destinasi & Tips. Isinya ada di rekomendasi.json dan diedit lewat halaman Kelola konten
// (/kelola) di aplikasi. DRAF: wajib dicek ulang bersama mutawwif sebelum rilis.
import data from './rekomendasi.json'
import { slug, type Kategori, type Kota, type Konten } from '../lib/konten'

export type { Kota, Kategori }

export interface Tempat {
  id: string
  nama: string
  kota: Kota
  kategori: Kategori
  ringkas: string
  paragraphs: string[]
  tips?: string[]
  maps: string
}

export interface Tip {
  id: string
  title: string
  summary: string
  paragraphs: string[]
  points?: string[]
}

export const REKOM_NOTE = 'Draf rekomendasi. Aturan, jadwal, dan harga bisa berubah, cek lagi sebelum berangkat.'

const konten = data as Konten

export const TEMPAT: Tempat[] = konten.tempat.map((t) => ({
  id: slug(t.nama),
  nama: t.nama,
  kota: t.kota,
  kategori: t.kategori,
  ringkas: t.ringkas,
  paragraphs: t.isi,
  tips: t.tips.length ? t.tips : undefined,
  maps: t.maps,
}))

export const TIPS: Tip[] = konten.tips.map((t) => ({
  id: slug(t.judul),
  title: t.judul,
  summary: t.ringkas,
  paragraphs: t.isi,
  points: t.poin.length ? t.poin : undefined,
}))
