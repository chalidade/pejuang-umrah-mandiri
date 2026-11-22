import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_TRIP, type Trip } from '../db'

export function useTrip(): Trip {
  return useLiveQuery(() => db.trip.get('main'), []) ?? DEFAULT_TRIP
}

export function useSteps() {
  const rows = useLiveQuery(() => db.steps.toArray(), []) ?? []
  return new Map(rows.map((r) => [r.id, r]))
}

export function toIdr(amount: number, currency: 'IDR' | 'SAR', rate: number) {
  return currency === 'SAR' ? amount * rate : amount
}
