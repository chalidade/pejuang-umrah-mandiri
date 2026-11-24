import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, normalizeExpense, saveTrip, softDelete, stamp, type Category, type CostKind, type CostRow, type ExpensePhase } from '../db'
import { costTotal, defaultCostRows, type Profile } from '../data/costs'
import RemoveButton from '../components/RemoveButton'
import Sheet from '../components/Sheet'
import { jutaan, parseAngka, riyal, rupiah, tanggal, today } from '../lib/format'
import { toIdr, useTrip } from '../lib/hooks'
import { Button, Field, PageHeader, Progress, Tabs, inputClass } from '../components/ui'
import { Uang } from '../components/Uang'
import { IKON, IkonKategori, KUNCI_IKON, kunciIkon, warnaIkon } from '../components/IkonKategori'

type Tab = 'kalkulator' | 'pengeluaran' | 'tabungan'

export default function Biaya() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'kalkulator'
  return (
    <div>
      <PageHeader title="Biaya" subtitle="Rencanakan, tabung, dan catat setiap pengeluaran." />
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

const SHADES = ['#1857F0', '#5B8BFF', '#9DBBFF', '#FFB423', '#CFE0FF', '#7FA4FF', '#E3E9F4']

const KIND_LABEL: Record<CostKind, string> = { sekali: 'Sekali bayar', malam: 'Per malam', hari: 'Per hari' }
// Versi sebelumnya menyimpan nama cara hitung sebagai keterangan pos baru; anggap kosong.
const cleanHint = (h: string) => (Object.values(KIND_LABEL).includes(h) ? '' : h)

function Kalkulator() {
  const trip = useTrip()
  const [profile, setProfile] = useState<Profile>('hemat')
  // Disimpan sebagai teks supaya kolom boleh kosong sementara saat diketik
  const [daysText, setDaysText] = useState('9')
  const [peopleText, setPeopleText] = useState('1')
  const days = Math.min(Math.max(Number(daysText) || 1, 1), 90)
  const people = Math.min(Math.max(Number(peopleText) || 1, 1), 50)
  const [saved, setSaved] = useState(false)
  const [nl, setNl] = useState('')
  const [na, setNa] = useState('')
  const [nk, setNk] = useState<CostKind>('sekali')
  const [nh, setNh] = useState('')
  const [editing, setEditing] = useState<CostRow | null>(null)
  const all = useLiveQuery(() => db.costs.orderBy('order').toArray(), [])

  useEffect(() => {
    if (all && all.length === 0) db.costs.bulkAdd(defaultCostRows())
  }, [all])

  const rows = (all ?? [])
    .filter((c) => !c.deleted)
    .map((c, i) => ({
      ...c,
      unit: c[profile],
      total: costTotal(c.kind, c[profile], days),
      color: SHADES[i % SHADES.length],
      sub: [cleanHint(c.hint), c.kind === 'malam' ? `${days - 1} malam` : c.kind === 'hari' ? `${days} hari` : ''].filter(Boolean).join(', '),
    }))
  const perPerson = rows.reduce((a, r) => a + r.total, 0)

  const setUnit = (id: number, v: number) => db.costs.update(id, { [profile]: v, updatedAt: Date.now() })
  const addRow = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseAngka(na)
    if (!nl.trim()) return
    const order = Math.max(0, ...(all ?? []).map((c) => c.order)) + 1
    await db.costs.add({ label: nl.trim(), hint: nh.trim(), kind: nk, hemat: amount, nyaman: amount, order, ...stamp() })
    setNl('')
    setNa('')
    setNh('')
  }

  const share = async () => {
    const text = `Estimasi umroh mandiri ${days} hari (${profile}): ${rupiah(perPerson)} per orang. Hitung punyamu di aplikasi Pejuang Umrah Mandiri.`
    if (navigator.share) await navigator.share({ text }).catch(() => {})
    else await navigator.clipboard?.writeText(text)
  }

  return (
    <div className="px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="text-[0.82rem] font-semibold text-redup">
          Per orang, {days} hari
        </p>
        <div className="flex shrink-0 rounded-full bg-nabawi-muda p-[3px] text-xs font-bold text-redup">
          {(['hemat', 'nyaman'] as Profile[]).map((p) => (
            <button key={p} onClick={() => setProfile(p)} aria-pressed={profile === p} className={`rounded-full px-3 py-1.5 capitalize ${profile === p ? 'bg-nabawi text-white' : ''}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <p className="font-display mt-1.5 text-[clamp(2rem,11vw,2.6rem)] leading-none font-extrabold text-nabawi tabular-nums"><Uang n={perPerson} singkat /></p>
      {people > 1 && <p className="mt-1.5 text-sm text-redup tabular-nums">Total {people} orang: {rupiah(perPerson * people)}</p>}

      <div className="mt-4 flex h-3 gap-[3px]" aria-hidden>
        {rows.map((r) => (
          <i key={r.uid} className="block rounded-full" style={{ width: `${perPerson ? (r.total / perPerson) * 100 : 0}%`, background: r.color }} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Lama perjalanan">
          <NumberUnit value={daysText} onChange={setDaysText} unit="hari" label="Lama perjalanan dalam hari" />
        </Field>
        <Field label="Jumlah orang">
          <NumberUnit value={peopleText} onChange={setPeopleText} unit="orang" label="Jumlah orang" />
        </Field>
      </div>

      <p className="tulis mt-5 mr-1 flex items-end justify-end gap-1.5 text-[1.45rem]" aria-hidden>
        angkanya bisa kamu ganti
        <svg width="34" height="30" viewBox="0 0 34 30" fill="none" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 4c14 0 22 6 23 21" />
          <path d="M19 19l7 7 6-8" />
        </svg>
      </p>
      <ul className="mt-1">
        {rows.map((r) => (
          <li key={r.uid} className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-b border-garis py-2.5 last:border-0">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden />
            <button onClick={() => setEditing(r)} className="min-w-0 flex-1 basis-[9rem] text-left break-words" aria-label={`Ubah ${r.label}`}>
              <span className="flex items-center gap-1.5 text-[0.92rem] font-bold">
                {r.label}
                <svg className="shrink-0 text-[#93a0b8]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4" />
                </svg>
              </span>
              {r.sub && <span className="block text-xs text-redup">{r.sub}</span>}
            </button>
            <span className="ml-auto flex shrink-0 items-center gap-1">
              <input
                inputMode="numeric"
                aria-label={r.label}
                className="w-[7.5em] rounded-xl border border-garis bg-white px-2.5 py-2 text-right text-sm font-bold tabular-nums outline-none focus:border-nabawi"
                value={r.unit.toLocaleString('id-ID')}
                onChange={(e) => setUnit(r.id!, parseAngka(e.target.value))}
              />
              <RemoveButton label={r.label} onClick={() => softDelete('costs', r.id!)} />
            </span>
          </li>
        ))}
      </ul>
      {rows.length === 0 && all && <p className="rounded-2xl bg-nabawi-muda p-4 text-sm">Belum ada pos biaya. Tambahkan di bawah.</p>}
      {rows.length > 0 && <p className="mt-1 text-xs text-redup">Ketuk nama pos untuk mengubah nama, keterangan, atau cara hitung.</p>}
      {editing && <CostSheet row={editing} onClose={() => setEditing(null)} />}

      <form onSubmit={addRow} className="mt-3 space-y-2 rounded-2xl border border-dashed border-langit p-3.5">
        <p className="text-sm font-bold">Tambah pos biaya</p>
        <div className="flex gap-2">
          <input className={`${inputClass} min-w-0`} placeholder="Contoh: Ziarah Thaif" value={nl} onChange={(e) => setNl(e.target.value)} aria-label="Nama pos biaya" />
          <input inputMode="numeric" className={`${inputClass.replace("w-full", "")} w-[8em] shrink-0`} placeholder="Rp" value={na ? parseAngka(na).toLocaleString('id-ID') : ''} onChange={(e) => setNa(e.target.value)} aria-label="Nominal" />
        </div>
        <input className={inputClass} placeholder="Keterangan (opsional), misal: bus PP dari hotel" value={nh} onChange={(e) => setNh(e.target.value)} aria-label="Keterangan pos biaya" />
        <div className="flex gap-2">
          <select className={inputClass} value={nk} onChange={(e) => setNk(e.target.value as CostKind)} aria-label="Cara hitung">
            {(Object.keys(KIND_LABEL) as CostKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <button type="submit" className="shrink-0 rounded-xl bg-nabawi px-5 font-semibold text-white">
            Tambah
          </button>
        </div>
      </form>

      <div className="mt-4 flex gap-2">
        <button
          onClick={async () => {
            await saveTrip({ savingsTarget: perPerson * (trip.travelers || 1) })
            setSaved(true)
          }}
          className="flex-1 rounded-2xl bg-nabawi py-3.5 text-[0.97rem] font-bold text-white shadow-[0_8px_18px_rgba(24,87,240,0.3)]"
        >
          {saved ? 'Tersimpan sebagai target' : 'Jadikan target tabungan'}
        </button>
        <button onClick={share} className="rounded-2xl border border-garis px-4 text-sm font-bold text-nabawi">
          Bagikan
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-redup">Angka awal adalah perkiraan kasar dan bisa berbeda tergantung musim dan maskapai.</p>
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
        <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums"><Uang n={saved} /></p>
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
        <input inputMode="numeric" className={inputClass} placeholder="Nominal setoran" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Nominal setoran" />
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

const PHASES: { value: ExpensePhase; label: string; hint: string }[] = [
  { value: 'pra', label: 'Pra umroh', hint: 'Yang memberangkatkan: tiket, visa, hotel' },
  { value: 'non', label: 'Non umroh', hint: 'Keperluan: baju, makanan, obat-obatan' },
  { value: 'umroh', label: 'Umroh', hint: 'Selama di Tanah Suci' },
]

interface Draft {
  id?: number
  title: string
  amount: string
  currency: 'IDR' | 'SAR'
  phase: ExpensePhase
  categoryUid: string
  date: string
}

const emptyDraft = (phase: ExpensePhase = 'pra'): Draft => ({ title: '', amount: '', currency: phase === 'umroh' ? 'SAR' : 'IDR', phase, categoryUid: '', date: today() })

function Pengeluaran() {
  const trip = useTrip()
  const expenses = (useLiveQuery(() => db.expenses.orderBy('date').reverse().filter((e) => !e.deleted).toArray(), []) ?? []).map(normalizeExpense)
  const categories = useLiveQuery(() => db.categories.orderBy('order').filter((c) => !c.deleted).toArray(), []) ?? []
  const [filter, setFilter] = useState<ExpensePhase | 'semua'>('semua')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [manage, setManage] = useState(false)

  const idr = (e: { amount: number; currency: 'IDR' | 'SAR' }) => toIdr(e.amount, e.currency, trip.sarRate)
  const catName = (uid?: string) => categories.find((c) => c.uid === uid)?.name ?? 'Tanpa kategori'
  const total = expenses.reduce((a, e) => a + idr(e), 0)
  const shown = filter === 'semua' ? expenses : expenses.filter((e) => e.phase === filter)
  const shownTotal = shown.reduce((a, e) => a + idr(e), 0)

  const catOf = (uid?: string) => categories.find((c) => c.uid === uid)
  const byCat = Object.values(
    shown.reduce<Record<string, { key: string; name: string; ikon: string; sum: number; n: number }>>((acc, e) => {
      const c = catOf(e.categoryUid)
      const key = c?.uid ?? 'none'
      acc[key] ??= { key, name: c?.name ?? 'Tanpa kategori', ikon: kunciIkon(c), sum: 0, n: 0 }
      acc[key].sum += idr(e); acc[key].n += 1
      return acc
    }, {}),
  ).sort((a, b) => b.sum - a.sum)
  const persen = (v: number) => (shownTotal ? Math.round((v / shownTotal) * 100) : 0)

  const edit = (e: (typeof expenses)[number]) =>
    setDraft({ id: e.id, title: e.title, amount: String(e.amount).replace('.', ','), currency: e.currency, phase: e.phase!, categoryUid: e.categoryUid ?? '', date: e.date })

  return (
    <div className="px-5">
      <div className="rounded-[22px] border border-garis bg-white p-4 shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
        <p className="text-sm text-redup">Total pengeluaran</p>
        <p className="font-display mt-1 text-[2rem] leading-none font-extrabold tabular-nums"><Uang n={total} /></p>
        <p className="mt-1.5 text-xs text-redup tabular-nums">Kurs 1 SAR = {rupiah(trip.sarRate)}</p>
        <div className="mt-4 space-y-2">
          {PHASES.map((ph) => {
            const list = expenses.filter((e) => e.phase === ph.value)
            const sum = list.reduce((a, e) => a + idr(e), 0)
            const active = filter === ph.value
            return (
              <button
                key={ph.value}
                onClick={() => setFilter(active ? 'semua' : ph.value)}
                aria-pressed={active}
                className={`flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl px-4 py-3 text-left transition-colors ${active ? 'bg-nabawi text-white' : 'bg-nabawi-muda'}`}
              >
                <span className="min-w-0">
                  <span className="block font-bold">{ph.label}</span>
                  <span className={`block text-xs ${active ? 'text-white/80' : 'text-redup'}`}>{list.length} catatan</span>
                </span>
                <span className="font-display ml-auto text-[1.15rem] font-extrabold whitespace-nowrap tabular-nums">{rupiah(sum)}</span>
              </button>
            )
          })}
        </div>
        {filter !== 'semua' && <p className="mt-3 text-xs text-redup">{PHASES.find((p) => p.value === filter)?.hint}. Ketuk lagi untuk melihat semua.</p>}
      </div>

      {byCat.length > 0 && (
        <section className="mt-4 rounded-[22px] border border-garis bg-white p-4 shadow-[0_6px_18px_rgba(24,87,240,0.07)]" aria-label="Ringkasan per kategori">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h2 className="font-bold whitespace-nowrap">Per kategori</h2>
            <p className="text-sm text-redup tabular-nums">{filter === 'semua' ? 'Semua' : PHASES.find((p) => p.value === filter)?.label} · {rupiah(shownTotal)}</p>
          </div>
          <div className="mt-3 flex h-2.5 gap-[3px] overflow-hidden rounded-full" aria-hidden>
            {byCat.map((c) => (
              <span key={c.key} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(c.sum / (shownTotal || 1)) * 100}%`, background: warnaIkon(c.ikon), minWidth: 3 }} />
            ))}
          </div>
          <ul className="mt-2 divide-y divide-batu">
            {byCat.map((c) => (
              <li key={c.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <IkonKategori kunci={c.ikon} size={40} />
                <span className="min-w-0 flex-1 basis-[7rem] break-words">
                  <span className="block font-semibold leading-snug">{c.name}</span>
                  <span className="block text-xs text-redup">{c.n} catatan</span>
                </span>
                <span className="ml-auto flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold whitespace-nowrap tabular-nums">{rupiah(c.sum)}</span>
                  <span className="rounded-full px-2 py-0.5 text-xs font-bold tabular-nums" style={{ background: IKON[c.ikon].bg, color: IKON[c.ikon].fg }}>{persen(c.sum)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-4 flex gap-2">
        <Button className="flex-1" onClick={() => setDraft(emptyDraft(filter === 'semua' ? 'pra' : filter))}>
          Catat pengeluaran
        </Button>
        <Button variant="ghost" onClick={() => setManage(true)}>
          Kategori
        </Button>
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 text-center text-sm text-redup">
          {filter === 'semua' ? 'Belum ada catatan. Mulai dari biaya paspor atau vaksin.' : `Belum ada catatan ${PHASES.find((p) => p.value === filter)?.label.toLowerCase()}.`}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-garis rounded-[22px] border border-garis bg-white">
          {shown.map((e) => (
            <li key={e.uid}>
              <button onClick={() => edit(e)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <IkonKategori kunci={kunciIkon(catOf(e.categoryUid))} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.title}</p>
                  <p className="truncate text-xs text-redup">
                    {PHASES.find((p) => p.value === e.phase)?.label} · {catName(e.categoryUid)} · {tanggal(e.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{e.currency === 'SAR' ? riyal(e.amount) : rupiah(e.amount)}</p>
                  {e.currency === 'SAR' && <p className="text-xs text-redup tabular-nums">{rupiah(idr(e))}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {shown.length > 0 && <p className="mt-2 text-center text-xs text-redup">Ketuk catatan untuk mengubah atau menghapus.</p>}

      {draft && <ExpenseSheet draft={draft} categories={categories} onClose={() => setDraft(null)} onManage={() => setManage(true)} />}
      {manage && <CategorySheet categories={categories} usage={(uid) => expenses.filter((e) => e.categoryUid === uid).length} onClose={() => setManage(false)} />}
    </div>
  )
}

function ExpenseSheet({ draft, categories, onClose, onManage }: { draft: Draft; categories: Category[]; onClose: () => void; onManage: () => void }) {
  const [d, setD] = useState<Draft>({ ...draft, categoryUid: draft.categoryUid || categories[0]?.uid || '' })
  const [confirm, setConfirm] = useState(false)
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }))
  const amount = Number(d.amount.replace(/\./g, '').replace(',', '.'))
  const valid = d.title.trim() && amount > 0

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    const row = { title: d.title.trim(), amount, currency: d.currency, phase: d.phase, categoryUid: d.categoryUid, date: d.date || today(), updatedAt: Date.now() }
    if (d.id) await db.expenses.update(d.id, row)
    else await db.expenses.add({ ...row, ...stamp() })
    onClose()
  }

  return (
    <Sheet title={d.id ? 'Ubah pengeluaran' : 'Catat pengeluaran'} onClose={onClose}>
      <form onSubmit={save} className="space-y-3 pb-5">
        <div className="grid grid-cols-3 gap-1.5 rounded-[14px] bg-nabawi-muda p-1" role="radiogroup" aria-label="Kelompok">
          {PHASES.map((ph) => (
            <button
              type="button"
              key={ph.value}
              role="radio"
              aria-checked={d.phase === ph.value}
              onClick={() => set({ phase: ph.value })}
              className={`rounded-[11px] py-2 text-[0.82rem] font-bold ${d.phase === ph.value ? 'bg-white text-tinta shadow-[0_2px_6px_rgba(11,31,75,0.1)]' : 'text-redup'}`}
            >
              {ph.label}
            </button>
          ))}
        </div>
        <p className="-mt-1 text-xs text-redup">{PHASES.find((p) => p.value === d.phase)?.hint}</p>
        <Field label="Keterangan">
          <input className={inputClass} placeholder="Contoh: makan siang nasi bukhari" value={d.title} onChange={(e) => set({ title: e.target.value })} autoFocus={!d.id} />
        </Field>
        <Field label="Nominal">
          <div className="flex gap-2">
            <input inputMode="decimal" className={inputClass} placeholder="0" value={d.amount} onChange={(e) => set({ amount: e.target.value })} />
            <select className={`${inputClass} w-28`} value={d.currency} onChange={(e) => set({ currency: e.target.value as 'IDR' | 'SAR' })} aria-label="Mata uang">
              <option value="IDR">IDR</option>
              <option value="SAR">SAR</option>
            </select>
          </div>
        </Field>
        <Field label="Kategori">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Pilih kategori">
            {categories.map((c) => {
              const on = d.categoryUid === c.uid
              return (
                <button key={c.uid} type="button" onClick={() => set({ categoryUid: c.uid })} aria-pressed={on}
                  className={`flex items-center gap-2 rounded-full border py-1 pr-3.5 pl-1 text-sm font-semibold ${on ? 'border-nabawi bg-nabawi text-white' : 'border-garis bg-white'}`}>
                  <IkonKategori kunci={kunciIkon(c)} size={28} />
                  {c.name}
                </button>
              )
            })}
            <button type="button" onClick={onManage} className="rounded-full border border-dashed border-garis px-3.5 py-2 text-sm font-semibold text-nabawi">
              Kelola kategori
            </button>
          </div>
        </Field>
        <Field label="Tanggal">
          <input type="date" className={inputClass} value={d.date} onChange={(e) => set({ date: e.target.value })} />
        </Field>
        <Button type="submit" className="w-full" disabled={!valid}>
          {d.id ? 'Simpan perubahan' : 'Simpan pengeluaran'}
        </Button>
        {d.id &&
          (confirm ? (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="ghost" onClick={() => setConfirm(false)}>
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  await softDelete('expenses', d.id!)
                  onClose()
                }}
              >
                Ya, hapus
              </Button>
            </div>
          ) : (
            <Button type="button" variant="danger" className="w-full" onClick={() => setConfirm(true)}>
              Hapus pengeluaran
            </Button>
          ))}
      </form>
    </Sheet>
  )
}

function CategorySheet({ categories, usage, onClose }: { categories: Category[]; usage: (uid: string) => number; onClose: () => void }) {
  const [name, setName] = useState('')
  const [pilih, setPilih] = useState<string | null>(null)
  const rename = (c: Category, v: string) => db.categories.update(c.id!, { name: v, updatedAt: Date.now() })
  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const all = await db.categories.toArray()
    await db.categories.add({ name: name.trim(), order: Math.max(0, ...all.map((c) => c.order)) + 1, ...stamp() })
    setName('')
  }

  return (
    <Sheet title="Kategori" onClose={onClose}>
      <p className="mb-3 text-sm text-redup">Ketuk ikon untuk mengganti ikon, ketuk nama untuk mengganti nama. Catatan dari kategori yang dihapus menjadi "Tanpa kategori".</p>
      <ul className="divide-y divide-garis rounded-2xl border border-garis">
        {categories.map((c) => (
          <li key={c.uid} className="flex flex-wrap items-center gap-2 py-1.5 pr-2 pl-2">
            <button type="button" onClick={() => setPilih(pilih === c.uid ? null : c.uid)} aria-expanded={pilih === c.uid} aria-label={`Ganti ikon ${c.name}`} className="rounded-full">
              <IkonKategori kunci={kunciIkon(c)} size={36} />
            </button>
            <input
              className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-2 font-semibold outline-none focus:bg-nabawi-muda"
              value={c.name}
              onChange={(e) => rename(c, e.target.value)}
              onBlur={(e) => !e.target.value.trim() && rename(c, 'Tanpa nama')}
              aria-label={`Nama kategori ${c.name}`}
            />
            <span className="shrink-0 text-xs text-redup tabular-nums">{usage(c.uid)} catatan</span>
            <RemoveButton label={c.name} onClick={() => softDelete('categories', c.id!)} />
            {pilih === c.uid && (
              <div className="basis-full pb-2" role="group" aria-label={`Pilih ikon untuk ${c.name}`}>
                <div className="grid grid-cols-8 gap-1.5 pt-1">
                  {KUNCI_IKON.map((k) => (
                    <button key={k} type="button" title={IKON[k].label} aria-label={IKON[k].label} aria-pressed={kunciIkon(c) === k}
                      onClick={() => { db.categories.update(c.id!, { icon: k, updatedAt: Date.now() }); setPilih(null) }}
                      className={`grid place-items-center rounded-full p-0.5 ${kunciIkon(c) === k ? 'ring-2 ring-nabawi' : ''}`}>
                      <IkonKategori kunci={k} size={32} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-3 flex gap-2 pb-5">
        <input className={inputClass} placeholder="Kategori baru, misal: Laundry" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nama kategori baru" />
        <button type="submit" className="shrink-0 rounded-xl bg-nabawi px-5 font-semibold text-white">
          Tambah
        </button>
      </form>
    </Sheet>
  )
}

function CostSheet({ row, onClose }: { row: CostRow; onClose: () => void }) {
  const [d, setD] = useState({ label: row.label, hint: cleanHint(row.hint), kind: row.kind, hemat: row.hemat, nyaman: row.nyaman })
  const set = (patch: Partial<typeof d>) => setD((x) => ({ ...x, ...patch }))
  const unit = d.kind === 'malam' ? 'per malam' : d.kind === 'hari' ? 'per hari' : ''

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!d.label.trim()) return
    await db.costs.update(row.id!, { ...d, label: d.label.trim(), hint: d.hint.trim(), updatedAt: Date.now() })
    onClose()
  }

  return (
    <Sheet title="Ubah pos biaya" onClose={onClose}>
      <form onSubmit={save} className="space-y-3 pb-5">
        <Field label="Nama">
          <input className={inputClass} value={d.label} onChange={(e) => set({ label: e.target.value })} />
        </Field>
        <Field label="Keterangan" hint="Teks kecil di bawah nama. Boleh dikosongkan.">
          <input className={inputClass} placeholder="Misal: bus PP dari hotel" value={d.hint} onChange={(e) => set({ hint: e.target.value })} />
        </Field>
        <Field label="Cara hitung">
          <select className={inputClass} value={d.kind} onChange={(e) => set({ kind: e.target.value as CostKind })}>
            {(Object.keys(KIND_LABEL) as CostKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Versi hemat ${unit}`.trim()}>
            <input inputMode="numeric" className={inputClass} value={d.hemat.toLocaleString('id-ID')} onChange={(e) => set({ hemat: parseAngka(e.target.value) })} />
          </Field>
          <Field label={`Versi nyaman ${unit}`.trim()}>
            <input inputMode="numeric" className={inputClass} value={d.nyaman.toLocaleString('id-ID')} onChange={(e) => set({ nyaman: parseAngka(e.target.value) })} />
          </Field>
        </div>
        <Button type="submit" className="w-full" disabled={!d.label.trim()}>
          Simpan perubahan
        </Button>
        <Button
          type="button"
          variant="danger"
          className="w-full"
          onClick={async () => {
            await softDelete('costs', row.id!)
            onClose()
          }}
        >
          Hapus pos ini
        </Button>
      </form>
    </Sheet>
  )
}

/** Kolom angka dengan satuan di dalamnya, misal "9 hari". Kosong saat diketik, kembali ke 1 saat ditinggalkan. */
function NumberUnit({ value, onChange, unit, label }: { value: string; onChange: (v: string) => void; unit: string; label: string }) {
  return (
    <div className="flex items-center rounded-xl border border-garis bg-white focus-within:border-nabawi focus-within:ring-2 focus-within:ring-nabawi/20">
      <input
        inputMode="numeric"
        aria-label={label}
        className="w-full min-w-0 bg-transparent py-3 pl-3.5 text-base tabular-nums outline-none focus-visible:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
        onBlur={() => (!Number(value) ? onChange('1') : onChange(String(Number(value))))}
        onFocus={(e) => e.target.select()}
      />
      <span className="pr-3.5 text-redup">{unit}</span>
    </div>
  )
}
