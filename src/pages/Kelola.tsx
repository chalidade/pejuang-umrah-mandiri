// Halaman Kelola konten: tim non-teknis mengisi Destinasi & Tips lewat formulir.
// "Terbitkan" menyimpan rekomendasi.json ke GitHub; GitHub Pages lalu membangun ulang aplikasi (± 2 menit).
// Tanpa server: kunci akses GitHub milik anggota tim disimpan di browser HP/laptop itu saja.
import { useEffect, useMemo, useState } from 'react'
import { Button, Field, PageHeader, Tabs, inputClass } from '../components/ui'
import Sheet from '../components/Sheet'
import { cekKonten, rapikan, KATEGORI_LIST, KOTA_LIST, PENANDA_USULAN, type Konten, type TempatData, type TipData, type Usulan } from '../lib/konten'
import kontenTayang from '../data/rekomendasi.json'

const REPO = 'chalidade/pejuang-umrah-mandiri'
const BRANCH = 'main'
const PATH = 'src/data/rekomendasi.json'
const API = `https://api.github.com/repos/${REPO}/contents/${PATH}`
const K_TOKEN = 'pum-kelola-kunci'
const K_DRAF = 'pum-kelola-draf'
const K_NAMA = 'pum-kelola-nama'
const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new'

const store = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* mode privat */ } },
  del: (k: string) => { try { localStorage.removeItem(k) } catch { /* mode privat */ } },
}

// base64 <-> teks UTF-8 (nama tempat bisa berisi tanda petik khusus)
const keB64 = (s: string) => { const b = new TextEncoder().encode(s); let bin = ''; b.forEach((x) => (bin += String.fromCharCode(x))); return btoa(bin) }
const dariB64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, '')), (c) => c.charCodeAt(0)))

async function gh(token: string, init?: RequestInit) {
  const res = await fetch(init ? API : `${API}?ref=${BRANCH}&t=${Date.now()}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', ...(init?.headers ?? {}) },
  })
  if (res.ok) return res.json()
  if (res.status === 401) throw new Error('Kunci akses tidak berlaku atau sudah kedaluwarsa. Buat kunci baru, lalu masuk lagi.')
  if (res.status === 403 || res.status === 404) throw new Error('Akun GitHub-mu belum punya izin menulis ke aplikasi ini. Minta admin mengundangmu, dan pastikan kuncinya punya izin Contents: Read and write.')
  if (res.status === 409) throw new Error('Ada anggota tim lain yang baru saja menerbitkan perubahan. Ketuk "Muat ulang" untuk mengambil versi terbaru (perubahanmu yang belum terbit akan hilang).')
  throw new Error(`GitHub menolak permintaan (kode ${res.status}). Coba lagi sebentar lagi.`)
}

type Draf = { konten: Konten; asli: string; sha: string }

export default function Kelola() {
  const [token, setToken] = useState(() => store.get(K_TOKEN) ?? '')
  const [draf, setDraf] = useState<Draf | null>(() => { try { return JSON.parse(store.get(K_DRAF) ?? 'null') } catch { return null } })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { if (draf) store.set(K_DRAF, JSON.stringify(draf)); else store.del(K_DRAF) }, [draf])

  const muat = async (t = token) => {
    setBusy(true); setError(''); setNotice('')
    try {
      const j = await gh(t)
      const teks = dariB64(j.content)
      setDraf({ konten: JSON.parse(teks), asli: JSON.stringify(JSON.parse(teks)), sha: j.sha })
      return true
    } catch (e) { setError((e as Error).message); return false } finally { setBusy(false) }
  }

  // ambil konten terbaru saat halaman dibuka, kecuali ada perubahan yang belum terbit
  useEffect(() => {
    const adaDraf = draf && JSON.stringify(rapikan(draf.konten)) !== JSON.stringify(rapikan(JSON.parse(draf.asli)))
    if (token && !adaDraf) muat()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [adminMasuk, setAdminMasuk] = useState(false)
  if (!token && adminMasuk)
    return <Masuk onMasuk={async (t) => { if (await muat(t)) { store.set(K_TOKEN, t); setToken(t) } }} onBatal={() => { setAdminMasuk(false); setError('') }} busy={busy} error={error} />
  if (!token) return <ModeUsulan onAdmin={() => setAdminMasuk(true)} />

  const keluar = () => { store.del(K_TOKEN); store.del(K_DRAF); setToken(''); setDraf(null); setError(''); setNotice('') }

  return (
    <div>
      <PageHeader title="Kelola konten" subtitle="Isi Destinasi dan Tips untuk semua pengguna." back="/pengaturan"
        action={<button onClick={keluar} className="mt-1 shrink-0 rounded-full border border-garis px-3 py-1.5 text-sm font-semibold text-redup">Keluar</button>} />
      {error && <p role="alert" className="mx-5 mb-4 rounded-xl border border-bata/30 bg-bata/5 px-3 py-2.5 text-sm text-bata">{error}</p>}
      {notice && <p role="status" className="mx-5 mb-4 rounded-xl border border-nabawi/20 bg-nabawi-muda px-3 py-2.5 text-sm text-nabawi">{notice}</p>}
      {!draf ? (
        <div className="px-5">
          <Button className="w-full" onClick={() => muat()} disabled={busy}>{busy ? 'Mengambil konten…' : 'Muat ulang'}</Button>
        </div>
      ) : (
        <Editor draf={draf} setDraf={setDraf} token={token} busy={busy} setBusy={setBusy} setError={setError} setNotice={setNotice} muat={() => muat()} />
      )}
    </div>
  )
}

function Masuk({ onMasuk, onBatal, busy, error }: { onMasuk: (t: string) => void; onBatal: () => void; busy: boolean; error: string }) {
  const [t, setT] = useState('')
  return (
    <div>
      <PageHeader title="Masuk sebagai admin" subtitle="Admin bisa menerbitkan langsung tanpa persetujuan." back="/pengaturan" />
      <div className="space-y-4 px-5">
        <p className="text-[0.97rem] leading-relaxed">Perubahan dari admin muncul di aplikasi semua orang sekitar 2 menit setelah menekan <b>Terbitkan</b>. Anggota tim lain cukup memakai <button onClick={onBatal} className="font-semibold text-nabawi underline">Kirim usulan</button>, tanpa kunci.</p>
        <ol className="space-y-3 rounded-2xl border border-garis bg-white p-4 text-[0.95rem]">
          <li className="flex gap-3"><Nomor n={1} /><span>Pastikan kamu punya akun GitHub dan sudah <b>diundang</b> admin ke proyek ini. Cukup sekali.</span></li>
          <li className="flex gap-3"><Nomor n={2} /><span>Buat kunci akses di <a href={TOKEN_URL} target="_blank" rel="noreferrer" className="font-semibold text-nabawi underline">halaman ini</a>. Pilih repositori <b>pejuang-umrah-mandiri</b> saja, lalu di bagian izin pilih <b>Contents: Read and write</b>. Salin kunci yang muncul.</span></li>
          <li className="flex gap-3"><Nomor n={3} /><span>Tempel kuncinya di bawah. Kunci hanya disimpan di perangkat ini.</span></li>
        </ol>
        <Field label="Kunci akses GitHub">
          <input className={inputClass} value={t} onChange={(e) => setT(e.target.value.trim())} placeholder="github_pat_…" autoComplete="off" spellCheck={false} />
        </Field>
        {error && <p role="alert" className="rounded-xl border border-bata/30 bg-bata/5 px-3 py-2.5 text-sm text-bata">{error}</p>}
        <Button className="w-full" disabled={!t || busy} onClick={() => onMasuk(t)}>{busy ? 'Memeriksa kunci…' : 'Masuk'}</Button>
        <p className="text-xs text-redup">Jangan bagikan kunci ini ke orang lain. Kalau HP hilang, hapus kuncinya dari halaman pengaturan GitHub.</p>
      </div>
    </div>
  )
}

const Nomor = ({ n }: { n: number }) => <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-nabawi-muda text-sm font-bold text-nabawi">{n}</span>

type EditTarget = { jenis: 'tempat'; i: number | null } | { jenis: 'tips'; i: number | null } | null
type Jenis = 'tempat' | 'tips'

/** Daftar Destinasi/Tips dengan formulir tambah & ubah. Dipakai mode admin dan mode usulan. */
function Daftar({ konten: k, labelSimpan, onSimpan, onHapus }: {
  konten: Konten; labelSimpan: string
  onSimpan: (jenis: Jenis, i: number | null, data: TempatData & TipData) => void
  onHapus: (jenis: Jenis, i: number) => void
}) {
  const [tab, setTab] = useState<Jenis>('tempat')
  const [edit, setEdit] = useState<EditTarget>(null)
  const simpan = (jenis: Jenis, i: number | null) => (data: TempatData | TipData) => { onSimpan(jenis, i, data as TempatData & TipData); setEdit(null) }
  const hapus = (jenis: Jenis, i: number | null) => (i == null ? undefined : () => { onHapus(jenis, i); setEdit(null) })
  return (
    <>
      <Tabs value={tab} onChange={setTab} options={[{ value: 'tempat', label: `Destinasi (${k.tempat.length})` }, { value: 'tips', label: `Tips (${k.tips.length})` }]} />
      <div className="px-5">
        <Button className="w-full" onClick={() => setEdit({ jenis: tab, i: null })}>+ Tambah {tab === 'tempat' ? 'tempat' : 'tips'}</Button>
        <ul className="mt-4 divide-y divide-batu rounded-2xl border border-garis bg-white">
          {(tab === 'tempat' ? k.tempat : k.tips).map((t, i) => (
            <li key={i}>
              <button onClick={() => setEdit({ jenis: tab, i })} className="flex w-full items-start gap-3 px-4 py-3 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{('nama' in t ? t.nama : t.judul) || 'Tanpa nama'}</span>
                  <span className="block text-sm text-redup">{'nama' in t ? `${t.kategori} · ${t.kota}` : t.ringkas}</span>
                </span>
                <span className="mt-1 text-sm font-semibold text-nabawi">Ubah</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {edit?.jenis === 'tempat' && <TempatSheet awal={edit.i == null ? null : k.tempat[edit.i]} labelSimpan={labelSimpan} onClose={() => setEdit(null)} onSimpan={simpan('tempat', edit.i)} onHapus={hapus('tempat', edit.i)} />}
      {edit?.jenis === 'tips' && <TipSheet awal={edit.i == null ? null : k.tips[edit.i]} labelSimpan={labelSimpan} onClose={() => setEdit(null)} onSimpan={simpan('tips', edit.i)} onHapus={hapus('tips', edit.i)} />}
    </>
  )
}

function Editor({ draf, setDraf, token, busy, setBusy, setError, setNotice, muat }: {
  draf: Draf; setDraf: (d: Draf | null) => void; token: string; busy: boolean
  setBusy: (b: boolean) => void; setError: (s: string) => void; setNotice: (s: string) => void; muat: () => void
}) {
  const [masalah, setMasalah] = useState<string[]>([])
  const k = draf.konten
  const berubah = useMemo(() => JSON.stringify(rapikan(k)) !== JSON.stringify(rapikan(JSON.parse(draf.asli))), [k, draf.asli])
  const ubah = (konten: Konten) => { setDraf({ ...draf, konten }); setNotice('') }

  const terbitkan = async () => {
    const bersih = rapikan(k)
    const m = cekKonten(bersih)
    setMasalah(m)
    if (m.length) return
    setBusy(true); setError('')
    try {
      const teks = JSON.stringify(bersih, null, 2) + '\n'
      const j = await gh(token, { method: 'PUT', body: JSON.stringify({ message: 'konten: perbarui Destinasi & Tips (lewat Kelola konten)', content: keB64(teks), sha: draf.sha, branch: BRANCH }) })
      setDraf({ konten: bersih, asli: JSON.stringify(bersih), sha: j.content.sha })
      setNotice('Terbit! Perubahan muncul di aplikasi sekitar 2 menit lagi. Pengguna akan melihatnya saat membuka aplikasi berikutnya.')
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  const batal = () => setDraf({ ...draf, konten: JSON.parse(draf.asli) })

  return (
    <div className="pb-28">
      <Daftar konten={k} labelSimpan="Simpan"
        onSimpan={(jenis, i, data) => {
          if (jenis === 'tempat') { const tempat = [...k.tempat]; if (i == null) tempat.push(data); else tempat[i] = data; ubah({ ...k, tempat }) }
          else { const tips = [...k.tips]; if (i == null) tips.push(data); else tips[i] = data; ubah({ ...k, tips }) }
        }}
        onHapus={(jenis, i) => ubah(jenis === 'tempat' ? { ...k, tempat: k.tempat.filter((_, j) => j !== i) } : { ...k, tips: k.tips.filter((_, j) => j !== i) })} />
      <div className="px-5">
        <button onClick={muat} disabled={busy || berubah} className="mt-4 text-sm font-semibold text-redup disabled:opacity-40">Muat ulang versi terbaru</button>
        {masalah.length > 0 && (
          <div role="alert" className="mt-4 rounded-xl border border-bata/30 bg-bata/5 px-3 py-2.5 text-sm text-bata">
            <p className="font-semibold">Belum bisa diterbitkan:</p>
            <ul className="mt-1 list-disc pl-5">{masalah.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
        )}
      </div>

      {berubah && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-garis bg-white px-5 pt-3">
          <p className="mb-2 text-sm font-semibold">Ada perubahan yang belum terbit.</p>
          <div className="mb-3 grid grid-cols-[1fr_2fr] gap-2">
            <Button variant="ghost" onClick={batal} disabled={busy}>Batalkan</Button>
            <Button onClick={terbitkan} disabled={busy}>{busy ? 'Menerbitkan…' : 'Terbitkan'}</Button>
          </div>
        </div>
      )}
    </div>
  )
}

const paragraf = (s: string) => s.split(/\n\s*\n/).map((x) => x.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean)
const baris = (s: string) => s.split('\n').map((x) => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)

function Pilihan<T extends string>({ value, options, onChange }: { value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)}
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${value === o ? 'border-nabawi bg-nabawi text-white' : 'border-garis bg-white text-tinta'}`}>{o}</button>
      ))}
    </div>
  )
}

function HapusButton({ onHapus, label }: { onHapus: () => void; label: string }) {
  const [yakin, setYakin] = useState(false)
  return yakin ? (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="ghost" onClick={() => setYakin(false)}>Batal</Button>
      <Button variant="danger" onClick={onHapus}>Ya, hapus</Button>
    </div>
  ) : (
    <Button variant="danger" className="w-full" onClick={() => setYakin(true)}>{label}</Button>
  )
}

function TempatSheet({ awal, labelSimpan, onClose, onSimpan, onHapus }: { awal: TempatData | null; labelSimpan: string; onClose: () => void; onSimpan: (t: TempatData) => void; onHapus?: () => void }) {
  const [d, setD] = useState({
    nama: awal?.nama ?? '', kota: awal?.kota ?? KOTA_LIST[0], kategori: awal?.kategori ?? KATEGORI_LIST[0], ringkas: awal?.ringkas ?? '',
    isi: (awal?.isi ?? []).join('\n\n'), tips: (awal?.tips ?? []).join('\n'), maps: awal?.maps ?? '',
  })
  const set = (p: Partial<typeof d>) => setD({ ...d, ...p })
  const siap = d.nama.trim() && d.ringkas.trim() && d.isi.trim()
  return (
    <Sheet title={awal ? 'Ubah tempat' : 'Tambah tempat'} onClose={onClose}>
      <div className="space-y-4 pb-5">
        <Field label="Nama tempat"><input className={inputClass} value={d.nama} onChange={(e) => set({ nama: e.target.value })} placeholder="Contoh: Masjid Quba" /></Field>
        <Field label="Kota"><Pilihan value={d.kota} options={KOTA_LIST} onChange={(kota) => set({ kota })} /></Field>
        <Field label="Jenis"><Pilihan value={d.kategori} options={KATEGORI_LIST} onChange={(kategori) => set({ kategori })} /></Field>
        <Field label="Ringkasan" hint="Satu kalimat pendek. Muncul di daftar."><input className={inputClass} value={d.ringkas} onChange={(e) => set({ ringkas: e.target.value })} placeholder="Contoh: Masjid pertama yang dibangun Rasulullah." /></Field>
        <Field label="Penjelasan" hint="Ceritakan tempatnya. Tekan Enter dua kali untuk paragraf baru."><textarea rows={6} className={inputClass} value={d.isi} onChange={(e) => set({ isi: e.target.value })} /></Field>
        <Field label="Tips (boleh kosong)" hint="Satu tips per baris."><textarea rows={4} className={inputClass} value={d.tips} onChange={(e) => set({ tips: e.target.value })} placeholder={'Contoh: Datang setelah Subuh\nBawa air minum'} /></Field>
        <Field label="Link Google Maps (boleh kosong)" hint="Kalau kosong, tombol Maps mencari otomatis dari nama tempat."><input className={inputClass} inputMode="url" value={d.maps} onChange={(e) => set({ maps: e.target.value })} placeholder="https://maps.app.goo.gl/…" /></Field>
        <Button className="w-full" disabled={!siap} onClick={() => onSimpan({ nama: d.nama.trim(), kota: d.kota, kategori: d.kategori, ringkas: d.ringkas.trim(), isi: paragraf(d.isi), tips: baris(d.tips), maps: d.maps.trim() })}>{labelSimpan}</Button>
        {!siap && <p className="-mt-2 text-xs text-redup">Isi nama, ringkasan, dan penjelasan dulu.</p>}
        {onHapus && <HapusButton onHapus={onHapus} label={labelSimpan === 'Simpan' ? 'Hapus tempat ini' : 'Usulkan hapus tempat ini'} />}
        {labelSimpan === 'Simpan' && <p className="text-xs text-redup">Belum langsung tayang. Tekan Terbitkan di bawah daftar setelah selesai.</p>}
      </div>
    </Sheet>
  )
}

function TipSheet({ awal, labelSimpan, onClose, onSimpan, onHapus }: { awal: TipData | null; labelSimpan: string; onClose: () => void; onSimpan: (t: TipData) => void; onHapus?: () => void }) {
  const [d, setD] = useState({ judul: awal?.judul ?? '', ringkas: awal?.ringkas ?? '', isi: (awal?.isi ?? []).join('\n\n'), poin: (awal?.poin ?? []).join('\n') })
  const set = (p: Partial<typeof d>) => setD({ ...d, ...p })
  const siap = d.judul.trim() && d.ringkas.trim() && (d.isi.trim() || d.poin.trim())
  return (
    <Sheet title={awal ? 'Ubah tips' : 'Tambah tips'} onClose={onClose}>
      <div className="space-y-4 pb-5">
        <Field label="Judul"><input className={inputClass} value={d.judul} onChange={(e) => set({ judul: e.target.value })} placeholder="Contoh: Masuk Raudhah lewat Nusuk" /></Field>
        <Field label="Ringkasan" hint="Satu kalimat pendek. Muncul di daftar."><input className={inputClass} value={d.ringkas} onChange={(e) => set({ ringkas: e.target.value })} /></Field>
        <Field label="Penjelasan" hint="Tekan Enter dua kali untuk paragraf baru."><textarea rows={5} className={inputClass} value={d.isi} onChange={(e) => set({ isi: e.target.value })} /></Field>
        <Field label="Poin-poin" hint="Satu poin per baris."><textarea rows={5} className={inputClass} value={d.poin} onChange={(e) => set({ poin: e.target.value })} /></Field>
        <Button className="w-full" disabled={!siap} onClick={() => onSimpan({ judul: d.judul.trim(), ringkas: d.ringkas.trim(), isi: paragraf(d.isi), poin: baris(d.poin) })}>{labelSimpan}</Button>
        {!siap && <p className="-mt-2 text-xs text-redup">Isi judul, ringkasan, dan penjelasan atau poin dulu.</p>}
        {onHapus && <HapusButton onHapus={onHapus} label={labelSimpan === 'Simpan' ? 'Hapus tips ini' : 'Usulkan hapus tips ini'} />}
        {labelSimpan === 'Simpan' && <p className="text-xs text-redup">Belum langsung tayang. Tekan Terbitkan di bawah daftar setelah selesai.</p>}
      </div>
    </Sheet>
  )
}

// ── Mode usulan: tanpa kunci. Tiap perubahan dikirim sebagai issue GitHub yang sudah terisi. ──
const ISSUE_URL = `https://github.com/${REPO}/issues/new`
const AKSI_LABEL = { tambah: 'Tambah', ubah: 'Ubah', hapus: 'Hapus' } as const

function isiIssue(u: Usulan, dari: string) {
  const nama = u.data ? ('nama' in u.data ? u.data.nama : u.data.judul) : u.sasaran ?? ''
  const jenis = u.jenis === 'tempat' ? 'tempat' : 'tips'
  const judul = `Usulan konten: ${AKSI_LABEL[u.aksi].toLowerCase()} ${jenis} "${nama}"`
  const L: string[] = [PENANDA_USULAN, `### ${AKSI_LABEL[u.aksi]} ${jenis}: ${nama}`]
  if (dari.trim()) L.push(`Dari: ${dari.trim()}`)
  if (u.aksi === 'ubah' && u.sasaran && u.sasaran !== nama) L.push(`Mengganti: ${u.sasaran}`)
  if (u.data && u.jenis === 'tempat') {
    const t = u.data
    L.push('', `**Kota:** ${t.kota} · **Jenis:** ${t.kategori}`, `**Ringkasan:** ${t.ringkas}`, '', '**Penjelasan**', ...t.isi.flatMap((p) => [p, '']))
    if (t.tips.length) L.push('**Tips**', ...t.tips.map((x) => `- ${x}`), '')
    if (t.maps) L.push(`**Maps:** ${t.maps}`, '')
  }
  if (u.data && u.jenis === 'tips') {
    const t = u.data
    L.push('', `**Ringkasan:** ${t.ringkas}`, '')
    if (t.isi.length) L.push('**Penjelasan**', ...t.isi.flatMap((p) => [p, '']))
    if (t.poin.length) L.push('**Poin**', ...t.poin.map((x) => `- ${x}`), '')
  }
  if (u.aksi === 'hapus') L.push('', 'Minta dihapus dari aplikasi.', '')
  L.push('---', 'Pemilik repo: beri label **disetujui** untuk menerbitkan usulan ini.', '', '<details><summary>Data untuk sistem (jangan diubah)</summary>', '', '```json', JSON.stringify(u), '```', '', '</details>')
  return { judul, body: L.join('\n') }
}

function ModeUsulan({ onAdmin }: { onAdmin: () => void }) {
  const konten = kontenTayang as Konten
  const [kirim, setKirim] = useState<Usulan | null>(null)
  return (
    <div>
      <PageHeader title="Kelola konten" subtitle="Usulkan tempat dan tips untuk tab Panduan." back="/pengaturan" />
      <div className="mx-5 mb-4 rounded-2xl border border-nabawi/20 bg-nabawi-muda p-4 text-sm leading-relaxed">
        Tambah atau ubah konten di bawah, lalu kirim sebagai usulan. Tim admin memeriksanya dulu sebelum tayang di aplikasi. Kamu cukup punya akun GitHub.
      </div>
      <Daftar konten={konten} labelSimpan="Lanjut kirim usulan"
        onSimpan={(jenis, i, data) => setKirim({ aksi: i == null ? 'tambah' : 'ubah', jenis, sasaran: i == null ? null : jenis === 'tempat' ? konten.tempat[i].nama : konten.tips[i].judul, data } as Usulan)}
        onHapus={(jenis, i) => setKirim({ aksi: 'hapus', jenis, sasaran: jenis === 'tempat' ? konten.tempat[i].nama : konten.tips[i].judul, data: null } as Usulan)} />
      <div className="px-5 pt-6 pb-10">
        <button onClick={onAdmin} className="text-sm font-semibold text-redup underline">Admin? Masuk dengan kunci akses</button>
      </div>
      {kirim && <KirimSheet usulan={kirim} onClose={() => setKirim(null)} />}
    </div>
  )
}

function KirimSheet({ usulan, onClose }: { usulan: Usulan; onClose: () => void }) {
  const [dari, setDari] = useState(() => store.get(K_NAMA) ?? '')
  const [terkirim, setTerkirim] = useState<'' | 'url' | 'salin'>('')
  const { judul, body } = isiIssue(usulan, dari)
  const buka = async () => {
    store.set(K_NAMA, dari)
    const url = `${ISSUE_URL}?title=${encodeURIComponent(judul)}&body=${encodeURIComponent(body)}`
    if (url.length <= 7500) { window.open(url, '_blank', 'noopener'); setTerkirim('url'); return }
    // teks terlalu panjang untuk link: salin ke clipboard, lalu buka issue kosong
    try { await navigator.clipboard.writeText(body) } catch { /* tetap lanjut */ }
    window.open(`${ISSUE_URL}?title=${encodeURIComponent(judul)}&body=${encodeURIComponent('(Tempel di sini teks usulan yang sudah disalin oleh aplikasi.)')}`, '_blank', 'noopener')
    setTerkirim('salin')
  }
  return (
    <Sheet title="Kirim usulan" onClose={onClose}>
      <div className="space-y-4 pb-6">
        <p className="rounded-xl bg-batu px-3 py-2.5 font-semibold">{judul.replace('Usulan konten: ', '')}</p>
        <Field label="Namamu (boleh kosong)" hint="Supaya tim tahu siapa yang mengusulkan."><input className={inputClass} value={dari} onChange={(e) => setDari(e.target.value)} placeholder="Contoh: Rina" /></Field>
        <ol className="space-y-3 text-[0.95rem]">
          <li className="flex gap-3"><Nomor n={1} /><span>Ketuk tombol di bawah. GitHub terbuka dengan usulan yang <b>sudah terisi</b>.</span></li>
          <li className="flex gap-3"><Nomor n={2} /><span>Masuk atau daftar akun GitHub kalau diminta (gratis).</span></li>
          <li className="flex gap-3"><Nomor n={3} /><span>Tekan <b>Create</b> atau <b>Submit new issue</b>. Selesai!</span></li>
        </ol>
        <Button className="w-full" onClick={buka}>Buka GitHub dan kirim</Button>
        {terkirim === 'salin' && <p className="rounded-xl border border-emas/40 bg-emas-muda px-3 py-2.5 text-sm">Usulanmu panjang, jadi teksnya sudah <b>disalin</b>. Di GitHub, hapus teks yang ada di kolom isi, lalu tempel.</p>}
        {terkirim && <p className="text-sm text-redup">Sesudah dikirim, sistem memeriksa usulanmu dan memberi komentar di GitHub. Kamu dapat notifikasi saat usulan disetujui dan tayang.</p>}
      </div>
    </Sheet>
  )
}
