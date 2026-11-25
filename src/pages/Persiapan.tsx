import { ProKartu } from '../components/Pro'
import { GRATIS, useLisensi } from '../lib/lisensi'
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, defaultUid, newUid, softDelete, stamp } from '../db'
import { DEFAULT_CHECKLIST } from '../data/checklist'
import { useStepList, useSteps, type StepItem } from '../lib/hooks'
import RemoveButton from '../components/RemoveButton'
import Sheet from '../components/Sheet'
import { Button, Check, Field, PageHeader, Progress, Tabs, inputClass } from '../components/ui'

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
  const { pro } = useLisensi()
  // langkah bawaan setelah langkah ke-3 hanya terbaca separuh di versi gratis; langkah buatan sendiri selalu terbuka
  const terkunci = (s: { custom: boolean; body?: string }, i: number) => !pro && !s.custom && i >= GRATIS.langkahPenuh && !!s.body
  const separuh = (t: string) => {
    const cut = t.slice(0, Math.ceil(t.length / 2))
    return cut.slice(0, Math.max(cut.lastIndexOf(' '), 1)) + '…'
  }
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const [editing, setEditing] = useState<StepItem | null>(null)
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
              {isOpen && terkunci(s, i) && (
                <div className="border-t border-batu px-4 pt-3 pb-4 pl-13">
                  <div className="relative">
                    <p className="text-[0.95rem] leading-relaxed">{separuh(s.body ?? '')}</p>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white" aria-hidden />
                  </div>
                  <div className="mt-3">
                    <ProKartu judul="Lanjut baca dengan Pro">Penjelasan lengkap dan tips untuk langkah {i + 1} sampai {steps.length} ada di versi Pro.</ProKartu>
                  </div>
                </div>
              )}
              {isOpen && !terkunci(s, i) && (
                <div className="border-t border-batu px-4 pt-3 pb-4 pl-13">
                  {s.body ? <p className="text-[0.95rem] leading-relaxed">{s.body}</p> : <p className="text-sm text-redup">Belum ada penjelasan.</p>}
                  {s.tips.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {s.tips.map((t) => (
                        <li key={t} className="flex gap-2 text-sm text-redup">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emas" aria-hidden />
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button onClick={() => setEditing(s)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-nabawi-muda px-3.5 py-2 text-sm font-semibold text-nabawi">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4" />
                    </svg>
                    Ubah langkah
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {steps.length > 0 && <p className="mt-2 text-center text-xs text-redup">Ketuk judul langkah untuk melihat detail dan mengubahnya.</p>}
      {editing && <StepSheet step={editing} onClose={() => setEditing(null)} onRemove={() => remove(editing.id)} />}
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

function StepSheet({ step, onClose, onRemove }: { step: StepItem; onClose: () => void; onRemove: () => void }) {
  const status = useSteps()
  const [d, setD] = useState({ title: step.title, when: step.when, body: step.body ?? '', tips: step.tips.join('\n') })
  const set = (patch: Partial<typeof d>) => setD((x) => ({ ...x, ...patch }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!d.title.trim()) return
    const cur = status.get(step.id)
    await db.steps.put({
      ...cur,
      id: step.id,
      done: !!cur?.done,
      custom: step.custom || undefined,
      order: cur?.order,
      title: d.title.trim(),
      when: d.when.trim(),
      body: d.body.trim(),
      tips: d.tips
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean),
      updatedAt: Date.now(),
    })
    onClose()
  }

  return (
    <Sheet title="Ubah langkah" onClose={onClose}>
      <form onSubmit={save} className="space-y-3 pb-5">
        <Field label="Nama langkah">
          <input className={inputClass} value={d.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="Kapan" hint="Tampil di bawah nama langkah.">
          <input className={inputClass} placeholder="Misal: 1 minggu sebelum berangkat" value={d.when} onChange={(e) => set({ when: e.target.value })} />
        </Field>
        <Field label="Penjelasan" hint="Tampil saat langkah dibuka.">
          <textarea rows={4} className={inputClass} placeholder="Apa yang perlu dilakukan di langkah ini" value={d.body} onChange={(e) => set({ body: e.target.value })} />
        </Field>
        <Field label="Tips" hint="Satu tips per baris. Tampil dengan titik kuning.">
          <textarea rows={3} className={inputClass} placeholder={'Misal: Catat kurs yang kamu dapat\nBawa uang pecahan kecil'} value={d.tips} onChange={(e) => set({ tips: e.target.value })} />
        </Field>
        <Button type="submit" className="w-full" disabled={!d.title.trim()}>
          Simpan perubahan
        </Button>
        <Button
          type="button"
          variant="danger"
          className="w-full"
          onClick={() => {
            onRemove()
            onClose()
          }}
        >
          Hapus langkah
        </Button>
      </form>
    </Sheet>
  )
}

function Barang() {
  const all = useLiveQuery(() => db.checklist.toArray(), [])
  const [draft, setDraft] = useState('')
  const [group, setGroup] = useState(Object.keys(DEFAULT_CHECKLIST)[0])
  const [renaming, setRenaming] = useState<{ from: string; to: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (all && all.length === 0) {
      db.checklist.bulkAdd(Object.entries(DEFAULT_CHECKLIST).flatMap(([g, labels]) => labels.map((label) => ({ group: g, label, done: false, uid: defaultUid(g, label), updatedAt: 0 }))))
    }
  }, [all])

  if (!all) return null
  const items = all.filter((i) => !i.deleted)
  // Kelompok = yang masih punya barang, urut sesuai bawaan lalu buatan sendiri
  const groups = Array.from(new Set([...Object.keys(DEFAULT_CHECKLIST), ...items.map((i) => i.group)])).filter((g) => items.some((i) => i.group === g))
  const doneCount = items.filter((i) => i.done).length
  const typed = group.trim()
  const isNew = typed !== '' && !groups.some((g) => g.toLowerCase() === typed.toLowerCase())

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || !typed) return
    const g = groups.find((x) => x.toLowerCase() === typed.toLowerCase()) ?? typed
    await db.checklist.add({ group: g, label: draft.trim(), done: false, custom: true, ...stamp() })
    setGroup(g)
    setDraft('')
  }

  const rename = async () => {
    if (!renaming) return
    const to = renaming.to.trim()
    if (to && to !== renaming.from) {
      const now = Date.now()
      await db.checklist.filter((i) => i.group === renaming.from && !i.deleted).modify({ group: to, updatedAt: now })
      if (group === renaming.from) setGroup(to)
    }
    setRenaming(null)
  }

  const removeGroup = async (g: string) => {
    const now = Date.now()
    await db.checklist.filter((i) => i.group === g && !i.deleted).modify({ deleted: true, updatedAt: now })
    if (group === g) setGroup('')
    setDeleting(null)
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
          return (
            <div key={g}>
              {renaming?.from === g ? (
                <form
                  className="mb-2 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    rename()
                  }}
                >
                  <input autoFocus className={inputClass} value={renaming.to} onChange={(e) => setRenaming({ from: g, to: e.target.value })} aria-label={`Nama baru kelompok ${g}`} />
                  <button type="submit" className="shrink-0 rounded-xl bg-nabawi px-4 font-semibold text-white">
                    Simpan
                  </button>
                  <button type="button" onClick={() => setRenaming(null)} className="shrink-0 px-1 text-sm font-semibold text-redup">
                    Batal
                  </button>
                </form>
              ) : (
                <div className="mb-2 flex items-center gap-1">
                  <button onClick={() => setRenaming({ from: g, to: g })} className="flex min-w-0 items-center gap-1.5 text-left font-bold" aria-label={`Ganti nama kelompok ${g}`}>
                    <span className="truncate">{g}</span>
                    <svg className="shrink-0 text-[#93a0b8]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4" />
                    </svg>
                  </button>
                  <span className="ml-1 text-xs text-redup tabular-nums">{list.length}</span>
                  <span className="flex-1" />
                  {deleting === g ? (
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-redup">Hapus {list.length} barang?</span>
                      <button onClick={() => removeGroup(g)} className="font-bold text-bata">
                        Hapus
                      </button>
                      <button onClick={() => setDeleting(null)} className="font-semibold text-redup">
                        Batal
                      </button>
                    </span>
                  ) : (
                    <RemoveButton label={`kelompok ${g}`} onClick={() => setDeleting(g)} />
                  )}
                </div>
              )}
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
            <input className={inputClass} placeholder="Kelompok, pilih atau tulis baru" value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Kelompok" />
            <button type="submit" disabled={!draft.trim() || !typed} className="shrink-0 rounded-xl bg-nabawi px-5 font-semibold text-white disabled:opacity-40">
              Tambah
            </button>
          </div>
          {isNew && <p className="text-xs font-semibold text-nabawi">Kelompok baru "{typed}" akan dibuat.</p>}
          {groups.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Pilih kelompok">
              {groups.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGroup(g)}
                  aria-pressed={g === typed}
                  className={`rounded-full px-3 py-1.5 text-[0.8rem] font-semibold ${g === typed ? 'bg-nabawi text-white' : 'bg-nabawi-muda text-tinta'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
