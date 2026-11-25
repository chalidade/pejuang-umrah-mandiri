// Admin lisensi: buat kunci untuk pembeli, kirim lewat WhatsApp, cabut, dan lepas HP.
// Kunci admin disimpan di browser perangkat ini saja.
import { useEffect, useMemo, useState } from 'react'
import { Button, Field, PageHeader, inputClass } from '../components/ui'
import { ADMIN_API } from '../lib/lisensi'
import { tanggal } from '../lib/format'

const K_ADMIN = 'pum-admin-lisensi'
type Hp = { perangkat: string; nama: string | null; terakhir: number }
type Lis = { kunci: string; nama: string; kontak: string | null; catatan: string | null; dibuat: number; dicabut: number | null; alasan: string | null; perangkat: Hp[] }

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* mode privat */ } },
  del: (k: string) => { try { localStorage.removeItem(k) } catch { /* mode privat */ } },
}

async function admin(kunci: string, path: string, body?: unknown) {
  let res: Response
  try {
    res = await fetch(ADMIN_API + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${kunci}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch { throw new Error('Tidak bisa terhubung ke server lisensi. Periksa internet.') }
  const j = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(j.error ?? `Gagal (kode ${res.status}).`)
  return j
}

/** 0812… / +62812… → 62812… untuk link WhatsApp */
const nomorWa = (s: string | null) => {
  const d = (s ?? '').replace(/\D/g, '')
  if (!d) return ''
  return d.startsWith('0') ? '62' + d.slice(1) : d
}
const pesanWa = (l: Pick<Lis, 'nama' | 'kunci'>) =>
  `Assalamu'alaikum ${l.nama}, terima kasih sudah membeli Pejuang Umrah Pro.\n\nKunci lisensimu:\n${l.kunci}\n\nCara aktivasi: buka https://pejuangumrah.my.id, masuk ke Pengaturan, ketuk "Lihat Pro atau masukkan kunci", lalu tempel kunci di atas. Satu kunci bisa dipakai di 2 HP. Semoga lancar ibadahnya!`
const linkWa = (l: Pick<Lis, 'nama' | 'kunci' | 'kontak'>) => `https://wa.me/${nomorWa(l.kontak)}?text=${encodeURIComponent(pesanWa(l))}`
const jam = (t: number) => tanggal(new Date(t).toISOString().slice(0, 10))

export default function AdminLisensi() {
  const [kunci, setKunci] = useState(() => ls.get(K_ADMIN) ?? '')
  const [input, setInput] = useState('')
  const [data, setData] = useState<Lis[] | null>(null)
  const [maks, setMaks] = useState(2)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const muat = async (k = kunci) => {
    setBusy(true); setErr('')
    try { const j = await admin(k, '/admin/lisensi'); setData(j.lisensi); setMaks(j.maksHp); return true } catch (e) { setErr((e as Error).message); return false } finally { setBusy(false) }
  }
  useEffect(() => { if (kunci && ADMIN_API) muat() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ADMIN_API)
    return (
      <div>
        <PageHeader title="Admin lisensi" back="/pengaturan" />
        <p className="mx-5 rounded-xl bg-emas-muda px-3 py-2.5 text-sm">Server lisensi belum dipasang, jadi semua fitur masih terbuka untuk semua orang. Ikuti panduan di LISENSI.md untuk memasangnya.</p>
      </div>
    )

  if (!kunci)
    return (
      <div>
        <PageHeader title="Admin lisensi" subtitle="Khusus pemilik Pejuang Umrah." back="/pengaturan" />
        <div className="space-y-4 px-5">
          <Field label="Kunci admin" hint="Kunci yang kamu simpan sebagai ADMIN_KUNCI saat memasang server lisensi.">
            <input className={inputClass} type="password" value={input} onChange={(e) => setInput(e.target.value.trim())} autoComplete="off" />
          </Field>
          {err && <p role="alert" className="rounded-xl border border-bata/30 bg-bata/5 px-3 py-2.5 text-sm text-bata">{err}</p>}
          <Button className="w-full" disabled={!input || busy} onClick={async () => { if (await muat(input)) { ls.set(K_ADMIN, input); setKunci(input) } }}>{busy ? 'Memeriksa…' : 'Masuk'}</Button>
        </div>
      </div>
    )

  return (
    <Panel kunci={kunci} data={data} maks={maks} busy={busy} err={err} muat={() => muat()} keluar={() => { ls.del(K_ADMIN); setKunci(''); setData(null) }} />
  )
}

function Panel({ kunci, data, maks, busy, err, muat, keluar }: { kunci: string; data: Lis[] | null; maks: number; busy: boolean; err: string; muat: () => void; keluar: () => void }) {
  const [cari, setCari] = useState('')
  const [baru, setBaru] = useState({ nama: '', kontak: '', catatan: '' })
  const [hasil, setHasil] = useState<Lis | null>(null)
  const [aksiErr, setAksiErr] = useState('')
  const [proses, setProses] = useState(false)
  const list = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return (data ?? []).filter((l) => !q || [l.nama, l.kunci, l.kontak ?? '', l.catatan ?? ''].some((x) => x.toLowerCase().includes(q)))
  }, [data, cari])
  const aktif = (data ?? []).filter((l) => !l.dicabut).length

  const jalankan = async (fn: () => Promise<unknown>) => {
    setProses(true); setAksiErr('')
    try { await fn(); muat() } catch (e) { setAksiErr((e as Error).message) } finally { setProses(false) }
  }
  const buat = () => jalankan(async () => {
    const j = await admin(kunci, '/admin/lisensi', baru)
    setHasil({ kunci: j.kunci, nama: j.nama, kontak: baru.kontak || null, catatan: null, dibuat: Date.now(), dicabut: null, alasan: null, perangkat: [] })
    setBaru({ nama: '', kontak: '', catatan: '' })
  })

  return (
    <div className="pb-10">
      <PageHeader title="Admin lisensi" subtitle={data ? `${aktif} lisensi aktif dari ${data.length}` : 'Memuat…'} back="/pengaturan"
        action={<button onClick={keluar} className="mt-1 shrink-0 rounded-full border border-garis px-3 py-1.5 text-sm font-semibold text-redup">Keluar</button>} />
      <div className="space-y-4 px-5">
        {(err || aksiErr) && <p role="alert" className="rounded-xl border border-bata/30 bg-bata/5 px-3 py-2.5 text-sm text-bata">{err || aksiErr}</p>}

        <section className="space-y-3 rounded-2xl border border-garis bg-white p-4">
          <h2 className="font-bold">Buat kunci untuk pembeli</h2>
          <Field label="Nama pembeli"><input className={inputClass} value={baru.nama} onChange={(e) => setBaru({ ...baru, nama: e.target.value })} placeholder="Contoh: Rina Kartika" /></Field>
          <Field label="Nomor WhatsApp (boleh kosong)"><input className={inputClass} inputMode="tel" value={baru.kontak} onChange={(e) => setBaru({ ...baru, kontak: e.target.value })} placeholder="0812…" /></Field>
          <Field label="Catatan (boleh kosong)"><input className={inputClass} value={baru.catatan} onChange={(e) => setBaru({ ...baru, catatan: e.target.value })} placeholder="Misal: transfer BCA 25 Nov" /></Field>
          <Button className="w-full" disabled={!baru.nama.trim() || proses} onClick={buat}>{proses ? 'Membuat…' : 'Buat kunci'}</Button>
          {hasil && (
            <div className="rounded-xl bg-nabawi-muda p-3">
              <p className="text-sm text-redup">Kunci untuk {hasil.nama}</p>
              <p className="font-mono text-xl font-bold tracking-wider break-all">{hasil.kunci}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => navigator.clipboard?.writeText(pesanWa(hasil))} className="rounded-full border border-garis bg-white px-3.5 py-2 text-sm font-semibold">Salin pesan</button>
                {nomorWa(hasil.kontak) && <a href={linkWa(hasil)} target="_blank" rel="noreferrer" className="rounded-full bg-[#1FA855] px-3.5 py-2 text-sm font-semibold text-white">Kirim lewat WhatsApp</a>}
              </div>
            </div>
          )}
        </section>

        <input className={inputClass} value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama, kunci, atau nomor" aria-label="Cari lisensi" />
        {busy && !data && <p className="text-sm text-redup">Memuat daftar…</p>}
        <ul className="space-y-2">
          {list.map((l) => (
            <li key={l.kunci} className={`rounded-2xl border p-4 ${l.dicabut ? 'border-bata/30 bg-bata/5' : 'border-garis bg-white'}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-semibold">{l.nama}</p>
                <p className={`text-sm font-semibold ${l.dicabut ? 'text-bata' : 'text-nabawi'}`}>{l.dicabut ? 'Dicabut' : `${l.perangkat.length} dari ${maks} HP`}</p>
              </div>
              <p className="font-mono text-sm tracking-wide break-all">{l.kunci}</p>
              <p className="text-xs text-redup">Dibuat {jam(l.dibuat)}{l.kontak ? ` · ${l.kontak}` : ''}{l.catatan ? ` · ${l.catatan}` : ''}</p>
              {l.perangkat.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {l.perangkat.map((h) => (
                    <li key={h.perangkat} className="flex items-center justify-between gap-2 rounded-lg bg-batu px-2.5 py-1.5 text-sm">
                      <span className="min-w-0 truncate">{h.nama || 'HP'} · aktif {jam(h.terakhir)}</span>
                      <button disabled={proses} onClick={() => jalankan(() => admin(kunci, '/admin/lepas', { kunci: l.kunci, perangkat: h.perangkat }))} className="shrink-0 font-semibold text-nabawi">Lepas</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                {nomorWa(l.kontak) && !l.dicabut && <a href={linkWa(l)} target="_blank" rel="noreferrer" className="rounded-full border border-garis px-3 py-1.5 text-[#1A8D48]">Kirim ulang via WA</a>}
                {l.dicabut ? (
                  <button disabled={proses} onClick={() => jalankan(() => admin(kunci, '/admin/pulihkan', { kunci: l.kunci }))} className="rounded-full border border-garis px-3 py-1.5 text-nabawi">Pulihkan</button>
                ) : (
                  <CabutButton disabled={proses} onCabut={() => jalankan(() => admin(kunci, '/admin/cabut', { kunci: l.kunci }))} />
                )}
              </div>
            </li>
          ))}
        </ul>
        {data && list.length === 0 && <p className="text-sm text-redup">{cari ? 'Tidak ada yang cocok.' : 'Belum ada lisensi. Buat kunci pertama di atas.'}</p>}
      </div>
    </div>
  )
}

function CabutButton({ onCabut, disabled }: { onCabut: () => void; disabled: boolean }) {
  const [yakin, setYakin] = useState(false)
  return yakin ? (
    <span className="flex gap-2">
      <button onClick={() => setYakin(false)} className="rounded-full border border-garis px-3 py-1.5 text-redup">Batal</button>
      <button disabled={disabled} onClick={() => { onCabut(); setYakin(false) }} className="rounded-full bg-bata px-3 py-1.5 text-white">Ya, cabut</button>
    </span>
  ) : (
    <button onClick={() => setYakin(true)} className="rounded-full border border-bata/40 px-3 py-1.5 text-bata">Cabut</button>
  )
}
