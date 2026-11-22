import Dexie, { type EntityTable } from 'dexie'

/** Field untuk data yang bisa digabung antar perangkat (lihat src/lib/sync.ts). */
export interface Synced {
  uid: string // identitas lintas perangkat
  updatedAt: number // waktu ubah terakhir, ms
  deleted?: boolean // dihapus (disimpan sebagai penanda agar hapus ikut tersinkron)
}

export interface Trip {
  id: 'main'
  name: string
  departDate?: string // YYYY-MM-DD
  returnDate?: string
  travelers: number
  savingsTarget: number // IDR
  sarRate: number // IDR per 1 SAR
  hotelMakkah?: string
  hotelMadinah?: string
  bloodType?: string
  allergies?: string
  emergencyContact?: string
  updatedAt?: number
}

export interface StepStatus {
  id: string
  done: boolean
  note?: string
  updatedAt?: number
  // langkah buatan sendiri
  custom?: boolean
  title?: string
  when?: string
  body?: string
  tips?: string[]
  order?: number
  deleted?: boolean
}

export type CostKind = 'sekali' | 'malam' | 'hari'

export interface CostRow extends Synced {
  id?: number
  label: string
  hint: string
  kind: CostKind
  hemat: number
  nyaman: number
  order: number
}

export interface ChecklistItem extends Synced {
  id?: number
  group: string
  label: string
  done: boolean
  custom?: boolean
}

/** Kategori lama (v1–v3), tetap dibaca untuk data dan sync lama. */
export type ExpenseCategory = 'persiapan' | 'transport' | 'akomodasi' | 'makan' | 'ibadah' | 'oleh-oleh' | 'lainnya'

/** Kelompok pengeluaran:
 *  pra   = yang memberangkatkan (tiket, visa, hotel; setara biaya travel)
 *  non   = keperluan umroh (baju, makanan, obat-obatan)
 *  umroh = belanja dan biaya selama di Tanah Suci */
export type ExpensePhase = 'pra' | 'non' | 'umroh'

export interface Category extends Synced {
  id?: number
  name: string
  order: number
}

export interface Expense extends Synced {
  id?: number
  title: string
  amount: number
  currency: 'IDR' | 'SAR'
  category?: ExpenseCategory
  phase?: ExpensePhase
  categoryUid?: string
  date: string
}

export interface Deposit extends Synced {
  id?: number
  amount: number
  date: string
  note?: string
}

export const db = new Dexie('umroh-mandiri') as Dexie & {
  trip: EntityTable<Trip, 'id'>
  steps: EntityTable<StepStatus, 'id'>
  checklist: EntityTable<ChecklistItem, 'id'>
  expenses: EntityTable<Expense, 'id'>
  deposits: EntityTable<Deposit, 'id'>
  costs: EntityTable<CostRow, 'id'>
  categories: EntityTable<Category, 'id'>
}

db.version(1).stores({
  trip: 'id',
  steps: 'id',
  checklist: '++id, group',
  expenses: '++id, date, category',
  deposits: '++id, date',
})

export const newUid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`)
export const stamp = () => ({ uid: newUid(), updatedAt: Date.now() })
export const defaultUid = (group: string, label: string) => `default:${group}:${label}`

// v2: uid + updatedAt supaya data dua perangkat bisa digabung tanpa server
db.version(2)
  .stores({
    checklist: '++id, group, uid',
    expenses: '++id, date, category, uid',
    deposits: '++id, date, uid',
  })
  .upgrade(async (tx) => {
    await tx
      .table('checklist')
      .toCollection()
      .modify((r) => {
        r.uid ??= r.custom ? newUid() : defaultUid(r.group, r.label)
        r.updatedAt ??= r.done || r.custom ? Date.now() : 0
      })
    for (const t of ['expenses', 'deposits']) {
      await tx
        .table(t)
        .toCollection()
        .modify((r) => {
          r.uid ??= newUid()
          r.updatedAt ??= Date.now()
        })
    }
  })

// v3: pos estimasi biaya bisa ditambah/dihapus
db.version(3).stores({ costs: '++id, uid, order' })

// v4: pengeluaran dikelompokkan (pra/non/umroh) dan kategorinya bisa dikelola sendiri
export const DEFAULT_CATEGORIES: [string, string][] = [
  ['tiket', 'Tiket pesawat'],
  ['visa', 'Visa & dokumen'],
  ['hotel', 'Hotel'],
  ['transport', 'Transportasi'],
  ['makan', 'Makan & minum'],
  ['perlengkapan', 'Perlengkapan'],
  ['kesehatan', 'Kesehatan'],
  ['ibadah', 'Ibadah'],
  ['oleh-oleh', 'Oleh-oleh'],
  ['lainnya', 'Lainnya'],
]
export const categoryUid = (key: string) => `default:cat:${key}`
const LEGACY: Record<ExpenseCategory, [string, ExpensePhase]> = {
  persiapan: ['visa', 'pra'],
  transport: ['transport', 'umroh'],
  akomodasi: ['hotel', 'umroh'],
  makan: ['makan', 'umroh'],
  ibadah: ['ibadah', 'umroh'],
  'oleh-oleh': ['oleh-oleh', 'umroh'],
  lainnya: ['lainnya', 'umroh'],
}
/** Lengkapi pengeluaran lama (tanpa kelompok/kategori baru). */
export function normalizeExpense<T extends Expense>(e: T): T {
  if (e.phase && e.categoryUid) return e
  const [key, phase] = LEGACY[e.category ?? 'lainnya'] ?? ['lainnya', 'umroh']
  return { ...e, phase: e.phase ?? phase, categoryUid: e.categoryUid ?? categoryUid(key) }
}
export const defaultCategories = (): Category[] => DEFAULT_CATEGORIES.map(([k, name], i) => ({ uid: categoryUid(k), name, order: i, updatedAt: 0 }))

db.version(4)
  .stores({ categories: '++id, uid, order', expenses: '++id, date, uid, phase' })
  .upgrade(async (tx) => {
    await tx.table('categories').bulkAdd(defaultCategories())
    await tx
      .table('expenses')
      .toCollection()
      .modify((e) => Object.assign(e, normalizeExpense(e)))
  })
db.on('ready', async () => {
  if ((await db.categories.count()) === 0) await db.categories.bulkAdd(defaultCategories())
})

export const DEFAULT_TRIP: Trip = {
  id: 'main',
  name: 'Umroh pertamaku',
  travelers: 1,
  savingsTarget: 30_000_000,
  sarRate: 4400,
}

export async function getTrip(): Promise<Trip> {
  return (await db.trip.get('main')) ?? DEFAULT_TRIP
}

export async function saveTrip(patch: Partial<Trip>) {
  const current = await getTrip()
  await db.trip.put({ ...current, ...patch, id: 'main', updatedAt: Date.now() })
}

/** Hapus yang ikut tersinkron: baris ditandai, bukan dibuang. */
export const softDelete = (table: 'checklist' | 'expenses' | 'deposits' | 'costs' | 'categories', id: number) => db[table].update(id, { deleted: true, updatedAt: Date.now() })
