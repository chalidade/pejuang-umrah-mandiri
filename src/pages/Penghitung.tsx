import { useEffect, useState } from 'react'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { PageHeader } from '../components/ui'

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

function saiLabel(round: number) {
  // putaran ganjil: Shafa → Marwah, genap: Marwah → Shafa
  return round % 2 === 1 ? 'Shafa ke Marwah' : 'Marwah ke Shafa'
}

export default function Penghitung() {
  const [state, setState] = useState(load)
  const { mode, count } = state
  const done = count >= TOTAL

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

  const r = 120
  const circ = 2 * Math.PI * r
  const seg = circ / TOTAL
  const gap = 10

  const current = Math.min(count + 1, TOTAL)
  const status = done
    ? mode === 'tawaf'
      ? 'Tawaf selesai. Lanjut shalat dua rakaat di belakang Maqam Ibrahim.'
      : "Sa'i selesai di Marwah. Lanjut tahallul."
    : mode === 'tawaf'
      ? `Putaran ke-${current}. Mulai dan akhiri di garis Hajar Aswad.`
      : `Perjalanan ke-${current}: ${saiLabel(current)}.`

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <PageHeader title="Penghitung" back="/ibadah" />
      <div className="mx-5 flex rounded-full bg-batu p-1">
        {(['tawaf', 'sai'] as Mode[]).map((m) => (
          <button
            key={m}
            aria-pressed={mode === m}
            onClick={() => setState({ mode: m, count: 0 })}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${mode === m ? 'bg-white shadow-[0_1px_2px_rgba(29,34,40,0.12)]' : 'text-redup'}`}
          >
            {m === 'tawaf' ? 'Tawaf' : "Sa'i"}
          </button>
        ))}
      </div>

      <button
        onClick={tap}
        className="mx-5 mt-5 flex flex-1 flex-col items-center justify-center rounded-3xl bg-white py-6 shadow-[0_1px_3px_rgba(29,34,40,0.08)] active:bg-nabawi-muda"
        aria-label={done ? 'Selesai' : `Tambah putaran. Sekarang ${count} dari ${TOTAL}`}
      >
        <svg viewBox="0 0 300 300" className="w-[78%] max-w-[300px]" aria-hidden>
          {Array.from({ length: TOTAL }, (_, i) => (
            <circle
              key={i}
              cx="150"
              cy="150"
              r={r}
              fill="none"
              stroke={i < count ? 'var(--color-emas)' : 'var(--color-batu)'}
              strokeWidth="22"
              strokeLinecap="butt"
              strokeDasharray={`${seg - gap} ${circ - seg + gap}`}
              strokeDashoffset={-i * seg}
              transform="rotate(-90 150 150)"
              style={{ transition: 'stroke 200ms ease' }}
            />
          ))}
          <text x="150" y="160" textAnchor="middle" fontSize="96" fontWeight="800" fill="var(--color-tinta)" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {count}
          </text>
          <text x="150" y="200" textAnchor="middle" fontSize="18" fontWeight="600" fill="var(--color-redup)">
            dari {TOTAL} {mode === 'tawaf' ? 'putaran' : 'perjalanan'}
          </text>
        </svg>
        <p className={`mt-4 max-w-[30ch] px-4 text-center text-[0.98rem] ${done ? 'font-semibold text-nabawi' : ''}`} aria-live="polite">
          {status}
        </p>
        {!done && <p className="mt-2 text-sm text-redup">Ketuk di mana saja di kotak ini</p>}
      </button>

      <div className="mx-5 mt-3 mb-2 grid grid-cols-2 gap-3">
        <button
          onClick={() => setState({ mode, count: Math.max(count - 1, 0) })}
          disabled={count === 0}
          className="rounded-xl border border-garis bg-white py-3 font-semibold disabled:opacity-40"
        >
          Kurangi satu
        </button>
        <button onClick={() => setState({ mode, count: 0 })} disabled={count === 0} className="rounded-xl border border-garis bg-white py-3 font-semibold disabled:opacity-40">
          Mulai ulang
        </button>
      </div>
      <p className="mx-5 mb-4 text-center text-xs text-redup">Kalau ragu jumlah putaran, ambil hitungan yang lebih sedikit.</p>
    </div>
  )
}
