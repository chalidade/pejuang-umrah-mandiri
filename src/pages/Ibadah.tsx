import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { IBADAH, KATEGORI_IBADAH, TEMPAT, TIPS, REKOM_NOTE, REVIEW_NOTE } from '../data/konten'
import { KATEGORI_LIST, KOTA_LIST, formatMenit, infoMedia, mapsUrl, type Kota } from '../lib/konten'
import { useDipelajari } from '../lib/dipelajari'
import { PageHeader, Tabs } from '../components/ui'
import { Galeri, Pemutar, Thumb } from '../components/Media'
import { ProdukList } from '../components/Produk'

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
      <PageHeader title="Panduan" subtitle="Ibadah, tempat, dan tips. Tulisannya tetap bisa dibaca tanpa internet." />
      <Tabs value={tab} onChange={(v) => setParams(v === 'ibadah' ? {} : { tab: v }, { replace: true })} options={TAB_OPTIONS} />
      {tab === 'ibadah' && <IbadahList />}
      {tab === 'destinasi' && <Destinasi />}
      {tab === 'tips' && <TipsList />}
    </div>
  )
}

function Centang() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function IbadahList() {
  const { sudah } = useDipelajari()
  const total = IBADAH.length
  const selesai = IBADAH.filter((x) => sudah(x.id)).length
  return (
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

      <div className={`mt-4 p-4 ${card}`}>
        <div className="flex items-baseline justify-between">
          <p className="font-semibold">Progres belajar</p>
          <p className="text-sm font-semibold text-nabawi tabular-nums">{selesai} dari {total} materi</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-batu">
          <div className="h-full rounded-full bg-nabawi transition-[width]" style={{ width: `${total ? (selesai / total) * 100 : 0}%` }} />
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-emas/40 bg-emas-muda px-3 py-2.5 text-sm">{REVIEW_NOTE}</p>

      {KATEGORI_IBADAH.map((kat) => {
        const items = IBADAH.filter((x) => x.kategori === kat)
        if (!items.length) return null
        return (
          <section key={kat}>
            <h2 className="mt-6 mb-3 text-lg font-bold tracking-tight">{kat}</h2>
            <ol className="space-y-2">
              {items.map((s, i) => {
                const ok = sudah(s.id)
                const video = s.media.find((m) => infoMedia(m))
                return (
                  <li key={s.id}>
                    <Link to={`/ibadah/${s.id}`} className={`flex items-center gap-3 p-3 ${card}`}>
                      {video && <Thumb media={video} className="h-[68px] w-[110px]" />}
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums ${ok ? 'bg-nabawi text-white' : 'bg-nabawi-muda text-nabawi'}`} aria-label={ok ? 'Sudah dipelajari' : undefined}>
                        {ok ? <Centang /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold leading-snug">{s.judul}</span>
                        <span className="block text-sm text-redup">
                          {video && infoMedia(video)!.mulai > 0 ? `Mulai dari menit ${formatMenit(infoMedia(video)!.mulai)}` : s.ringkas}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}

const DOT: Record<string, string> = { Ziarah: 'bg-nabawi', Kuliner: 'bg-bata', Belanja: 'bg-emas' }

function Baris({ to, judul, ringkas, media }: { to: string; judul: string; ringkas: string; media?: { url: string; mulai?: string } }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{judul}</span>
        <span className="block text-sm text-redup">{ringkas}</span>
      </span>
      {media && <Thumb media={media} className="h-[68px] w-[68px]" time={false} />}
    </Link>
  )
}

function Destinasi() {
  const [kota, setKota] = useState<'Semua' | Kota>('Semua')
  const list = TEMPAT.filter((t) => kota === 'Semua' || t.kota === kota)
  return (
    <div className="px-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Pilih kota">
        {(['Semua', ...KOTA_LIST] as const).map((k) => (
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
      {KATEGORI_LIST.map((kat) => {
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
                  <Baris to={`/ibadah/tempat/${t.id}`} judul={t.nama} ringkas={t.ringkas} media={t.media.find((m) => infoMedia(m))} />
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
      <ul className={`mt-4 divide-y divide-batu ${card}`}>
        {TIPS.map((t) => (
          <li key={t.id}>
            <Baris to={`/ibadah/tips/${t.id}`} judul={t.judul} ringkas={t.ringkas} media={t.media.find((m) => infoMedia(m))} />
          </li>
        ))}
      </ul>
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

const Paragraf = ({ items }: { items: string[] }) => (
  <>
    {items.map((p) => (
      <p key={p} className="max-w-[65ch] text-[1.02rem] leading-relaxed">{p}</p>
    ))}
  </>
)

function Berikutnya({ to, judul }: { to: string; judul: string }) {
  return (
    <Link to={to} className="block rounded-2xl bg-nabawi-muda p-4">
      <span className="block text-sm text-redup">Berikutnya</span>
      <span className="block font-semibold text-nabawi">{judul}</span>
    </Link>
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
        <Galeri media={t.media} />
        <Paragraf items={t.isi} />
        <a href={mapsUrl(t)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-garis bg-white py-3 font-semibold text-nabawi">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          Buka di Google Maps
        </a>
        {t.tips.length > 0 && (
          <>
            <h2 className="pt-2 text-lg font-bold tracking-tight">Tips</h2>
            <Points items={t.tips} />
          </>
        )}
        <ProdukList items={t.produk} />
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
      <PageHeader title={t.judul} subtitle={t.ringkas} back="/ibadah?tab=tips" />
      <div className="space-y-4 px-5">
        <Galeri media={t.media} />
        <Paragraf items={t.isi} />
        {t.poin.length > 0 && <Points items={t.poin} />}
        <ProdukList items={t.produk} />
        <p className="text-xs text-redup">{REKOM_NOTE}</p>
        {next && <Berikutnya to={`/ibadah/tips/${next.id}`} judul={next.judul} />}
      </div>
    </article>
  )
}

export function IbadahDetail() {
  const { id } = useParams()
  const { sudah, toggle } = useDipelajari()
  const s = IBADAH.find((g) => g.id === id)
  if (!s) return <PageHeader title="Materi tidak ditemukan" back="/ibadah" />
  const sekategori = IBADAH.filter((g) => g.kategori === s.kategori)
  const nomor = sekategori.indexOf(s) + 1
  const next = sekategori[nomor] ?? IBADAH[IBADAH.indexOf(s) + 1]
  const [utama, ...lain] = s.media.filter((m) => infoMedia(m))
  const info = utama ? infoMedia(utama) : null
  const ok = sudah(s.id)

  return (
    <article>
      <PageHeader title={s.judul} subtitle={s.ringkas} back="/ibadah" />
      <div className="space-y-4 px-5">
        {utama && <Pemutar media={utama} />}
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <span className="rounded-full bg-nabawi-muda px-3 py-1 text-nabawi">{s.kategori} · {nomor}</span>
          {info && info.mulai > 0 && <span className="rounded-full bg-batu px-3 py-1 tabular-nums text-redup">Mulai {formatMenit(info.mulai)}</span>}
        </div>
        <Paragraf items={s.isi} />
        {s.poin.length > 0 && <Points items={s.poin} />}
        {s.doa.map((d) => (
          <figure key={d.arab + d.latin} className="rounded-2xl border border-garis bg-white p-5">
            {d.arab && <p className="arab text-right text-[1.6rem] text-tinta" lang="ar">{d.arab}</p>}
            {d.latin && <p className="mt-3 text-[0.95rem] font-medium italic">{d.latin}</p>}
            <figcaption className="mt-2 text-sm leading-relaxed text-redup">
              {d.arti}
              {d.sumber && <span className="mt-1 block font-semibold text-nabawi">{d.sumber}</span>}
            </figcaption>
          </figure>
        ))}
        {lain.length > 0 && (
          <>
            <h2 className="pt-2 text-lg font-bold tracking-tight">Video dan foto lain</h2>
            <Galeri media={lain} />
          </>
        )}
        {utama && (
          <p className="rounded-xl bg-batu px-3 py-2.5 text-sm text-redup">Video membantu, tapi baca juga penjelasannya supaya pemahamanmu lebih matang.</p>
        )}
        <ProdukList items={s.produk} />
        <button
          onClick={() => toggle(s.id)}
          aria-pressed={ok}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 font-semibold ${ok ? 'border-nabawi bg-nabawi text-white' : 'border-garis bg-white text-nabawi'}`}
        >
          <Centang />
          {ok ? 'Sudah dipelajari' : 'Tandai sudah dipelajari'}
        </button>
        <p className="text-xs text-redup">{REVIEW_NOTE}</p>
        {next && <Berikutnya to={`/ibadah/${next.id}`} judul={next.judul} />}
      </div>
    </article>
  )
}
