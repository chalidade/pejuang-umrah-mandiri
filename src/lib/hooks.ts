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
export function useStepList(): StepItem[] {
  const status = useSteps()
  const defaults = PREP_STEPS.filter((s) => !status.get(s.id)?.deleted).map((s) => ({ ...s, custom: false, done: !!status.get(s.id)?.done }))
  const custom = [...status.values()]
    .filter((r) => r.custom && !r.deleted)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((r) => ({ id: r.id, title: r.title ?? 'Langkah', when: r.when ?? '', tips: [], custom: true, done: r.done }))
  return [...defaults, ...custom]
}

export function toIdr(amount: number, currency: 'IDR' | 'SAR', rate: number) {
  return currency === 'SAR' ? amount * rate : amount
}
