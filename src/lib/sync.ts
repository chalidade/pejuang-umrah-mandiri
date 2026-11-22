// Sinkronisasi tanpa server: seluruh data perjalanan dikemas jadi satu "kode" teks
// yang dikirim lewat WhatsApp atau aplikasi lain, lalu digabung di perangkat partner.
// Aturan gabung: per catatan, perubahan paling baru yang menang (last-write-wins).
import { db, getTrip, type ChecklistItem, type CostRow, type Deposit, type Expense, type StepStatus, type Trip } from '../db'
import { defaultCostRows } from '../data/costs'

const VERSION = 1
const PLAIN = 'PUM1:'
const GZIP = 'PUM1z:'

// Yang ikut dikirim. Info medis dan kontak darurat sengaja tidak ikut.
const SHARED_TRIP_FIELDS = ['name', 'departDate', 'returnDate', 'travelers', 'savingsTarget', 'sarRate', 'hotelMakkah', 'hotelMadinah'] as const

interface Payload {
  v: number
  at: number
  trip: Partial<Trip>
  steps: StepStatus[]
  checklist: ChecklistItem[]
  expenses: Expense[]
  deposits: Deposit[]
  costs?: CostRow[]
}

export interface MergeResult {
  added: number
  updated: number
  removed: number
}

const toB64 = (bytes: Uint8Array) => {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

export async function exportCode(): Promise<string> {
  const trip = await getTrip()
  const shared: Partial<Trip> = { updatedAt: trip.updatedAt ?? 0 }
  for (const k of SHARED_TRIP_FIELDS) if (trip[k] !== undefined) (shared as Record<string, unknown>)[k] = trip[k]
  const strip = <T extends { id?: number }>(rows: T[]) => rows.map(({ id: _id, ...rest }) => rest)
  const payload = {
    v: VERSION,
    at: Date.now(),
    trip: shared,
    steps: await db.steps.toArray(),
    // item bawaan yang belum pernah disentuh tidak perlu dikirim
    checklist: strip((await db.checklist.toArray()).filter((c) => c.updatedAt > 0)),
    expenses: strip(await db.expenses.toArray()),
    deposits: strip(await db.deposits.toArray()),
    costs: strip((await db.costs.toArray()).filter((c) => c.updatedAt > 0)),
  }
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  if ('CompressionStream' in globalThis) return GZIP + toB64(await pipe(bytes, new CompressionStream('gzip')))
  return PLAIN + toB64(bytes)
}

async function decode(text: string): Promise<Payload> {
  const m = text.match(/PUM1(z?):([A-Za-z0-9+/=]+)/)
  if (!m) throw new Error('Kode tidak dikenali')
  let bytes = fromB64(m[2])
  if (m[1]) bytes = await pipe(bytes, new DecompressionStream('gzip'))
  const data = JSON.parse(new TextDecoder().decode(bytes)) as Payload
  if (data.v !== VERSION || !Array.isArray(data.expenses)) throw new Error('Versi kode tidak cocok')
  return data
}

export async function importCode(text: string): Promise<MergeResult> {
  const remote = await decode(text)
  const res: MergeResult = { added: 0, updated: 0, removed: 0 }

  await db.transaction('rw', [db.trip, db.steps, db.checklist, db.expenses, db.deposits, db.costs], async () => {
    const local = await getTrip()
    if ((remote.trip.updatedAt ?? 0) > (local.updatedAt ?? 0)) {
      const next: Trip = { ...local }
      for (const k of SHARED_TRIP_FIELDS) (next as unknown as Record<string, unknown>)[k] = remote.trip[k]
      await db.trip.put({ ...next, id: 'main', updatedAt: remote.trip.updatedAt })
      res.updated++
    }

    const steps = new Map((await db.steps.toArray()).map((s) => [s.id, s]))
    for (const r of remote.steps ?? []) {
      const l = steps.get(r.id)
      if (!l || (r.updatedAt ?? 0) > (l.updatedAt ?? 0)) {
        await db.steps.put(r)
        if (!l) res.added++
        else res.updated++
      }
    }

    const mergeTable = async <T extends { id?: number; uid: string; updatedAt: number; deleted?: boolean }>(name: 'checklist' | 'expenses' | 'deposits' | 'costs', rows: T[]) => {
      const table = db[name] as unknown as import('dexie').Table<T, number>
      const byUid = new Map((await table.toArray()).map((r) => [r.uid, r]))
      for (const r of rows ?? []) {
        const l = byUid.get(r.uid)
        if (!l) {
          await table.add(r)
          if (!r.deleted) res.added++
        } else if (r.updatedAt > l.updatedAt) {
          await table.put({ ...r, id: l.id })
          if (r.deleted && !l.deleted) res.removed++
          else res.updated++
        }
      }
    }
    await mergeTable('checklist', remote.checklist)
    await mergeTable('expenses', remote.expenses)
    await mergeTable('deposits', remote.deposits)
    if (remote.costs?.length) {
      // pastikan pos bawaan sudah ada sebelum digabung
      if ((await db.costs.count()) === 0) await db.costs.bulkAdd(defaultCostRows())
      await mergeTable('costs', remote.costs)
    }
  })

  try {
    localStorage.setItem('sync-terakhir', String(Date.now()))
  } catch {
    /* abaikan */
  }
  return res
}

export function lastSync(): number | undefined {
  try {
    const v = Number(localStorage.getItem('sync-terakhir'))
    return v || undefined
  } catch {
    return undefined
  }
}

export const shareMessage = (code: string) =>
  `Data umroh kita dari Pejuang Umrah Mandiri. Salin seluruh pesan ini, lalu tempel di menu "Umroh bareng" dan ketuk Gabungkan.\n\n${code}`
