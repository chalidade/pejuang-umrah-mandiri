// Angka default perkiraan kasar per orang, dalam Rupiah. Pengguna bisa mengubah semuanya.
// Perlu diperbarui berkala sesuai harga pasar.
export type Profile = 'hemat' | 'nyaman'

export interface CostItem {
  id: string
  label: string
  hint: string
  perNight?: boolean // dikali jumlah malam
  perDay?: boolean // dikali jumlah hari
  value: Record<Profile, number>
}

export const COST_ITEMS: CostItem[] = [
  { id: 'tiket', label: 'Tiket pesawat PP', hint: 'Jakarta–Jeddah/Madinah pulang-pergi', value: { hemat: 11_000_000, nyaman: 15_000_000 } },
  { id: 'hotel', label: 'Hotel per malam', hint: 'Per orang, berbagi kamar', perNight: true, value: { hemat: 550_000, nyaman: 1_400_000 } },
  { id: 'visa', label: 'Visa & asuransi', hint: 'Lewat Nusuk, termasuk asuransi wajib', value: { hemat: 2_500_000, nyaman: 3_000_000 } },
  { id: 'vaksin', label: 'Vaksin & dokumen', hint: 'Meningitis, polio, e-ICV, paspor', value: { hemat: 700_000, nyaman: 900_000 } },
  { id: 'transport', label: 'Transport lokal', hint: 'Bandara, Makkah–Madinah, taksi', value: { hemat: 1_500_000, nyaman: 3_000_000 } },
  { id: 'makan', label: 'Makan per hari', hint: 'Tiga kali makan dan minum', perDay: true, value: { hemat: 180_000, nyaman: 400_000 } },
  { id: 'lain', label: 'eSIM, laundry, cadangan', hint: 'Biaya kecil yang sering terlupa', value: { hemat: 800_000, nyaman: 1_500_000 } },
]

export function costOf(item: CostItem, amount: number, days: number) {
  if (item.perNight) return amount * Math.max(days - 1, 0)
  if (item.perDay) return amount * days
  return amount
}

import type { CostKind, CostRow } from '../db'

export const kindOf = (c: CostItem): CostKind => (c.perNight ? 'malam' : c.perDay ? 'hari' : 'sekali')

export const defaultCostRows = (): CostRow[] =>
  COST_ITEMS.map((c, i) => ({ uid: `default:cost:${c.id}`, updatedAt: 0, label: c.label, hint: c.hint, kind: kindOf(c), hemat: c.value.hemat, nyaman: c.value.nyaman, order: i }))

export function costTotal(kind: CostKind, amount: number, days: number) {
  if (kind === 'malam') return amount * Math.max(days - 1, 0)
  if (kind === 'hari') return amount * days
  return amount
}
