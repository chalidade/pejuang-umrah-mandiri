import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, defaultUid, newUid, softDelete, stamp } from '../db'
import { DEFAULT_CHECKLIST } from '../data/checklist'
import { useStepList, useSteps } from '../lib/hooks'
import RemoveButton from '../components/RemoveButton'
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
  const steps = useStepList()
  const status = useSteps()
  const [open, setOpen] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const done = steps.filter((s) => s.done).length

  const toggle = (id: string) => db.steps.put({ ...status.get(id), id, done: !status.get(id)?.done, updatedAt: Date.now() })
  const remove = (id: string) => db.steps.put({ ...status.get(id), id, done: !!status.get(id)?.done, deleted: true, updatedAt: Date.now() })

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await db.steps.put({ id: newUid(), custom: true, title: title.trim(), when: when.trim(), done: false, order: Date.now(), updatedAt: Date.now() })
    setTitle('')
    setWhen('')
  }

  return (
    <div className="px-5">
      <div className="mb-4">
        <Progress value={steps.length ? done / steps.length : 0} />
        <p className="mt-2 text-sm text-redup tabular-nums">
          {done} dari {steps.length} langkah selesai
        </p>
      </div>
      {steps.length === 0 && <p className="mb-4 rounded-2xl bg-nabawi-muda p-4 text-sm">Belum ada langkah. Tambahkan langkah persiapanmu di bawah.</p>}
      <ol className="space-y-2">
        {steps.map((s, i) => {
          const isOpen = open === s.id
          return (
            <li key={s.id} className="rounded-2xl bg-white border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
              <div className="flex items-start gap-3 py-4 pr-2 pl-4">
                <button onClick={() => toggle(s.id)} aria-label={s.done ? `Tandai belum: ${s.title}` : `Tandai selesai: ${s.title}`} className="mt-0.5">
                  <Check checked={s.done} />
                </button>
                <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
                  <p className="text-xs font-semibold text-redup tabular-nums">Langkah {i + 1}</p>
                  <p className={`font-semibold ${s.done ? 'text-redup line-through' : ''}`}>{s.title}</p>
                  {s.when && <p className="text-sm text-redup">{s.when}</p>}
                </button>
                <RemoveButton label={s.title} onClick={() => remove(s.id)} />
              </div>
              {isOpen && s.body && (
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
      <form onSubmit={add} className="mt-6 rounded-2xl bg-white p-4 border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
        <h2 className="mb-3 font-bold">Tambah langkah</h2>
        <div className="space-y-2">
          <input className={inputClass} placeholder="Contoh: Buat SIM internasional" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Nama langkah" />
          <div className="flex gap-2">
            <input className={inputClass} placeholder="Kapan? (opsional)" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Waktu langkah" />
            <button type="submit" className="shrink-0 rounded-xl bg-nabawi px-5 font-semibold text-white">
              Tambah
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Barang() {
  const all = useLiveQuery(() => db.checklist.toArray(), [])
  const [draft, setDraft] = useState('')
  const [group, setGroup] = useState(Object.keys(DEFAULT_CHECKLIST)[0])

  useEffect(() => {
    if (all && all.length === 0) {
      db.checklist.bulkAdd(Object.entries(DEFAULT_CHECKLIST).flatMap(([g, labels]) => labels.map((label) => ({ group: g, label, done: false, uid: defaultUid(g, label), updatedAt: 0 }))))
    }
  }, [all])

  if (!all) return null
  const items = all.filter((i) => !i.deleted)
  const groups = Array.from(new Set([...Object.keys(DEFAULT_CHECKLIST), ...items.map((i) => i.group)]))
  const doneCount = items.filter((i) => i.done).length

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    await db.checklist.add({ group, label: draft.trim(), done: false, custom: true, ...stamp() })
    setDraft('')
  }

  return (
    <div className="px-5">
      <p className="mb-4 text-sm text-redup tabular-nums">
        {doneCount} dari {items.length} barang sudah siap
      </p>
      {items.length === 0 && <p className="mb-4 rounded-2xl bg-nabawi-muda p-4 text-sm">Daftar barang kosong. Tambahkan barang bawaanmu di bawah.</p>}
      <div className="space-y-5">
        {groups.map((g) => {
          const list = items.filter((i) => i.group === g)
          if (!list.length) return null
          return (
            <div key={g}>
              <h2 className="mb-2 font-bold">{g}</h2>
              <ul className="divide-y divide-batu rounded-2xl bg-white border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
                {list.map((it) => (
                  <li key={it.id} className="flex items-center gap-2 py-2 pr-2 pl-4">
                    <button className="flex flex-1 items-center gap-3 text-left" onClick={() => db.checklist.update(it.id!, { done: !it.done, updatedAt: Date.now() })}>
                      <Check checked={it.done} />
                      <span className={it.done ? 'text-redup line-through' : ''}>{it.label}</span>
                    </button>
                    <RemoveButton label={it.label} onClick={() => softDelete('checklist', it.id!)} />
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      <form onSubmit={add} className="mt-6 rounded-2xl bg-white p-4 border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
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
