const idr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const sar = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

export const rupiah = (n: number) => idr.format(Math.round(n))
export const riyal = (n: number) => `${sar.format(n)} SAR`

export function jutaan(n: number) {
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
  return rupiah(n)
}

// Tanggal lokal perangkat (bukan UTC), supaya catatan lewat tengah malam WIB tidak mundur sehari
export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function daysUntil(date?: string) {
  if (!date) return undefined
  const ms = Date.parse(date) - Date.parse(today())
  return Math.round(ms / 86_400_000)
}

export function tanggal(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function parseAngka(v: string) {
  const n = Number(v.replace(/[^\d]/g, ''))
  return Number.isFinite(n) ? n : 0
}
