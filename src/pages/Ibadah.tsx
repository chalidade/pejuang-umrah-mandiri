import { Link, useParams } from 'react-router-dom'
import { GUIDE, REVIEW_NOTE } from '../data/guide'
import { PageHeader } from '../components/ui'

export default function Ibadah() {
  const steps = GUIDE.filter((g) => g.isStep)
  const others = GUIDE.filter((g) => !g.isStep)
  return (
    <div>
      <PageHeader title="Ibadah" subtitle="Panduan umroh yang tetap bisa dibaca tanpa internet." />

      <div className="px-5">
        <Link to="/ibadah/hitung" className="flex items-center gap-4 rounded-2xl bg-nabawi p-4 text-white">
          <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden>
            <circle cx="26" cy="26" r="21" fill="none" stroke="#B8892B" strokeWidth="5" strokeDasharray="15.6 3.25" transform="rotate(-90 26 26)" />
          </svg>
          <div>
            <p className="font-bold">Penghitung tawaf & sa'i</p>
            <p className="text-sm text-white/75">Ketuk layar setiap selesai satu putaran.</p>
          </div>
        </Link>

        <p className="mt-4 rounded-xl border border-emas/40 bg-emas-muda px-3 py-2.5 text-sm">{REVIEW_NOTE}</p>

        <h2 className="mt-6 mb-3 text-lg font-bold tracking-tight">Urutan umroh</h2>
        <ol className="relative space-y-2">
          {steps.map((s, i) => (
            <li key={s.id}>
              <Link to={`/ibadah/${s.id}`} className="flex gap-4 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(29,34,40,0.08)]">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-nabawi-muda text-sm font-bold text-nabawi tabular-nums">{i + 1}</span>
                <span>
                  <span className="block font-semibold">{s.title}</span>
                  <span className="block text-sm text-redup">{s.summary}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <h2 className="mt-6 mb-3 text-lg font-bold tracking-tight">Dasar-dasar</h2>
        <ul className="divide-y divide-batu rounded-2xl bg-white shadow-[0_1px_3px_rgba(29,34,40,0.08)]">
          {others.map((s) => (
            <li key={s.id}>
              <Link to={`/ibadah/${s.id}`} className="block px-4 py-3">
                <span className="block font-semibold">{s.title}</span>
                <span className="block text-sm text-redup">{s.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function IbadahDetail() {
  const { id } = useParams()
  const idx = GUIDE.findIndex((g) => g.id === id)
  const s = GUIDE[idx]
  if (!s) return <PageHeader title="Panduan tidak ditemukan" back="/ibadah" />
  const next = GUIDE.slice(idx + 1).find((g) => g.isStep === s.isStep)

  return (
    <article>
      <PageHeader title={s.title} subtitle={s.summary} back="/ibadah" />
      <div className="space-y-4 px-5">
        {s.paragraphs.map((p) => (
          <p key={p} className="max-w-[65ch] text-[1.02rem] leading-relaxed">
            {p}
          </p>
        ))}
        {s.points && (
          <ul className="space-y-2 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(29,34,40,0.08)]">
            {s.points.map((p) => (
              <li key={p} className="flex gap-3 text-[0.97rem]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emas" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        )}
        {s.doa?.map((d) => (
          <figure key={d.arab} className="rounded-2xl border border-garis bg-white p-5">
            <p className="arab text-right text-[1.6rem] text-tinta" lang="ar">
              {d.arab}
            </p>
            <p className="mt-3 text-[0.95rem] font-medium italic">{d.latin}</p>
            <figcaption className="mt-2 text-sm leading-relaxed text-redup">
              {d.arti}
              {d.sumber && <span className="mt-1 block font-semibold text-nabawi">{d.sumber}</span>}
            </figcaption>
          </figure>
        ))}
        <p className="text-xs text-redup">{REVIEW_NOTE}</p>
        {next && (
          <Link to={`/ibadah/${next.id}`} className="block rounded-2xl bg-nabawi-muda p-4">
            <span className="block text-sm text-redup">Berikutnya</span>
            <span className="block font-semibold text-nabawi">{next.title}</span>
          </Link>
        )}
      </div>
    </article>
  )
}
