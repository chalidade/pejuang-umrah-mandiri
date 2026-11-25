// Halaman Kelola konten: tim mengisi Ibadah, Destinasi, dan Tips lewat formulir.
// - Anggota tim (tanpa kunci): tiap perubahan dikirim sebagai usulan (issue GitHub yang sudah terisi).
// - Admin (dengan kunci akses GitHub): ubah langsung, unggah foto, lalu Terbitkan. GitHub Pages membangun ulang (± 2 menit).
// Tanpa server: kunci admin disimpan di browser perangkat itu saja.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button, Field, PageHeader, Tabs, inputClass } from '../components/ui'
import Sheet from '../components/Sheet'
import { Thumb } from '../components/Media'
import {
  cekKonten, infoMedia, namaItem, namaToko, rapikan, slug, KATEGORI_LIST, KOTA_LIST, LABEL_JENIS, PENANDA_USULAN, PESAN_MEDIA, PESAN_PRODUK,
  type Doa, type IbadahData, type Jenis, type Konten, type Media, type Produk, type TempatData, type TipData, type Usulan,
} from '../lib/konten'
import { DEFAULT_CHECKLIST } from '../data/checklist'
import kontenTayang from '../data/konten.json'
import { tandaiTim } from '../lib/tim'

const REPO = 'chalidade/pejuang-umrah-mandiri'
const BRANCH = 'main'
const PATH = 'src/data/konten.json'
const API_ROOT = `https://api.github.com/repos/${REPO}/contents`
const K_TOKEN = 'pum-kelola-kunci'
const K_DRAF = 'pum-kelola-draf-v2'
const K_NAMA = 'pum-kelola-nama'
const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new'

const store = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* mode privat */ } },
  del: (k: string) => { try { localStorage.removeItem(k) } catch { /* mode privat */ } },
}

// base64 <-> teks UTF-8
const keB64 = (s: string) => { const b = new TextEncoder().encode(s); let bin = ''; b.forEach((x) => (bin += String.fromCharCode(x))); return btoa(bin) }
const dariB64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, '')), (c) => c.charCodeAt(0)))

async function gh(token: string, path: string, init?: RequestInit) {
  const url = `${API_ROOT}/${path}`
  const res = await fetch(init ? url : `${url}?ref=${BRANCH}&t=${Date.now()}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', ...(init?.headers ?? {}) },
  })
  if (res.ok) return res.json()
  if (res.status === 401) throw new Error('Kunci akses tidak berlaku atau sudah kedaluwarsa. Buat kunci baru, lalu masuk lagi.')
  if (res.status === 403 || res.status === 404) throw new Error('Akun GitHub-mu belum punya izin menulis ke aplikasi ini. Minta admin mengundangmu, dan pastikan kuncinya punya izin Contents: Read and write.')
  if (res.status === 409) throw new Error('Ada anggota tim lain yang baru saja menerbitkan perubahan. Ketuk "Muat ulang" untuk mengambil versi terbaru (perubahanmu yang belum terbit akan hilang).')
  if (res.status === 422) throw new Error('GitHub menolak file ini. Kalau foto, coba foto lain yang lebih kecil.')
  throw new Error(`GitHub menolak permintaan (kode ${res.status}). Coba lagi sebentar lagi.`)
}

/** Kecilkan foto di perangkat (maks 1600 px, JPEG), lalu simpan ke public/media lewat GitHub. */
async function unggahFoto(token: string, file: File, nama: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Pilih file foto (JPG, PNG, atau WEBP).')
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  const blob: Blob = await new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('Foto gagal diproses.'))), 'image/jpeg', 0.84))
  const b64: string = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.readAsDataURL(blob) })
  const nf = `${slug(nama) || 'foto'}-${Date.now().toString(36)}.jpg`
  await gh(token, `public/media/${nf}`, { method: 'PUT', body: JSON.stringify({ message: `media: ${nf} (lewat Kelola konten)`, content: b64, branch: BRANCH }) })
  return `/media/${nf}`
}

type Draf = { konten: Konten; asli: string; sha: string }
const beda = (d: Draf) => JSON.stringify(rapikan(d.konten)) !== JSON.stringify(rapikan(JSON.parse(d.asli)))

export default function Kelola() {
  useEffect(() => tandaiTim(), [])
  const [token, setToken] = useState(() => store.get(K_TOKEN) ?? '')
  const [draf, setDraf] = useState<Draf | null>(() => { try { return JSON.parse(store.get(K_DRAF) ?? 'null') } catch { return null } })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [adminMasuk, setAdminMasuk] = useState(false)

  useEffect(() => { if (draf) store.set(K_DRAF, JSON.stringify(draf)); else store.del(K_DRAF) }, [draf])

  const muat = async (t = token) => {
    setBusy(true); setError(''); setNotice('')
    try {
      const j = await gh(t, PATH)
      const teks = dariB64(j.content)
      setDraf({ konten: JSON.parse(teks), asli: JSON.stringify(JSON.parse(teks)), sha: j.sha })
      return true
    } catch (e) { setError((e as Error).message); return false } finally { setBusy(false) }
  }

  // ambil konten terbaru saat halaman dibuka, kecuali ada perubahan yang belum terbit
  useEffect(() => { if (token && !(draf && beda(draf))) muat() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!token && adminMasuk)
    return <Masuk onMasuk={async (t) => { if (await muat(t)) { store.set(K_TOKEN, t); setToken(t) } }} onBatal={() => { setAdminMasuk(false); setError('') }} busy={busy} error={error} />
  if (!token) return <ModeUsulan onAdmin={() => setAdminMasuk(true)} />

  const keluar = () => { store.del(K_TOKEN); store.del(K_DRAF); setToken(''); setDraf(null); setError(''); setNotice('') }

  return (
    <div>
      <PageHeader title="Kelola konten" subtitle="Mode admin: perubahan langsung terbit." back="/pengaturan"
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
      <PageHeader title="Masuk sebagai admin" subtitle="Admin bisa menerbitkan langsung dan mengunggah foto." back="/pengaturan" />
      <div className="space-y-4 px-5">
        <p className="text-[0.97rem] leading-relaxed">Perubahan dari admin muncul di aplikasi semua orang sekitar 2 menit setelah menekan <b>Terbitkan</b>. Anggota tim lain cukup memakai <button onClick={onBatal} className="font-semibold text-nabawi underline">Kirim usulan</button>, tanpa kunci.</p>
        <ol className="space-y-3 rounded-2xl border border-garis bg-white p-4 text-[0.95rem]">
          <li className="flex gap-3"><Nomor n={1} /><span>Pastikan kamu punya akun GitHub dan sudah <b>diundang</b> pemilik repo. Cukup sekali.</span></li>
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

// ── Daftar + formulir, dipakai mode admin dan mode usulan ─────────────────
type DataJenis = { ibadah: IbadahData; tempat: TempatData; tips: TipData; perlengkapan: Produk }
type Item = IbadahData | TempatData | TipData | Produk
const mediaDari = (t: Item) => ('media' in t ? t.media : [])
type EditTarget = { jenis: Jenis; i: number | null } | null
type Unggah = ((file: File, nama: string) => Promise<string>) | undefined

function Daftar({ konten: k, labelSimpan, unggah, onSimpan, onHapus, onKategori }: {
  konten: Konten; labelSimpan: string; unggah?: Unggah
  onSimpan: <J extends Jenis>(jenis: J, i: number | null, data: DataJenis[J]) => void
  onHapus: (jenis: Jenis, i: number) => void
  onKategori?: () => void
}) {
  const [tab, setTab] = useState<Jenis>('ibadah')
  const [edit, setEdit] = useState<EditTarget>(null)
  const items = (k[tab] ?? []) as Item[]
  const sub = (t: Item) => ('url' in t ? [namaToko(t.url) ?? 'Link belum benar', t.harga, t.checklist && `checklist: ${t.checklist}`].filter(Boolean).join(' · ')
    : 'kota' in t ? `${t.kategori} · ${t.kota}` : 'doa' in t ? t.kategori : t.ringkas)
  const nProduk = (t: Item) => ('produk' in t && t.produk?.length ? ` · ${t.produk.length} produk` : '')
  const tambahLabel = { ibadah: 'materi', tempat: 'tempat', tips: 'tips', perlengkapan: 'produk' }[tab]
  const hapus = edit && edit.i != null ? () => { onHapus(edit.jenis, edit.i!); setEdit(null) } : undefined
  return (
    <>
      <Tabs value={tab} onChange={setTab} options={[
        { value: 'ibadah', label: `Ibadah (${k.ibadah.length})` },
        { value: 'tempat', label: `Destinasi (${k.tempat.length})` },
        { value: 'tips', label: `Tips (${k.tips.length})` },
        { value: 'perlengkapan', label: `Produk (${(k.perlengkapan ?? []).length})` },
      ]} />
      {tab === 'perlengkapan' && (
        <p className="mx-5 mb-3 text-sm text-redup">Produk perlengkapan tampil di bagian Belanja perlengkapan pada checklist Persiapan. Tautkan ke barang checklist supaya muncul tombol Beli di sebelahnya.</p>
      )}
      <div className="px-5">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setEdit({ jenis: tab, i: null })}>+ Tambah {tambahLabel}</Button>
          {tab === 'ibadah' && onKategori && <Button variant="ghost" onClick={onKategori}>Kategori</Button>}
        </div>
        <ul className="mt-4 divide-y divide-batu rounded-2xl border border-garis bg-white">
          {items.map((t, i) => (
            <li key={i}>
              <button onClick={() => setEdit({ jenis: tab, i })} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{namaItem(t) || 'Tanpa judul'}</span>
                  <span className="block text-sm text-redup">{sub(t)}{mediaDari(t).length ? ` · ${mediaDari(t).length} media` : ''}{nProduk(t)}</span>
                </span>
                {mediaDari(t)[0] && <Thumb media={mediaDari(t)[0]} className="h-12 w-12" time={false} />}
                <span className="text-sm font-semibold text-nabawi">Ubah</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {edit?.jenis === 'ibadah' && (
        <IbadahSheet awal={edit.i == null ? null : k.ibadah[edit.i]} kategori={k.kategoriIbadah} labelSimpan={labelSimpan} unggah={unggah}
          onClose={() => setEdit(null)} onSimpan={(d) => { onSimpan('ibadah', edit.i, d); setEdit(null) }} onHapus={hapus} />
      )}
      {edit?.jenis === 'tempat' && (
        <TempatSheet awal={edit.i == null ? null : k.tempat[edit.i]} labelSimpan={labelSimpan} unggah={unggah}
          onClose={() => setEdit(null)} onSimpan={(d) => { onSimpan('tempat', edit.i, d); setEdit(null) }} onHapus={hapus} />
      )}
      {edit?.jenis === 'tips' && (
        <TipSheet awal={edit.i == null ? null : k.tips[edit.i]} labelSimpan={labelSimpan} unggah={unggah}
          onClose={() => setEdit(null)} onSimpan={(d) => { onSimpan('tips', edit.i, d); setEdit(null) }} onHapus={hapus} />
      )}
      {edit?.jenis === 'perlengkapan' && (
        <PerlengkapanSheet awal={edit.i == null ? null : (k.perlengkapan ?? [])[edit.i]} labelSimpan={labelSimpan}
          onClose={() => setEdit(null)} onSimpan={(d) => { onSimpan('perlengkapan', edit.i, d); setEdit(null) }} onHapus={hapus} />
      )}
    </>
  )
}

function Editor({ draf, setDraf, token, busy, setBusy, setError, setNotice, muat }: {
  draf: Draf; setDraf: (d: Draf | null) => void; token: string; busy: boolean
  setBusy: (b: boolean) => void; setError: (s: string) => void; setNotice: (s: string) => void; muat: () => void
}) {
  const [masalah, setMasalah] = useState<string[]>([])
  const [kategoriBuka, setKategoriBuka] = useState(false)
  const k = draf.konten
  const berubah = useMemo(() => beda(draf), [draf])
  const ubah = (konten: Konten) => { setDraf({ ...draf, konten }); setNotice('') }

  const terbitkan = async () => {
    const bersih = rapikan(k)
    const m = cekKonten(bersih)
    setMasalah(m)
    if (m.length) return
    setBusy(true); setError('')
    try {
      const teks = JSON.stringify(bersih, null, 2) + '\n'
      const j = await gh(token, PATH, { method: 'PUT', body: JSON.stringify({ message: 'konten: perbarui Panduan (lewat Kelola konten)', content: keB64(teks), sha: draf.sha, branch: BRANCH }) })
      setDraf({ konten: bersih, asli: JSON.stringify(bersih), sha: j.content.sha })
      setNotice('Terbit! Perubahan muncul di aplikasi sekitar 2 menit lagi. Pengguna akan melihatnya saat membuka aplikasi berikutnya.')
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="pb-28">
      <Daftar konten={k} labelSimpan="Simpan" unggah={(file, nama) => unggahFoto(token, file, nama)} onKategori={() => setKategoriBuka(true)}
        onSimpan={(jenis, i, data) => {
          const xs = [...(k[jenis] ?? [])] as unknown[]
          if (i == null) xs.push(data); else xs[i] = data
          let baru = { ...k, [jenis]: xs } as Konten
          if (jenis === 'ibadah' && !baru.kategoriIbadah.includes((data as IbadahData).kategori)) baru = { ...baru, kategoriIbadah: [...baru.kategoriIbadah, (data as IbadahData).kategori] }
          ubah(baru)
        }}
        onHapus={(jenis, i) => ubah({ ...k, [jenis]: ((k[jenis] ?? []) as unknown[]).filter((_, j) => j !== i) } as Konten)} />
      <div className="px-5">
        <button onClick={muat} disabled={busy || berubah} className="mt-4 text-sm font-semibold text-redup disabled:opacity-40">Muat ulang versi terbaru</button>
        {masalah.length > 0 && (
          <div role="alert" className="mt-4 rounded-xl border border-bata/30 bg-bata/5 px-3 py-2.5 text-sm text-bata">
            <p className="font-semibold">Belum bisa diterbitkan:</p>
            <ul className="mt-1 list-disc pl-5">{masalah.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
        )}
      </div>
      {kategoriBuka && <KategoriSheet konten={k} onClose={() => setKategoriBuka(false)} onUbah={ubah} />}
      {berubah && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-garis bg-white px-5 pt-3">
          <p className="mb-2 text-sm font-semibold">Ada perubahan yang belum terbit.</p>
          <div className="mb-3 grid grid-cols-[1fr_2fr] gap-2">
            <Button variant="ghost" onClick={() => setDraf({ ...draf, konten: JSON.parse(draf.asli) })} disabled={busy}>Batalkan</Button>
            <Button onClick={terbitkan} disabled={busy}>{busy ? 'Menerbitkan…' : 'Terbitkan'}</Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Kelola urutan dan nama kategori ibadah (khusus admin). */
function KategoriSheet({ konten: k, onClose, onUbah }: { konten: Konten; onClose: () => void; onUbah: (k: Konten) => void }) {
  const [baru, setBaru] = useState('')
  const pakai = (nama: string) => k.ibadah.filter((x) => x.kategori === nama).length
  const ganti = (i: number, nama: string) => {
    const lama = k.kategoriIbadah[i]
    onUbah({ ...k, kategoriIbadah: k.kategoriIbadah.map((x, j) => (j === i ? nama : x)), ibadah: k.ibadah.map((x) => (x.kategori === lama ? { ...x, kategori: nama } : x)) })
  }
  const geser = (i: number, d: number) => {
    const xs = [...k.kategoriIbadah]; const j = i + d
    if (j < 0 || j >= xs.length) return
    ;[xs[i], xs[j]] = [xs[j], xs[i]]; onUbah({ ...k, kategoriIbadah: xs })
  }
  return (
    <Sheet title="Kategori ibadah" onClose={onClose}>
      <div className="space-y-3 pb-6">
        <p className="text-sm text-redup">Urutan di sini menjadi urutan di tab Ibadah.</p>
        {k.kategoriIbadah.map((nama, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={inputClass} value={nama} onChange={(e) => ganti(i, e.target.value)} aria-label={`Nama kategori ${i + 1}`} />
            <button onClick={() => geser(i, -1)} disabled={i === 0} className="rounded-lg border border-garis px-2.5 py-2 disabled:opacity-30" aria-label="Naikkan">↑</button>
            <button onClick={() => geser(i, 1)} disabled={i === k.kategoriIbadah.length - 1} className="rounded-lg border border-garis px-2.5 py-2 disabled:opacity-30" aria-label="Turunkan">↓</button>
            <button onClick={() => onUbah({ ...k, kategoriIbadah: k.kategoriIbadah.filter((_, j) => j !== i) })} disabled={pakai(nama) > 0}
              title={pakai(nama) > 0 ? 'Masih dipakai materi' : 'Hapus'} className="rounded-lg border border-bata/30 px-2.5 py-2 text-bata disabled:opacity-30" aria-label="Hapus kategori">×</button>
          </div>
        ))}
        <p className="text-xs text-redup">Kategori yang masih dipakai materi tidak bisa dihapus.</p>
        <div className="flex gap-2">
          <input className={inputClass} value={baru} onChange={(e) => setBaru(e.target.value)} placeholder="Kategori baru, misal: Doa-doa" />
          <Button disabled={!baru.trim() || k.kategoriIbadah.includes(baru.trim())} onClick={() => { onUbah({ ...k, kategoriIbadah: [...k.kategoriIbadah, baru.trim()] }); setBaru('') }}>Tambah</Button>
        </div>
      </div>
    </Sheet>
  )
}

// ── Formulir ──────────────────────────────────────────────────────────────
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
      <Button variant="danger" onClick={onHapus}>Ya, lanjut</Button>
    </div>
  ) : (
    <Button variant="danger" className="w-full" onClick={() => setYakin(true)}>{label}</Button>
  )
}

const NAMA_MEDIA = { foto: 'Foto', youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram' } as const

/** Daftar foto/video. Item pertama jadi media utama. */
function MediaEditor({ value, onChange, unggah, nama }: { value: Media[]; onChange: (m: Media[]) => void; unggah?: Unggah; nama: string }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const set = (i: number, p: Partial<Media>) => onChange(value.map((m, j) => (j === i ? { ...m, ...p } : m)))
  const utamakan = (i: number) => onChange([value[i], ...value.filter((_, j) => j !== i)])
  const pilih = async (f: File | undefined) => {
    if (!f || !unggah) return
    setBusy(true); setErr('')
    try { const url = await unggah(f, nama || 'foto'); onChange([...value, { url }]) } catch (e) { setErr((e as Error).message) } finally { setBusy(false); if (file.current) file.current.value = '' }
  }
  return (
    <div className="space-y-3">
      {value.map((m, i) => {
        const info = m.url.trim() ? infoMedia(m) : null
        return (
          <div key={i} className="rounded-xl border border-garis p-3">
            <div className="flex items-start gap-3">
              {info ? <Thumb media={m} className="h-14 w-20" time={false} /> : <span className="grid h-14 w-20 shrink-0 place-items-center rounded-xl bg-batu text-xs text-redup">{i + 1}</span>}
              <div className="min-w-0 flex-1 space-y-2">
                <input className={inputClass} inputMode="url" value={m.url} onChange={(e) => set(i, { url: e.target.value })} placeholder="Tempel link YouTube, TikTok, Instagram, atau foto" aria-label={`Link media ${i + 1}`} />
                {m.url.trim() && !info && <p className="text-xs text-bata">{PESAN_MEDIA}</p>}
                {info && <p className="text-xs font-semibold text-nabawi">✓ {NAMA_MEDIA[info.jenis]}{m.url.startsWith('/media/') ? ' (unggahan, tampil setelah terbit)' : ''}</p>}
                {info?.jenis === 'youtube' && (
                  <input className={inputClass} value={m.mulai ?? ''} onChange={(e) => set(i, { mulai: e.target.value })} placeholder="Mulai dari menit, misal 01:06 (boleh kosong)" aria-label="Menit mulai" />
                )}
                <input className={inputClass} value={m.keterangan ?? ''} onChange={(e) => set(i, { keterangan: e.target.value })} placeholder="Keterangan singkat (boleh kosong)" aria-label="Keterangan" />
              </div>
            </div>
            <div className="mt-2 flex gap-4 text-sm font-semibold">
              {i > 0 && <button type="button" onClick={() => utamakan(i)} className="text-nabawi">Jadikan utama</button>}
              {i === 0 && value.length > 1 && <span className="text-redup">Media utama</span>}
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="ml-auto text-bata">Hapus</button>
            </div>
          </div>
        )
      })}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={() => onChange([...value, { url: '' }])}>+ Link video/foto</Button>
        {unggah && (
          <>
            <Button type="button" variant="ghost" className="flex-1" disabled={busy} onClick={() => file.current?.click()}>{busy ? 'Mengunggah…' : 'Unggah foto'}</Button>
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => pilih(e.target.files?.[0])} />
          </>
        )}
      </div>
      {err && <p role="alert" className="text-sm text-bata">{err}</p>}
    </div>
  )
}

function DoaEditor({ value, onChange }: { value: Doa[]; onChange: (d: Doa[]) => void }) {
  const set = (i: number, p: Partial<Doa>) => onChange(value.map((d, j) => (j === i ? { ...d, ...p } : d)))
  return (
    <div className="space-y-3">
      {value.map((d, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-garis p-3">
          <textarea rows={2} dir="rtl" lang="ar" className={`${inputClass} arab text-right text-xl`} value={d.arab} onChange={(e) => set(i, { arab: e.target.value })} placeholder="Teks Arab" aria-label="Teks Arab" />
          <input className={inputClass} value={d.latin} onChange={(e) => set(i, { latin: e.target.value })} placeholder="Bacaan latin" aria-label="Bacaan latin" />
          <textarea rows={2} className={inputClass} value={d.arti} onChange={(e) => set(i, { arti: e.target.value })} placeholder="Arti" aria-label="Arti" />
          <input className={inputClass} value={d.sumber} onChange={(e) => set(i, { sumber: e.target.value })} placeholder="Sumber, misal HR. Bukhari (boleh kosong)" aria-label="Sumber" />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-sm font-semibold text-bata">Hapus doa ini</button>
        </div>
      ))}
      <Button type="button" variant="ghost" className="w-full" onClick={() => onChange([...value, { arab: '', latin: '', arti: '', sumber: '' }])}>+ Tambah doa</Button>
    </div>
  )
}

const produkOk = (xs: Produk[]) => xs.every((p) => (!p.nama.trim() && !p.url.trim()) || (p.nama.trim() && namaToko(p.url)))

/** Daftar produk rekomendasi (link afiliasi) di satu materi. */
function ProdukEditor({ value, onChange }: { value: Produk[]; onChange: (p: Produk[]) => void }) {
  const set = (i: number, p: Partial<Produk>) => onChange(value.map((x, j) => (j === i ? { ...x, ...p } : x)))
  return (
    <div className="space-y-3">
      {value.map((p, i) => <ProdukIsian key={i} p={p} set={(x) => set(i, x)} onHapus={() => onChange(value.filter((_, j) => j !== i))} />)}
      <Button type="button" variant="ghost" className="w-full" onClick={() => onChange([...value, { nama: '', url: '' }])}>+ Tambah produk</Button>
    </div>
  )
}

function ProdukIsian({ p, set, onHapus }: { p: Produk; set: (x: Partial<Produk>) => void; onHapus?: () => void }) {
  const toko = p.url.trim() ? namaToko(p.url) : null
  return (
    <div className="space-y-2 rounded-xl border border-garis p-3">
      <input className={inputClass} value={p.nama} onChange={(e) => set({ nama: e.target.value })} placeholder="Nama produk, misal: Kain ihram handuk 2 helai" aria-label="Nama produk" />
      <input className={inputClass} inputMode="url" value={p.url} onChange={(e) => set({ url: e.target.value })} placeholder="Link afiliasi, misal https://s.shopee.co.id/…" aria-label="Link afiliasi" />
      {p.url.trim() && !toko && <p className="text-xs text-bata">{PESAN_PRODUK}</p>}
      {toko && <p className="text-xs font-semibold text-nabawi">✓ {toko}</p>}
      <input className={inputClass} value={p.harga ?? ''} onChange={(e) => set({ harga: e.target.value })} placeholder="Kisaran harga, misal Rp85 rb (boleh kosong)" aria-label="Harga" />
      <input className={inputClass} value={p.catatan ?? ''} onChange={(e) => set({ catatan: e.target.value })} placeholder="Kenapa direkomendasikan (boleh kosong)" aria-label="Catatan" />
      {onHapus && <button type="button" onClick={onHapus} className="text-sm font-semibold text-bata">Hapus produk ini</button>}
    </div>
  )
}

const BARANG_CHECKLIST = Object.values(DEFAULT_CHECKLIST).flat()

function PerlengkapanSheet({ awal, labelSimpan, onClose, onSimpan, onHapus }: { awal: Produk | null; labelSimpan: string; onClose: () => void; onSimpan: (p: Produk) => void; onHapus?: () => void }) {
  const [d, setD] = useState<Produk>({ nama: awal?.nama ?? '', url: awal?.url ?? '', harga: awal?.harga ?? '', catatan: awal?.catatan ?? '', checklist: awal?.checklist ?? '' })
  const set = (p: Partial<Produk>) => setD({ ...d, ...p })
  const siap = !!(d.nama.trim() && namaToko(d.url))
  return (
    <SheetForm judul={awal ? 'Ubah produk' : 'Tambah produk'} labelSimpan={labelSimpan} siap={siap} labelHapus="produk ini" onClose={onClose} onHapus={onHapus}
      kurang="Isi nama produk dan link yang diawali https://."
      onSimpan={() => onSimpan({ nama: d.nama.trim(), url: d.url.trim(), harga: d.harga?.trim(), catatan: d.catatan?.trim(), checklist: d.checklist?.trim() })}>
      <ProdukIsian p={d} set={set} />
      <Field label="Tombol Beli di checklist (boleh kosong)" hint="Pilih barang checklist yang mendapat tombol Beli ke produk ini.">
        <select className={inputClass} value={d.checklist ?? ''} onChange={(e) => set({ checklist: e.target.value })}>
          <option value="">Tidak ditautkan</option>
          {Object.entries(DEFAULT_CHECKLIST).map(([g, xs]) => (
            <optgroup key={g} label={g}>{xs.map((x) => <option key={x} value={x}>{x}</option>)}</optgroup>
          ))}
          {d.checklist && !BARANG_CHECKLIST.includes(d.checklist) && <option value={d.checklist}>{d.checklist}</option>}
        </select>
      </Field>
    </SheetForm>
  )
}

function SheetForm({ judul, labelSimpan, siap, kurang, onSimpan, onHapus, labelHapus, onClose, children }: {
  judul: string; labelSimpan: string; siap: boolean; kurang: string; onSimpan: () => void; onHapus?: () => void; labelHapus: string; onClose: () => void; children: ReactNode
}) {
  const usulan = labelSimpan !== 'Simpan'
  return (
    <Sheet title={judul} onClose={onClose}>
      <div className="space-y-4 pb-5">
        {children}
        <Button className="w-full" disabled={!siap} onClick={onSimpan}>{labelSimpan}</Button>
        {!siap && <p className="-mt-2 text-xs text-redup">{kurang}</p>}
        {onHapus && <HapusButton onHapus={onHapus} label={usulan ? `Usulkan hapus ${labelHapus}` : `Hapus ${labelHapus}`} />}
        {!usulan && <p className="text-xs text-redup">Belum langsung tayang. Tekan Terbitkan di bawah daftar setelah selesai.</p>}
      </div>
    </Sheet>
  )
}

const mediaOk = (ms: Media[]) => ms.every((m) => !m.url.trim() || infoMedia(m))
const adaMedia = (ms: Media[]) => ms.some((m) => m.url.trim())

function IbadahSheet({ awal, kategori, labelSimpan, unggah, onClose, onSimpan, onHapus }: {
  awal: IbadahData | null; kategori: string[]; labelSimpan: string; unggah?: Unggah; onClose: () => void; onSimpan: (d: IbadahData) => void; onHapus?: () => void
}) {
  const [d, setD] = useState({
    judul: awal?.judul ?? '', kategori: awal?.kategori ?? kategori[0] ?? '', ringkas: awal?.ringkas ?? '',
    isi: (awal?.isi ?? []).join('\n\n'), poin: (awal?.poin ?? []).join('\n'), doa: awal?.doa ?? [], media: awal?.media ?? [], produk: awal?.produk ?? [],
  })
  const [katBaru, setKatBaru] = useState(false)
  const set = (p: Partial<typeof d>) => setD({ ...d, ...p })
  const siap = !!(d.judul.trim() && d.kategori.trim() && d.ringkas.trim() && (d.isi.trim() || d.poin.trim() || adaMedia(d.media)) && mediaOk(d.media) && produkOk(d.produk))
  return (
    <SheetForm judul={awal ? 'Ubah materi ibadah' : 'Tambah materi ibadah'} labelSimpan={labelSimpan} siap={siap} labelHapus="materi ini" onClose={onClose} onHapus={onHapus}
      kurang="Isi judul, kategori, ringkasan, dan penjelasan, poin, atau video. Pastikan semua link dikenali."
      onSimpan={() => onSimpan({ judul: d.judul.trim(), kategori: d.kategori.trim(), ringkas: d.ringkas.trim(), isi: paragraf(d.isi), poin: baris(d.poin), doa: d.doa, media: d.media, produk: d.produk })}>
      <Field label="Judul"><input className={inputClass} value={d.judul} onChange={(e) => set({ judul: e.target.value })} placeholder="Contoh: Miqat" /></Field>
      <Field label="Kategori">
        <div className="space-y-2">
          <Pilihan value={katBaru ? '' : d.kategori} options={kategori} onChange={(v) => { setKatBaru(false); set({ kategori: v }) }} />
          {katBaru ? (
            <input className={inputClass} autoFocus value={d.kategori} onChange={(e) => set({ kategori: e.target.value })} placeholder="Nama kategori baru" />
          ) : (
            <button type="button" onClick={() => { setKatBaru(true); set({ kategori: '' }) }} className="text-sm font-semibold text-nabawi">+ Kategori baru</button>
          )}
        </div>
      </Field>
      <Field label="Ringkasan" hint="Satu kalimat pendek. Muncul di bawah judul."><input className={inputClass} value={d.ringkas} onChange={(e) => set({ ringkas: e.target.value })} /></Field>
      <Field label="Video dan foto" hint="Media pertama tampil paling atas. Untuk video YouTube panjang, isi menit mulai supaya langsung ke bagian materi ini.">
        <MediaEditor value={d.media} onChange={(media) => set({ media })} unggah={unggah} nama={d.judul} />
      </Field>
      <Field label="Penjelasan" hint="Tekan Enter dua kali untuk paragraf baru."><textarea rows={6} className={inputClass} value={d.isi} onChange={(e) => set({ isi: e.target.value })} /></Field>
      <Field label="Poin penting (boleh kosong)" hint="Satu poin per baris."><textarea rows={4} className={inputClass} value={d.poin} onChange={(e) => set({ poin: e.target.value })} /></Field>
      <Field label="Doa dan bacaan (boleh kosong)"><DoaEditor value={d.doa} onChange={(doa) => set({ doa })} /></Field>
      <Field label="Rekomendasi produk (boleh kosong)" hint="Tempel link afiliasi Shopee, Tokopedia, dll. Tampil di bawah materi."><ProdukEditor value={d.produk} onChange={(produk) => set({ produk })} /></Field>
    </SheetForm>
  )
}

function TempatSheet({ awal, labelSimpan, unggah, onClose, onSimpan, onHapus }: { awal: TempatData | null; labelSimpan: string; unggah?: Unggah; onClose: () => void; onSimpan: (t: TempatData) => void; onHapus?: () => void }) {
  const [d, setD] = useState({
    nama: awal?.nama ?? '', kota: awal?.kota ?? KOTA_LIST[0], kategori: awal?.kategori ?? KATEGORI_LIST[0], ringkas: awal?.ringkas ?? '',
    isi: (awal?.isi ?? []).join('\n\n'), tips: (awal?.tips ?? []).join('\n'), maps: awal?.maps ?? '', media: awal?.media ?? [], produk: awal?.produk ?? [],
  })
  const set = (p: Partial<typeof d>) => setD({ ...d, ...p })
  const siap = !!(d.nama.trim() && d.ringkas.trim() && d.isi.trim() && mediaOk(d.media) && produkOk(d.produk))
  return (
    <SheetForm judul={awal ? 'Ubah tempat' : 'Tambah tempat'} labelSimpan={labelSimpan} siap={siap} labelHapus="tempat ini" onClose={onClose} onHapus={onHapus}
      kurang="Isi nama, ringkasan, dan penjelasan. Pastikan semua link dikenali."
      onSimpan={() => onSimpan({ nama: d.nama.trim(), kota: d.kota, kategori: d.kategori, ringkas: d.ringkas.trim(), isi: paragraf(d.isi), tips: baris(d.tips), maps: d.maps.trim(), media: d.media, produk: d.produk })}>
      <Field label="Nama tempat"><input className={inputClass} value={d.nama} onChange={(e) => set({ nama: e.target.value })} placeholder="Contoh: Masjid Quba" /></Field>
      <Field label="Kota"><Pilihan value={d.kota} options={KOTA_LIST} onChange={(kota) => set({ kota })} /></Field>
      <Field label="Jenis"><Pilihan value={d.kategori} options={KATEGORI_LIST} onChange={(kategori) => set({ kategori })} /></Field>
      <Field label="Ringkasan" hint="Satu kalimat pendek. Muncul di daftar."><input className={inputClass} value={d.ringkas} onChange={(e) => set({ ringkas: e.target.value })} placeholder="Contoh: Masjid pertama yang dibangun Rasulullah." /></Field>
      <Field label="Foto dan video" hint="Media pertama jadi gambar di daftar dan tampil paling atas.">
        <MediaEditor value={d.media} onChange={(media) => set({ media })} unggah={unggah} nama={d.nama} />
      </Field>
      <Field label="Penjelasan" hint="Ceritakan tempatnya. Tekan Enter dua kali untuk paragraf baru."><textarea rows={6} className={inputClass} value={d.isi} onChange={(e) => set({ isi: e.target.value })} /></Field>
      <Field label="Tips (boleh kosong)" hint="Satu tips per baris."><textarea rows={4} className={inputClass} value={d.tips} onChange={(e) => set({ tips: e.target.value })} placeholder={'Contoh: Datang setelah Subuh\nBawa air minum'} /></Field>
      <Field label="Link Google Maps (boleh kosong)" hint="Kalau kosong, tombol Maps mencari otomatis dari nama tempat."><input className={inputClass} inputMode="url" value={d.maps} onChange={(e) => set({ maps: e.target.value })} placeholder="https://maps.app.goo.gl/…" /></Field>
      <Field label="Rekomendasi produk (boleh kosong)" hint="Misalnya link afiliasi hotel, tur, atau oleh-oleh."><ProdukEditor value={d.produk} onChange={(produk) => set({ produk })} /></Field>
    </SheetForm>
  )
}

function TipSheet({ awal, labelSimpan, unggah, onClose, onSimpan, onHapus }: { awal: TipData | null; labelSimpan: string; unggah?: Unggah; onClose: () => void; onSimpan: (t: TipData) => void; onHapus?: () => void }) {
  const [d, setD] = useState({ judul: awal?.judul ?? '', ringkas: awal?.ringkas ?? '', isi: (awal?.isi ?? []).join('\n\n'), poin: (awal?.poin ?? []).join('\n'), media: awal?.media ?? [], produk: awal?.produk ?? [] })
  const set = (p: Partial<typeof d>) => setD({ ...d, ...p })
  const siap = !!(d.judul.trim() && d.ringkas.trim() && (d.isi.trim() || d.poin.trim() || adaMedia(d.media)) && mediaOk(d.media) && produkOk(d.produk))
  return (
    <SheetForm judul={awal ? 'Ubah tips' : 'Tambah tips'} labelSimpan={labelSimpan} siap={siap} labelHapus="tips ini" onClose={onClose} onHapus={onHapus}
      kurang="Isi judul, ringkasan, dan penjelasan, poin, atau video. Pastikan semua link dikenali."
      onSimpan={() => onSimpan({ judul: d.judul.trim(), ringkas: d.ringkas.trim(), isi: paragraf(d.isi), poin: baris(d.poin), media: d.media, produk: d.produk })}>
      <Field label="Judul"><input className={inputClass} value={d.judul} onChange={(e) => set({ judul: e.target.value })} placeholder="Contoh: Masuk Raudhah lewat Nusuk" /></Field>
      <Field label="Ringkasan" hint="Satu kalimat pendek. Muncul di daftar."><input className={inputClass} value={d.ringkas} onChange={(e) => set({ ringkas: e.target.value })} /></Field>
      <Field label="Video dan foto" hint="Cocok untuk hack dari TikTok, Instagram, atau YouTube.">
        <MediaEditor value={d.media} onChange={(media) => set({ media })} unggah={unggah} nama={d.judul} />
      </Field>
      <Field label="Penjelasan" hint="Tekan Enter dua kali untuk paragraf baru."><textarea rows={5} className={inputClass} value={d.isi} onChange={(e) => set({ isi: e.target.value })} /></Field>
      <Field label="Poin-poin" hint="Satu poin per baris."><textarea rows={5} className={inputClass} value={d.poin} onChange={(e) => set({ poin: e.target.value })} /></Field>
      <Field label="Rekomendasi produk (boleh kosong)" hint="Misalnya link afiliasi eSIM, tiket kereta, atau barang yang disebut di tips."><ProdukEditor value={d.produk} onChange={(produk) => set({ produk })} /></Field>
    </SheetForm>
  )
}

// ── Mode usulan: tanpa kunci. Tiap perubahan dikirim sebagai issue GitHub yang sudah terisi. ──
const ISSUE_URL = `https://github.com/${REPO}/issues/new`
const AKSI_LABEL = { tambah: 'Tambah', ubah: 'Ubah', hapus: 'Hapus' } as const

function isiIssue(u: Usulan, dari: string) {
  const nama = u.data ? namaItem(u.data) : u.sasaran ?? ''
  const jenis = LABEL_JENIS[u.jenis].toLowerCase()
  const judul = `Usulan konten: ${AKSI_LABEL[u.aksi].toLowerCase()} ${jenis} "${nama}"`
  const L: string[] = [PENANDA_USULAN, `### ${AKSI_LABEL[u.aksi]} ${jenis}: ${nama}`]
  if (dari.trim()) L.push(`Dari: ${dari.trim()}`)
  if (u.aksi === 'ubah' && u.sasaran && u.sasaran !== nama) L.push(`Mengganti: ${u.sasaran}`)
  const d = u.data
  const produkBaris = (p: Produk) => `- ${p.nama}: ${p.url}${p.harga ? ` (${p.harga})` : ''}${p.catatan ? `: ${p.catatan}` : ''}`
  if (d && 'url' in d) {
    L.push('', produkBaris(d))
    if (d.checklist) L.push(`**Tombol Beli di checklist:** ${d.checklist}`)
    L.push('')
  } else if (d) {
    L.push('')
    if ('kota' in d) L.push(`**Kota:** ${d.kota} · **Jenis:** ${d.kategori}`)
    if ('doa' in d) L.push(`**Kategori:** ${d.kategori}`)
    L.push(`**Ringkasan:** ${d.ringkas}`, '')
    if (d.isi.length) L.push('**Penjelasan**', ...d.isi.flatMap((p) => [p, '']))
    const poin = 'tips' in d ? d.tips : d.poin
    if (poin.length) L.push(`**${'tips' in d ? 'Tips' : 'Poin'}**`, ...poin.map((x) => `- ${x}`), '')
    if ('doa' in d && d.doa.length) L.push('**Doa**', ...d.doa.flatMap((x) => [x.arab, x.latin ? `_${x.latin}_` : '', x.arti, x.sumber ? `(${x.sumber})` : '', '']))
    if (d.media.length) L.push('**Foto & video**', ...d.media.map((m) => `- ${m.url}${m.mulai ? ` (mulai ${m.mulai})` : ''}${m.keterangan ? `: ${m.keterangan}` : ''}`), '')
    if ('maps' in d && d.maps) L.push(`**Maps:** ${d.maps}`, '')
    if (d.produk?.length) L.push('**Rekomendasi produk**', ...d.produk.map(produkBaris), '')
  }
  if (u.aksi === 'hapus') L.push('', 'Minta dihapus dari aplikasi.', '')
  L.push('---', 'Pemilik repo: beri label **disetujui** untuk menerbitkan usulan ini.', '', '<details><summary>Data untuk sistem (jangan diubah)</summary>', '', '```json', JSON.stringify(u), '```', '', '</details>')
  return { judul, body: L.join('\n') }
}

function ModeUsulan({ onAdmin }: { onAdmin: () => void }) {
  const konten = kontenTayang as Konten
  const [kirim, setKirim] = useState<Usulan | null>(null)
  const sasaran = (jenis: Jenis, i: number) => namaItem((konten[jenis] ?? [])[i])
  return (
    <div>
      <PageHeader title="Kelola konten" subtitle="Usulkan materi ibadah, tempat, dan tips untuk tab Panduan." back="/pengaturan" />
      <div className="mx-5 mb-4 rounded-2xl border border-nabawi/20 bg-nabawi-muda p-4 text-sm leading-relaxed">
        Tambah atau ubah konten di bawah, lalu kirim sebagai usulan. Tim admin memeriksanya dulu sebelum tayang di aplikasi. Kamu cukup punya akun GitHub.
      </div>
      <Daftar konten={konten} labelSimpan="Lanjut kirim usulan"
        onSimpan={(jenis, i, data) => setKirim({ aksi: i == null ? 'tambah' : 'ubah', jenis, sasaran: i == null ? null : sasaran(jenis, i), data } as Usulan)}
        onHapus={(jenis, i) => setKirim({ aksi: 'hapus', jenis, sasaran: sasaran(jenis, i), data: null } as Usulan)} />
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
