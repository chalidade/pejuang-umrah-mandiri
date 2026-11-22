import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db'
import { PREP_STEPS } from '../data/steps'
import { daysUntil, jutaan, tanggal } from '../lib/format'
import { toIdr, useSteps, useTrip } from '../lib/hooks'
import { Progress } from '../components/ui'

export default function Home() {
  const trip = useTrip()
  const steps = useSteps()
  const deposits = useLiveQuery(() => db.deposits.toArray(), []) ?? []
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) ?? []

  const days = daysUntil(trip.departDate)
  const doneCount = PREP_STEPS.filter((s) => steps.get(s.id)?.done).length
  const next = PREP_STEPS.find((s) => !steps.get(s.id)?.done)
  const saved = deposits.reduce((a, d) => a + d.amount, 0)
  const spent = expenses.reduce((a, e) => a + toIdr(e.amount, e.currency, trip.sarRate), 0)

  return (
    <div>
      <section className="pt-safe relative overflow-hidden bg-nabawi px-5 pb-8 text-white">
        <svg className="pointer-events-none absolute -top-10 -right-16 opacity-25" width="260" height="260" viewBox="0 0 260 260" aria-hidden>
          <circle cx="130" cy="130" r="110" fill="none" stroke="#B8892B" strokeWidth="14" strokeDasharray="86 12.7" transform="rotate(-90 130 130)" />
        </svg>
        <div className="relative pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/75">{trip.name}</p>
            <Link to="/pengaturan" className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold" aria-label="Atur perjalanan">
              Atur perjalanan
            </Link>
          </div>
          {days === undefined ? (
            <>
              <h1 className="mt-6 text-[2rem] leading-[1.1] font-bold tracking-tight">Kapan kamu berangkat?</h1>
              <p className="mt-2 max-w-[30ch] text-white/80">Isi tanggal berangkat supaya jadwal persiapanmu bisa dihitung mundur.</p>
              <Link to="/pengaturan" className="mt-5 inline-block rounded-xl bg-white px-4 py-3 font-semibold text-nabawi">
                Isi tanggal berangkat
              </Link>
            </>
          ) : days > 0 ? (
            <>
              <p className="mt-6 text-[4.5rem] leading-none font-extrabold tracking-tighter tabular-nums">{days}</p>
              <p className="mt-1 text-lg font-semibold">hari lagi menuju Tanah Suci</p>
              <p className="mt-1 text-sm text-white/70">Berangkat {tanggal(trip.departDate!)}</p>
            </>
          ) : (
            <>
              <h1 className="mt-6 text-[2rem] leading-[1.1] font-bold tracking-tight">Selamat menunaikan umroh</h1>
              <p className="mt-2 text-white/80">Semoga Allah menerima ibadahmu.</p>
              <Link to="/ibadah/hitung" className="mt-5 inline-block rounded-xl bg-white px-4 py-3 font-semibold text-nabawi">
                Buka penghitung tawaf
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="relative -mt-4 space-y-3 px-5">
        <Link to="/persiapan" className="block rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(29,34,40,0.08)]">
          <div className="flex items-baseline justify-between">
            <h2 className="font-bold">Persiapan</h2>
            <span className="text-sm text-redup tabular-nums">
              {doneCount} dari {PREP_STEPS.length} langkah
            </span>
          </div>
          <div className="mt-3">
            <Progress value={doneCount / PREP_STEPS.length} />
          </div>
          {next ? (
            <p className="mt-3 text-[0.95rem]">
              <span className="text-redup">Selanjutnya: </span>
              <span className="font-semibold">{next.title}</span>
            </p>
          ) : (
            <p className="mt-3 text-[0.95rem] font-semibold text-nabawi">Semua langkah persiapan sudah selesai.</p>
          )}
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/biaya?tab=tabungan" className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(29,34,40,0.08)]">
            <p className="text-sm text-redup">Tabungan</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{jutaan(saved)}</p>
            <div className="mt-3">
              <Progress value={trip.savingsTarget ? saved / trip.savingsTarget : 0} tone="emas" />
            </div>
            <p className="mt-2 text-xs text-redup">dari target {jutaan(trip.savingsTarget)}</p>
          </Link>
          <Link to="/biaya?tab=pengeluaran" className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(29,34,40,0.08)]">
            <p className="text-sm text-redup">Pengeluaran</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{jutaan(spent)}</p>
            <p className="mt-3 text-xs text-redup">{expenses.length} catatan</p>
          </Link>
        </div>

        <Link to="/biaya?tab=kalkulator" className="flex items-center justify-between rounded-2xl border border-emas/40 bg-emas-muda p-4">
          <div>
            <h2 className="font-bold">Hitung biaya umrohmu</h2>
            <p className="mt-0.5 text-sm text-redup">Estimasi versi hemat dan nyaman dalam satu menit.</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-emas" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/ibadah" className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(29,34,40,0.08)]">
            <h2 className="font-bold">Panduan umroh</h2>
            <p className="mt-0.5 text-sm text-redup">Dari miqat sampai tahallul, bisa dibaca offline.</p>
          </Link>
          <Link to="/ibadah/hitung" className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(29,34,40,0.08)]">
            <h2 className="font-bold">Hitung tawaf & sa'i</h2>
            <p className="mt-0.5 text-sm text-redup">Ketuk untuk menghitung putaran.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
