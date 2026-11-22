import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db'
import { PREP_STEPS } from '../data/steps'
import { daysUntil, jutaan, tanggal } from '../lib/format'
import { toIdr, useSteps, useTrip } from '../lib/hooks'

const SHORTCUTS = [
  { to: '/ibadah', label: 'Panduan', icon: 'M4 5.500C7 4 10 4.500 12 6c2-1.500 5-2 8-.5V19c-3-1.500-6-1-8 .5-2-1.500-5-2-8-.5zM12 6v13.500' },
  { to: '/ibadah/hitung', label: 'Hitung tawaf', icon: 'M12 3.800a8.200 8.200 0 108.200 8.200', dashed: true },
  { to: '/persiapan', label: 'Bawaan', icon: 'M6 8h12l-1 12H7zM9 8V6a3 3 0 016 0v2' },
  { to: '/darurat', label: 'Kartu hotel', icon: 'M12 21s-7-5.500-7-11a7 7 0 0114 0c0 5.500-7 11-7 11zM12 12.500a2.500 2.500 0 100-5 2.500 2.500 0 000 5z' },
]

function Skyline() {
  return (
    <svg className="pointer-events-none absolute bottom-0 left-0 w-full" viewBox="0 0 350 78" preserveAspectRatio="xMidYMax slice" fill="#fff" fillOpacity=".16" aria-hidden>
      <rect y="60" width="350" height="18" />
      <path d="M127 60a48 48 0 0196 0z" />
      <rect x="173.500" y="4" width="3" height="10" />
      <path d="M52 60V22l5-10 5 10v38zM288 60V22l5-10 5 10v38zM16 60V36l4-8 4 8v24zM326 60V36l4-8 4 8v24z" />
      <path d="M78 60a15 15 0 0130 0zM242 60a15 15 0 0130 0z" />
    </svg>
  )
}

export default function Home() {
  const trip = useTrip()
  const steps = useSteps()
  const deposits = useLiveQuery(() => db.deposits.filter((d) => !d.deleted).toArray(), []) ?? []
  const expenses = useLiveQuery(() => db.expenses.filter((e) => !e.deleted).toArray(), []) ?? []

  const days = daysUntil(trip.departDate)
  const doneCount = PREP_STEPS.filter((s) => steps.get(s.id)?.done).length
  const nextIndex = PREP_STEPS.findIndex((s) => !steps.get(s.id)?.done)
  const next = PREP_STEPS[nextIndex]
  const saved = deposits.reduce((a, d) => a + d.amount, 0)
  const spent = expenses.reduce((a, e) => a + toIdr(e.amount, e.currency, trip.sarRate), 0)
  const savedPct = trip.savingsTarget ? Math.min(Math.round((saved / trip.savingsTarget) * 100), 100) : 0

  return (
    <div className="pt-safe px-5">
      <header className="flex items-center justify-between pt-5 pb-4">
        <div className="min-w-0">
          <p className="text-[0.85rem] text-redup">Assalamu'alaikum</p>
          <p className="font-display truncate text-[1.2rem] font-bold">{trip.name}</p>
        </div>
        <Link to="/pengaturan" aria-label="Atur perjalanan" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-nabawi-muda text-tinta">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="8" cy="17" r="2" />
          </svg>
        </Link>
      </header>

      <section className="relative h-[236px] overflow-hidden rounded-[28px] bg-nabawi px-5 pt-[18px] text-white">
        <div className="absolute top-[22px] right-[26px] h-[54px] w-[54px] rounded-full bg-emas" aria-hidden />
        <span className="inline-flex items-center gap-2 rounded-full bg-white/16 px-3 py-1.5 text-[0.78rem] font-semibold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" aria-hidden>
            <path d="M21 16v-2l-8-5V3.500a1.500 1.500 0 00-3 0V9l-8 5v2l8-2.500V19l-2 1.500V22l3.500-1 3.500 1v-1.500L13 19v-5.500z" transform="rotate(45 12 12)" />
          </svg>
          Menuju Tanah Suci
        </span>

        {days === undefined ? (
          <div className="relative">
            <h1 className="mt-4 text-[1.7rem] leading-tight font-extrabold">Kapan kamu berangkat?</h1>
            <p className="mt-1 max-w-[26ch] text-sm text-white/85">Isi tanggalnya supaya persiapanmu bisa dihitung mundur.</p>
            <Link to="/pengaturan" className="mt-3 inline-block rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-nabawi">
              Isi tanggal berangkat
            </Link>
          </div>
        ) : days > 0 ? (
          <div className="relative">
            <p className="font-display mt-3 flex items-baseline gap-2.5 text-[5.75rem] leading-none font-extrabold tabular-nums">
              {days}
              <span className="text-2xl font-bold">hari lagi</span>
            </p>
            <p className="mt-1 text-sm text-white/85">Berangkat {tanggal(trip.departDate!)}</p>
            <p className="tulis absolute right-0 -bottom-9 -rotate-3 text-[1.4rem] whitespace-nowrap !text-[#FFE08A]" aria-hidden>
              bismillah, pelan-pelan!
            </p>
          </div>
        ) : (
          <div className="relative">
            <h1 className="mt-4 max-w-[14ch] text-[1.7rem] leading-tight font-extrabold">Selamat menunaikan umroh</h1>
            <Link to="/ibadah/hitung" className="mt-3 inline-block rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-nabawi">
              Buka penghitung tawaf
            </Link>
          </div>
        )}
        <Skyline />
      </section>

      <Link to="/persiapan" className="mt-3 block rounded-[22px] border border-garis px-4 py-3.5 shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
        <div className="flex justify-between text-sm font-bold">
          <span>Persiapan</span>
          <span className="text-nabawi tabular-nums">
            {doneCount} dari {PREP_STEPS.length}
          </span>
        </div>
        <div className="mt-2.5 flex gap-1.5" aria-hidden>
          {PREP_STEPS.map((s) => (
            <i key={s.id} className={`h-1.5 flex-1 rounded-full ${steps.get(s.id)?.done ? 'bg-nabawi' : 'bg-langit'}`} />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 border-t border-garis pt-3">
          <span className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-nabawi-muda font-extrabold text-nabawi tabular-nums">{next ? nextIndex + 1 : '✓'}</span>
          <span className="min-w-0">
            <span className="block text-xs text-redup">{next ? 'Langkah berikutnya' : 'Alhamdulillah'}</span>
            <span className="block truncate text-[0.95rem] font-bold">{next ? next.title : 'Semua langkah sudah selesai'}</span>
          </span>
          <svg className="ml-auto shrink-0 text-[#93a0b8]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </div>
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link to="/biaya?tab=tabungan" className="relative rounded-[22px] bg-nabawi-muda px-4 py-3.5">
          <p className="text-[0.78rem] font-semibold text-redup">Tabungan</p>
          <p className="font-display mt-1.5 text-[1.55rem] leading-none font-extrabold tabular-nums">{jutaan(saved)}</p>
          <div className="mt-2.5 h-1.5 rounded-full bg-white">
            <div className="h-1.5 rounded-full bg-nabawi" style={{ width: `${savedPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-redup">dari {jutaan(trip.savingsTarget)}</p>
          {savedPct > 0 && (
            <span className="tulis absolute top-2.5 right-3 rotate-6 text-[1.35rem]" aria-hidden>
              {savedPct}%!
            </span>
          )}
        </Link>
        <Link to="/biaya?tab=pengeluaran" className="rounded-[22px] bg-nabawi-muda px-4 py-3.5">
          <p className="text-[0.78rem] font-semibold text-redup">Pengeluaran</p>
          <p className="font-display mt-1.5 text-[1.55rem] leading-none font-extrabold tabular-nums">{jutaan(spent)}</p>
          <div className="mt-2.5 h-1.5" />
          <p className="mt-2 text-xs text-redup">{expenses.length} catatan</p>
        </Link>
      </div>

      <Link to="/bareng" className="mt-3 flex items-center gap-3 rounded-[22px] border border-garis px-4 py-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emas-muda text-[#9a6b00]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="9" cy="8" r="3" />
            <circle cx="17" cy="9" r="2.5" />
            <path d="M3 19a6 6 0 0112 0M15 14.500a4.500 4.500 0 016 4.500" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-[0.95rem] font-bold">Umroh bareng partner</span>
          <span className="block text-xs text-redup">Samakan checklist, tabungan, dan pengeluaran.</span>
        </span>
        <svg className="ml-auto shrink-0 text-[#93a0b8]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>

      <nav className="mt-4 grid grid-cols-4 text-center text-xs font-semibold" aria-label="Pintasan">
        {SHORTCUTS.map((s) => (
          <Link key={s.to + s.label} to={s.to}>
            <span className="mx-auto mb-1.5 grid h-[52px] w-[52px] place-items-center rounded-[18px] border border-garis bg-white text-nabawi">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s.dashed ? 2.400 : 2} strokeDasharray={s.dashed ? '5.300 2.100' : undefined} strokeLinecap={s.dashed ? 'butt' : 'round'} strokeLinejoin="round" aria-hidden>
                {s.dashed ? <circle cx="12" cy="12" r="8.200" /> : <path d={s.icon} />}
              </svg>
            </span>
            {s.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
