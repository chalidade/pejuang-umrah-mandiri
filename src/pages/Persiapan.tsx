import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { PREP_STEPS } from '../data/steps'
import { DEFAULT_CHECKLIST } from '../data/checklist'
import { useSteps } from '../lib/hooks'
import { Check, PageHeader, Progress, Tabs, inputClass } from '../components/ui'

type Tab = 'langkah' | 'barang'

export default function Persiapan() {
  const [tab, setTab] = useState<Tab>('langkah')
  return (
    <div>
      <PageHeader title="Persiapan" subtitle="Urus dokumen dan barang bawaan sebelum berangkat." />
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'langkah', label: 'Langkah' },
          { value: 'barang', label: 'Barang bawaan' },
        ]}
      />
      {tab === 'langkah' ? <Langkah /> : <Barang />}
    </div>
  )
}

function Langkah() {
  const steps = useSteps()
  const [open, setOpen] = useState<string | null>(null)
  const done = PREP_STEPS.filter((s) => steps.get(s.id)?.done).length

  const toggle = (id: string) => db.steps.put({ id, done: !steps.get(id)?.done })

  return (
    <div className="px-5">
      <div className="mb-4">
        <Progress value={done / PREP_STEPS.length} />
        <p className="mt-2 text-sm text-redup tabular-nums">
          {done} dari {PREP_STEPS.length} langkah selesai
        </p>
      </div>
      <ol className="space-y-2">
        {PREP_STEPS.map((s, i) => {
          const isDone = !!steps.get(s.id)?.done
          const isOpen = open === s.id
          return (
            <li key={s.id} className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(29,34,40,0.08)]">
              <div className="flex items-start gap-3 p-4">
                <button onClick={() => toggle(s.id)} aria-label={isDone ? `Tandai belum: ${s.title}` : `Tandai selesai: ${s.title}`} className="mt-0.5">
                  <Check checked={isDone} />
                </button>
                <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
                  <p className="text-xs font-semibold text-redup tabular-nums">Langkah {i + 1}</p>
                  <p className={`font-semibold ${isDone ? 'text-redup line-through' : ''}`}>{s.title}</p>
                  <p className="text-sm text-redup">{s.when}</p>
                </button>
              </div>
              {isOpen && (
                <div className="border-t border-batu px-4 pt-3 pb-4 pl-13">
                  <p className="text-[0.95rem] leading-relaxed">{s.body}</p>
                  <ul className="mt-3 space-y-1.5">
                    {s.tips.map((t) => (
                      <li key={t} className="flex gap-2 text-sm text-redup">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emas" aria-hidden />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Barang() {
  const items = useLiveQuery(() => db.checklist.toArray(), [])
  const [draft, setDraft] = useState('')
  const [group, setGroup] = useState(Object.keys(DEFAULT_CHECKLIST)[0])

  useEffect(() => {
    if (items && items.length === 0) {
      db.checklist.bulkAdd(Object.entries(DEFAULT_CHECKLIST).flatMap(([g, labels]) => labels.map((label) => ({ group: g, label, done: false }))))
    }
  }, [items])

  if (!items) return null
  const groups = Array.from(new Set([...Object.keys(DEFAULT_CHECKLIST), ...items.map((i) => i.group)]))
  const doneCount = items.filter((i) => i.done).length

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    await db.checklist.add({ group, label: draft.trim(), done: false, custom: true })
    setDraft('')
  }

  return (
    <div className="px-5">
      <p className="mb-4 text-sm text-redup tabular-nums">
        {doneCount} dari {items.length} barang sudah siap
      </p>
      <div className="space-y-5">
        {groups.map((g) => {
          const list = items.filter((i) => i.group === g)
          if (!list.length) return null
          return (
            <div key={g}>
              <h2 className="mb-2 font-bold">{g}</h2>
              <ul className="divide-y divide-batu rounded-2xl bg-white shadow-[0_1px_3px_rgba(29,34,40,0.08)]">
                {list.map((it) => (
                  <li key={it.id} className="flex items-center gap-3 px-4 py-3">
                    <button className="flex flex-1 items-center gap-3 text-left" onClick={() => db.checklist.update(it.id!, { done: !it.done })}>
                      <Check checked={it.done} />
                      <span className={it.done ? 'text-redup line-through' : ''}>{it.label}</span>
                    </button>
                    {it.custom && (
                      <button onClick={() => db.checklist.delete(it.id!)} className="text-sm text-redup" aria-label={`Hapus ${it.label}`}>
                        Hapus
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      <form onSubmit={add} className="mt-6 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(29,34,40,0.08)]">
        <h2 className="mb-3 font-bold">Tambah barang</h2>
        <div className="space-y-2">
          <input className={inputClass} placeholder="Contoh: payung lipat" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Nama barang" />
          <div className="flex gap-2">
            <select className={inputClass} value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Kelompok">
              {groups.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <button type="submit" className="shrink-0 rounded-xl bg-nabawi px-5 font-semibold text-white">
              Tambah
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
