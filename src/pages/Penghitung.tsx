import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Tabs } from '../components/ui'

type Mode = 'tawaf' | 'sai'
const TOTAL = 7
const KEY = 'penghitung-v1'

function load(): { mode: Mode; count: number } {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* penyimpanan tidak tersedia */
  }
  return { mode: 'tawaf', count: 0 }
}

async function buzz(finished: boolean) {
  try {
    if (finished) await Haptics.notification({ type: NotificationType.Success })
    else await Haptics.impact({ style: ImpactStyle.Medium })
  } catch {
    navigator.vibrate?.(finished ? [80, 60, 80] : 40)
  }
}

// perjalanan ganjil: Shafa → Marwah, genap: Marwah → Shafa
const saiLabel = (round: number) => (round % 2 === 1 ? 'Dari Shafa ke Marwah.' : 'Dari Marwah ke Shafa.')

export default function Penghitung() {
  const [state, setState] = useState(load)
  const { mode, count } = state
  const done = count >= TOTAL
  const unit = mode === 'tawaf' ? 'putaran' : 'perjalanan'

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* abaikan */
    }
  }, [state])

  const tap = () => {
    if (done) return
    const c = count + 1
    setState({ mode, count: c })
    buzz(c === TOTAL)
  }

  const r = 140
  const circ = 2 * Math.PI * r
  const seg = circ / TOTAL
  const gap = 38
  const current = Math.min(count + 1, TOTAL)

  const info = done
    ? mode === 'tawaf'
      ? { title: 'Tawaf selesai', body: 'Lanjut shalat dua rakaat di belakang Maqam Ibrahim.' }
      : { title: "Sa'i selesai di Marwah", body: 'Lanjut tahallul.' }
    : mode === 'tawaf'
      ? { title: `Putaran ke-${current}`, body: 'Mulai dan akhiri di garis Hajar Aswad.' }
      : { title: `Perjalanan ke-${current}`, body: saiLabel(current) }

  return (
    <div className="pt-safe">
      <header className="flex items-center justify-between px-5 pt-3.5 pb-4">
        <Link to="/ibadah" aria-label="Kembali" className="grid h-[42px] w-[42px] place-items-center rounded-[14px] bg-nabawi-muda">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </Link>
        <h1 className="text-base font-bold">Penghitung</h1>
        <span className="w-[42px]" />
      </header>

      <Tabs
        value={mode}
        onChange={(m) => setState({ mode: m, count: 0 })}
        options={[
          { value: 'tawaf', label: 'Tawaf' },
          { value: 'sai', label: "Sa'i" },
        ]}
      />

      <button onClick={tap} className="relative mx-auto mt-5 block w-[82%] max-w-[318px]" aria-label={done ? 'Selesai' : `Tambah satu. Sekarang ${count} dari ${TOTAL}`}>
        <svg viewBox="0 0 318 318" className="w-full" aria-hidden>
          <g fill="none" strokeWidth="26" strokeLinecap="round" transform="rotate(-90 159 159)">
            {Array.from({ length: TOTAL }, (_, i) => (
              <circle
                key={i}
                cx="159"
                cy="159"
                r={r}
                stroke={i < count ? 'var(--color-nabawi)' : 'var(--color-nabawi-muda)'}
                strokeDasharray={`${seg - gap} ${circ - seg + gap}`}
                strokeDashoffset={-i * seg - gap / 2}
                style={{ transition: 'stroke 200ms ease' }}
              />
            ))}
          </g>
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[8rem] leading-[0.85] font-extrabold tabular-nums">{count}</span>
          <span className="mt-2.5 text-[0.95rem] font-semibold text-redup">
            dari {TOTAL} {unit}
          </span>
        </span>
      </button>

      {!done && (
        <p className="tulis mt-2 flex -rotate-2 items-start justify-center gap-1.5 text-[1.45rem]" aria-hidden>
          <span className="pt-2.5">ketuk layar tiap satu {unit}</span>
          <svg width="30" height="34" viewBox="0 0 30 34" fill="none" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 31C19 30 25 20 22 5" />
            <path d="M14 11l8-7 6 9" />
          </svg>
        </p>
      )}

      <div className="mx-5 mt-3 flex items-center gap-3 rounded-[20px] bg-nabawi-muda px-4 py-3.5 text-[0.9rem] leading-snug" aria-live="polite">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-nabawi text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" aria-hidden>
            {done ? <path d="M6 12l4 4 8-9" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.500v.5" /></>}
          </svg>
        </span>
        <span>
          <b className="block font-bold">{info.title}</b>
          {info.body}
        </span>
      </div>

      <div className="px-5">
        <button onClick={tap} disabled={done} className="mt-4 w-full rounded-[18px] bg-nabawi py-[17px] text-[1.03rem] font-bold text-white shadow-[0_8px_18px_rgba(24,87,240,0.3)] disabled:opacity-40 disabled:shadow-none">
          Selesai satu {unit}
        </button>
        <div className="grid grid-cols-2">
          <button onClick={() => setState({ mode, count: Math.max(count - 1, 0) })} disabled={count === 0} className="py-3.5 text-sm font-bold text-nabawi disabled:opacity-40">
            Kurangi satu
          </button>
          <button onClick={() => setState({ mode, count: 0 })} disabled={count === 0} className="py-3.5 text-sm font-bold text-nabawi disabled:opacity-40">
            Mulai ulang
          </button>
        </div>
      </div>
    </div>
  )
}
