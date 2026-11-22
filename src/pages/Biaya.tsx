import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, saveTrip, softDelete, stamp, type ExpenseCategory } from '../db'
import { COST_ITEMS, costOf, type Profile } from '../data/costs'
import { jutaan, parseAngka, riyal, rupiah, tanggal, today } from '../lib/format'
import { toIdr, useTrip } from '../lib/hooks'
import { Button, Field, PageHeader, Progress, Tabs, inputClass } from '../components/ui'

type Tab = 'kalkulator' | 'pengeluaran' | 'tabungan'

export default function Biaya() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'kalkulator'
  return (
    <div>
      <PageHeader title="Biaya" />
      <Tabs
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
        options={[
          { value: 'kalkulator', label: 'Estimasi' },
          { value: 'tabungan', label: 'Tabungan' },
          { value: 'pengeluaran', label: 'Pengeluaran' },
        ]}
      />
      {tab === 'kalkulator' && <Kalkulator />}
      {tab === 'tabungan' && <Tabungan />}
      {tab === 'pengeluaran' && <Pengeluaran />}
    </div>
  )
}

const LOOK: Record<string, { color: string; icon: ReactNode }> = {
  tiket: { color: '#1857F0', icon: <path fill="currentColor" stroke="none" d="M21 16v-2l-8-5V3.500a1.500 1.500 0 00-3 0V9l-8 5v2l8-2.500V19l-2 1.500V22l3.500-1 3.500 1v-1.500L13 19v-5.500z" /> },
  hotel: { color: '#5B8BFF', icon: <path d="M3 18v-7h13a5 5 0 015 5v2M3 11V6M3 18v2M21 18v2" /> },
  visa: { color: '#3D73F5', icon: <><rect x="5" y="3" width="14" height="18" rx="2.500" /><circle cx="12" cy="10" r="3" /></> },
  vaksin: { color: '#12A594', icon: <path d="M12 3l7 3v6c0 4.500-3 7.500-7 9-4-1.500-7-4.500-7-9V6zM12 9v6M9 12h6" /> },
  transport: { color: '#7A6BFF', icon: <><rect x="4" y="5" width="16" height="12" rx="3" /><path d="M4 11h16M8 17v2M16 17v2" /></> },
  makan: { color: '#E09400', icon: <path d="M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M17 3c-2 2-3 5-3 8h3zM17 11v10" /> },
  lain: { color: '#93A0B8', icon: <path fill="currentColor" stroke="none" d="M5 10a2 2 0 110 4 2 2 0 010-4zm7 0a2 2 0 110 4 2 2 0 010-4zm7 0a2 2 0 110 4 2 2 0 010-4z" /> },
}

function Kalkulator() {
  const trip = useTrip()
  const [profile, setProfile] = useState<Profile>('hemat')
  const [days, setDays] = useState(9)
  const [overrides, setOverrides] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState(false)
  const people = trip.travelers || 1

  const rows = COST_ITEMS.map((c) => {
    const unit = overrides[`${profile}:${c.id}`] ?? c.value[profile]
    return { ...c, unit, total: costOf(c, unit, days), ...LOOK[c.id] }
  })
  const perPerson = rows.reduce((a, r) => a + r.total, 0)
  const bars = [...rows].sort((a, b) => b.total - a.total)

  const share = async () => {
    const text = `Estimasi umroh mandiri ${days} hari (${profile}): ${rupiah(perPerson)} per orang. Hitung punyamu di aplikasi Pejuang Umrah Mandiri.`
    if (navigator.share) await navigator.share({ text }).catch(() => {})
    else await navigator.clipboard?.writeText(text)
  }

  return (
    <div className="px-5">
      <div className="relative mt-1 flex items-end justify-between gap-3">
        <div>
          <label className="flex items-center text-[0.82rem] font-semibold text-redup">
            Per orang,
            <select aria-label="Lama perjalanan" className="-my-1 ml-1 appearance-none rounded-md bg-transparent py-1 pr-1 font-semibold text-redup underline decoration-dotted underline-offset-4 outline-none focus:text-nabawi" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {[7, 9, 10, 12, 14, 16].map((d) => (
                <option key={d} value={d}>
                  {d} hari
                </option>
              ))}
            </select>
          </label>
          <p className="font-display mt-1.5 text-[2.9rem] leading-none font-extrabold text-nabawi tabular-nums">{jutaan(perPerson)}</p>
        </div>
        <div className="flex shrink-0 rounded-full bg-nabawi-muda p-[3px] text-xs font-bold text-redup">
          {(['hemat', 'nyaman'] as Profile[]).map((p) => (
            <button key={p} onClick={() => setProfile(p)} aria-pressed={profile === p} className={`rounded-full px-[11px] py-1.5 capitalize ${profile === p ? 'bg-nabawi text-white' : ''}`}>
              {p}
            </button>
          ))}
        </div>
        <p className="tulis absolute -top-2 right-0 rotate-3 text-center text-[1.2rem] leading-[0.95]" aria-hidden>
          angkanya bisa
          <br />
          kamu ganti
        </p>
      </div>
      {people > 1 && (
        <p className="mt-1.5 text-sm text-redup tabular-nums">
          Total {people} orang: {rupiah(perPerson * people)}
        </p>
      )}

      <div className="mt-4 flex h-3 gap-[3px]" aria-hidden>
        {bars.map((r) => (
          <i key={r.id} className="block rounded-full" style={{ width: `${(r.total / perPerson) * 100}%`, background: r.color, opacity: r.id === 'lain' ? 0.5 : 1 }} />
        ))}
      </div>

      <ul className="mt-2.5">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 border-b border-garis py-2.5 last:border-0">
            <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl bg-nabawi-muda" style={{ color: r.color }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {r.icon}
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.91rem] font-bold">{r.label}</p>
              <p className="truncate text-xs text-redup">
                {r.perNight ? `${days - 1} malam, berbagi kamar` : r.perDay ? `${days} hari` : r.hint}
              </p>
            </div>
            <input
              inputMode="numeric"
              aria-label={r.label}
              className="w-[6.500rem] rounded-lg border-b border-dashed border-transparent bg-transparent py-1 text-right text-[0.91rem] font-bold tabular-nums outline-none focus:border-nabawi focus:text-nabawi"
              value={r.unit.toLocaleString('id-ID')}
              onChange={(e) => setOverrides({ ...overrides, [`${profile}:${r.id}`]: parseAngka(e.target.value) })}
            />
          </li>
        ))}
      </ul>

      <button
        onClick={async () => {
          await saveTrip({ savingsTarget: perPerson * people })
          setSaved(true)
        }}
        className="mt-4 w-full rounded-2xl bg-nabawi py-[15px] text-[0.97rem] font-bold text-white shadow-[0_8px_18px_rgba(24,87,240,0.3)]"
      >
        {saved ? 'Tersimpan sebagai target' : 'Jadikan target tabungan'}
      </button>
      <button onClick={share} className="mt-1 w-full py-3 text-sm font-bold text-nabawi">
        Bagikan estimasi
      </button>
      <p className="text-center text-xs leading-relaxed text-redup">Angka awal adalah perkiraan kasar. Ketuk angka untuk menggantinya.</p>
    </div>
  )
}

function Tabungan() {
  const trip = useTrip()
  const deposits = useLiveQuery(() => db.deposits.orderBy('date').reverse().filter((d) => !d.deleted).toArray(), []) ?? []
  const [amount, setAmount] = useState('')
  const saved = deposits.reduce((a, d) => a + d.amount, 0)
  const remaining = Math.max(trip.savingsTarget - saved, 0)

  const monthsLeft = useMemo(() => {
    if (!trip.departDate) return undefined
    const diff = (Date.parse(trip.departDate) - Date.now()) / (30.44 * 86_400_000)
    return Math.max(Math.ceil(diff), 1)
  }, [trip.departDate])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    const n = parseAngka(amount)
    if (!n) return
    await db.deposits.add({ amount: n, date: today(), ...stamp() })
    setAmount('')
  }

  return (
    <div className="px-5">
      <div className="rounded-2xl bg-white p-5 border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
        <p className="text-sm text-redup">Terkumpul</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums">{rupiah(saved)}</p>
        <div className="mt-3">
          <Progress value={trip.savingsTarget ? saved / trip.savingsTarget : 0} tone="emas" />
        </div>
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-redup">Target {jutaan(trip.savingsTarget)}</span>
          <span className="font-semibold tabular-nums">Kurang {jutaan(remaining)}</span>
        </div>
        {monthsLeft && remaining > 0 && (
          <p className="mt-3 rounded-xl bg-emas-muda px-3 py-2.5 text-sm">
            Sisihkan <span className="font-bold tabular-nums">{rupiah(remaining / monthsLeft)}</span> per bulan selama {monthsLeft} bulan agar tercapai sebelum berangkat.
          </p>
        )}
      </div>

      <form onSubmit={add} className="mt-4 flex gap-2">
        <input inputMode="numeric" className={inputClass} placeholder="Nominal setoran, misal 500.000" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Nominal setoran" />
        <button type="submit" className="shrink-0 rounded-xl bg-nabawi px-5 font-semibold text-white">
          Setor
        </button>
      </form>

      <div className="mt-4">
        <Field label="Target tabungan (Rp)" hint="Atau isi otomatis dari tab Estimasi.">
          <input
            inputMode="numeric"
            className={inputClass}
            value={trip.savingsTarget.toLocaleString('id-ID')}
            onChange={(e) => saveTrip({ savingsTarget: parseAngka(e.target.value) })}
          />
        </Field>
      </div>

      {deposits.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 font-bold">Riwayat setoran</h2>
          <ul className="divide-y divide-batu rounded-2xl bg-white border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
            {deposits.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-semibold tabular-nums">{rupiah(d.amount)}</p>
                  <p className="text-xs text-redup">{tanggal(d.date)}</p>
                </div>
                <button onClick={() => softDelete('deposits', d.id!)} className="text-sm text-redup" aria-label="Hapus setoran">
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'persiapan', label: 'Persiapan' },
  { value: 'transport', label: 'Transport' },
  { value: 'akomodasi', label: 'Hotel' },
  { value: 'makan', label: 'Makan' },
  { value: 'ibadah', label: 'Ibadah' },
  { value: 'oleh-oleh', label: 'Oleh-oleh' },
  { value: 'lainnya', label: 'Lainnya' },
]

function Pengeluaran() {
  const trip = useTrip()
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().filter((e) => !e.deleted).toArray(), []) ?? []
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'IDR' | 'SAR'>('SAR')
  const [category, setCategory] = useState<ExpenseCategory>('makan')

  const total = expenses.reduce((a, e) => a + toIdr(e.amount, e.currency, trip.sarRate), 0)
  const byCat = CATEGORIES.map((c) => ({
    ...c,
    sum: expenses.filter((e) => e.category === c.value).reduce((a, e) => a + toIdr(e.amount, e.currency, trip.sarRate), 0),
  })).filter((c) => c.sum > 0)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    const n = Number(amount.replace(',', '.'))
    if (!title.trim() || !n) return
    await db.expenses.add({ title: title.trim(), amount: n, currency, category, date: today(), ...stamp() })
    setTitle('')
    setAmount('')
  }

  return (
    <div className="px-5">
      <div className="rounded-2xl bg-white p-5 border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
        <p className="text-sm text-redup">Total pengeluaran</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums">{rupiah(total)}</p>
        <p className="mt-1 text-xs text-redup tabular-nums">Kurs 1 SAR = {rupiah(trip.sarRate)}</p>
        {byCat.length > 0 && (
          <ul className="mt-4 space-y-2">
            {byCat.map((c) => (
              <li key={c.value}>
                <div className="flex justify-between text-sm">
                  <span>{c.label}</span>
                  <span className="tabular-nums">{rupiah(c.sum)}</span>
                </div>
                <div className="mt-1">
                  <Progress value={c.sum / total} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={add} className="mt-4 space-y-2 rounded-2xl bg-white p-4 border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
        <h2 className="font-bold">Catat pengeluaran</h2>
        <input className={inputClass} placeholder="Contoh: makan siang nasi bukhari" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Keterangan" />
        <div className="flex gap-2">
          <input inputMode="decimal" className={inputClass} placeholder="Nominal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Nominal" />
          <select className={`${inputClass} w-28`} value={currency} onChange={(e) => setCurrency(e.target.value as 'IDR' | 'SAR')} aria-label="Mata uang">
            <option value="SAR">SAR</option>
            <option value="IDR">IDR</option>
          </select>
        </div>
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} aria-label="Kategori">
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <Button type="submit" className="w-full">
          Simpan pengeluaran
        </Button>
      </form>

      {expenses.length === 0 ? (
        <p className="mt-6 text-center text-sm text-redup">Belum ada catatan. Mulai dari biaya paspor atau vaksin.</p>
      ) : (
        <ul className="mt-4 divide-y divide-batu rounded-2xl bg-white border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{e.title}</p>
                <p className="text-xs text-redup">
                  {CATEGORIES.find((c) => c.value === e.category)?.label} · {tanggal(e.date)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">{e.currency === 'SAR' ? riyal(e.amount) : rupiah(e.amount)}</p>
                <button onClick={() => softDelete('expenses', e.id!)} className="text-xs text-redup">
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
