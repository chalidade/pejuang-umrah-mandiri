import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_TRIP, type Trip } from '../db'
import { PREP_STEPS } from '../data/steps'

export function useTrip(): Trip {
  return useLiveQuery(() => db.trip.get('main'), []) ?? DEFAULT_TRIP
}

export function useSteps() {
  const rows = useLiveQuery(() => db.steps.toArray(), []) ?? []
  return new Map(rows.map((r) => [r.id, r]))
}

export interface StepItem {
  id: string
  title: string
  when: string
  body?: string
  tips: string[]
  custom: boolean
  done: boolean
}

/** Langkah persiapan yang tampil: bawaan yang tidak dihapus + buatan sendiri. */
/** undefined = masih memuat, null = belum pernah disimpan */
export function useTripRow(): Trip | null | undefined {
  return useLiveQuery(() => db.trip.get('main').then((t) => t ?? null), [])
}

export function useStepList(): StepItem[] {
  const status = useSteps()
  // Langkah bawaan memakai isi yang sudah diubah pengguna kalau ada
  const defaults = PREP_STEPS.filter((s) => !status.get(s.id)?.deleted).map((s) => {
    const o = status.get(s.id)
    return { id: s.id, title: o?.title ?? s.title, when: o?.when ?? s.when, body: o?.body ?? s.body, tips: o?.tips ?? s.tips, custom: false, done: !!o?.done }
  })
  const custom = [...status.values()]
    .filter((r) => r.custom && !r.deleted)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((r) => ({ id: r.id, title: r.title ?? 'Langkah', when: r.when ?? '', body: r.body ?? '', tips: r.tips ?? [], custom: true, done: r.done }))
  return [...defaults, ...custom]
}

export function toIdr(amount: number, currency: 'IDR' | 'SAR', rate: number) {
  return currency === 'SAR' ? amount * rate : amount
}
