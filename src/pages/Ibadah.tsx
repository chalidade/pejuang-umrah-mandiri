import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { GUIDE, REVIEW_NOTE } from '../data/guide'
import { TEMPAT, TIPS, REKOM_NOTE, type Kota, type Kategori } from '../data/rekomendasi'
import { PageHeader, Tabs } from '../components/ui'

type Tab = 'ibadah' | 'destinasi' | 'tips'
const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: 'ibadah', label: 'Ibadah' },
  { value: 'destinasi', label: 'Destinasi' },
  { value: 'tips', label: 'Tips' },
]
const card = 'rounded-2xl bg-white border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]'

export default function Panduan() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: Tab = raw === 'destinasi' || raw === 'tips' ? raw : 'ibadah'
  return (
    <div>
      <PageHeader title="Panduan" subtitle="Ibadah, tempat, dan tips. Tetap bisa dibaca tanpa internet." />
      <Tabs value={tab} onChange={(v) => setParams(v === 'ibadah' ? {} : { tab: v }, { replace: true })} options={TAB_OPTIONS} />
      {tab === 'ibadah' && <IbadahList />}
      {tab === 'destinasi' && <Destinasi />}
      {tab === 'tips' && <TipsList />}
    </div>
  )
}

function IbadahList() {
  const steps = GUIDE.filter((g) => g.isStep)
  const others = GUIDE.filter((g) => !g.isStep)
  return (
    <div>
      <div className="px-5">
        <Link to="/ibadah/hitung" className="flex items-center gap-4 rounded-2xl bg-nabawi p-4 text-white">
          <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden>
            <circle cx="26" cy="26" r="21" fill="none" stroke="#FFB423" strokeWidth="5" strokeDasharray="15.6 3.25" transform="rotate(-90 26 26)" />
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
              <Link to={`/ibadah/${s.id}`} className="flex gap-4 rounded-2xl bg-white p-4 border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
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
        <ul className="divide-y divide-batu rounded-2xl bg-white border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
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

const KOTA: ('Semua' | Kota)[] = ['Semua', 'Makkah', 'Madinah']
const KATEGORI: Kategori[] = ['Ziarah', 'Kuliner', 'Belanja']
const DOT: Record<Kategori, string> = { Ziarah: 'bg-nabawi', Kuliner: 'bg-bata', Belanja: 'bg-emas' }

function Destinasi() {
  const [kota, setKota] = useState<'Semua' | Kota>('Semua')
  const list = TEMPAT.filter((t) => kota === 'Semua' || t.kota === kota)
  return (
    <div className="px-5">
      <div className="flex gap-2" role="group" aria-label="Pilih kota">
        {KOTA.map((k) => (
          <button
            key={k}
            onClick={() => setKota(k)}
            aria-pressed={kota === k}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${kota === k ? 'border-nabawi bg-nabawi text-white' : 'border-garis bg-white text-tinta'}`}
          >
            {k}
          </button>
        ))}
      </div>
      <p className="mt-4 rounded-xl border border-emas/40 bg-emas-muda px-3 py-2.5 text-sm">{REKOM_NOTE}</p>
      {KATEGORI.map((kat) => {
        const items = list.filter((t) => t.kategori === kat)
        if (!items.length) return null
        return (
          <section key={kat}>
            <h2 className="mt-6 mb-3 flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className={`h-2.5 w-2.5 rounded-full ${DOT[kat]}`} aria-hidden />
              {kat}
            </h2>
            <ul className={`divide-y divide-batu ${card}`}>
              {items.map((t) => (
                <li key={t.id}>
                  <Link to={`/ibadah/tempat/${t.id}`} className="flex items-start gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{t.nama}</span>
                      <span className="block text-sm text-redup">{t.ringkas}</span>
                    </span>
                    {kota === 'Semua' && <span className="mt-0.5 shrink-0 rounded-full bg-batu px-2.5 py-1 text-xs font-semibold text-redup">{t.kota}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function TipsList() {
  return (
    <div className="px-5">
      <p className="rounded-xl border border-emas/40 bg-emas-muda px-3 py-2.5 text-sm">{REKOM_NOTE}</p>
      <ol className="mt-4 space-y-2">
        {TIPS.map((t) => (
          <li key={t.id}>
            <Link to={`/ibadah/tips/${t.id}`} className={`block p-4 ${card}`}>
              <span className="block font-semibold">{t.title}</span>
              <span className="block text-sm text-redup">{t.summary}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Points({ items }: { items: string[] }) {
  return (
    <ul className={`space-y-2 p-4 ${card}`}>
      {items.map((p) => (
        <li key={p} className="flex gap-3 text-[0.97rem]">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emas" aria-hidden />
          {p}
        </li>
      ))}
    </ul>
  )
}

export function TempatDetail() {
  const { id } = useParams()
  const t = TEMPAT.find((x) => x.id === id)
  if (!t) return <PageHeader title="Tempat tidak ditemukan" back="/ibadah?tab=destinasi" />
  return (
    <article>
      <PageHeader title={t.nama} subtitle={`${t.kategori} · ${t.kota}`} back="/ibadah?tab=destinasi" />
      <div className="space-y-4 px-5">
        {t.paragraphs.map((p) => (
          <p key={p} className="max-w-[65ch] text-[1.02rem] leading-relaxed">{p}</p>
        ))}
        {t.tips && (
          <>
            <h2 className="pt-2 text-lg font-bold tracking-tight">Tips</h2>
            <Points items={t.tips} />
          </>
        )}
        <p className="text-xs text-redup">{REKOM_NOTE}</p>
      </div>
    </article>
  )
}

export function TipDetail() {
  const { id } = useParams()
  const idx = TIPS.findIndex((x) => x.id === id)
  const t = TIPS[idx]
  if (!t) return <PageHeader title="Tips tidak ditemukan" back="/ibadah?tab=tips" />
  const next = TIPS[idx + 1]
  return (
    <article>
      <PageHeader title={t.title} subtitle={t.summary} back="/ibadah?tab=tips" />
      <div className="space-y-4 px-5">
        {t.paragraphs.map((p) => (
          <p key={p} className="max-w-[65ch] text-[1.02rem] leading-relaxed">{p}</p>
        ))}
        {t.points && <Points items={t.points} />}
        <p className="text-xs text-redup">{REKOM_NOTE}</p>
        {next && (
          <Link to={`/ibadah/tips/${next.id}`} className="block rounded-2xl bg-nabawi-muda p-4">
            <span className="block text-sm text-redup">Berikutnya</span>
            <span className="block font-semibold text-nabawi">{next.title}</span>
          </Link>
        )}
      </div>
    </article>
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
          <ul className="space-y-2 rounded-2xl bg-white p-4 border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
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
