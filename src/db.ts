import Dexie, { type EntityTable } from 'dexie'

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
}

export interface StepStatus {
  id: string
  done: boolean
  note?: string
}

export interface ChecklistItem {
  id?: number
  group: string
  label: string
  done: boolean
  custom?: boolean
}

export type ExpenseCategory = 'persiapan' | 'transport' | 'akomodasi' | 'makan' | 'ibadah' | 'oleh-oleh' | 'lainnya'

export interface Expense {
  id?: number
  title: string
  amount: number
  currency: 'IDR' | 'SAR'
  category: ExpenseCategory
  date: string
}

export interface Deposit {
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
}

db.version(1).stores({
  trip: 'id',
  steps: 'id',
  checklist: '++id, group',
  expenses: '++id, date, category',
  deposits: '++id, date',
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
  await db.trip.put({ ...current, ...patch, id: 'main' })
}
