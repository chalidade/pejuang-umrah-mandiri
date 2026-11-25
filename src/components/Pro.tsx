// Ajakan ke versi Pro dan formulir aktivasi kunci lisensi.
import { useState, type ReactNode } from 'react'
import Sheet from './Sheet'
import { Button, Field, inputClass } from './ui'
import { BELI_URL, aktivasi, lepas, tutupUcapan, useLisensi } from '../lib/lisensi'

const MANFAAT = [
  'Catat tabungan dan pengeluaran tanpa batas',
  'Baca semua langkah persiapan sampai tuntas',
  'Umroh bareng: sinkron data dengan partner',
  'Sekali bayar, berlaku seumur hidup, untuk 2 HP',
]

function Bintang({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
    </svg>
  )
}

export function ProSheet({ onClose, alasan }: { onClose: () => void; alasan?: string }) {
  const [kunci, setKunci] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const kirim = async () => {
    setBusy(true); setErr('')
    try { await aktivasi(kunci); onClose() } catch (e) { setErr((e as Error).message); setBusy(false) }
  }
  return (
    <Sheet title="Pejuang Umrah Pro" onClose={onClose}>
      {(
        <div className="space-y-4 pb-6">
          {alasan && <p className="rounded-xl bg-emas-muda px-3 py-2.5 text-sm">{alasan}</p>}
          <ul className="space-y-2">
            {MANFAAT.map((m) => (
              <li key={m} className="flex gap-3">
                <span className="mt-0.5 text-emas"><Bintang /></span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
          {BELI_URL ? (
            <a href={BELI_URL} target="_blank" rel="noreferrer" className="block rounded-2xl bg-nabawi py-3.5 text-center font-bold text-white">Beli lisensi</a>
          ) : (
            <p className="rounded-xl bg-batu px-3 py-2.5 text-sm">Untuk membeli, hubungi tim Pejuang Umrah. Kamu akan mendapat kunci lisensi.</p>
          )}
          <Field label="Sudah punya kunci lisensi?">
            <input className={`${inputClass} uppercase tracking-wider`} value={kunci} onChange={(e) => setKunci(e.target.value)} placeholder="PUM-ABCD-EFGH-JKLM" autoCapitalize="characters" autoComplete="off" spellCheck={false} />
          </Field>
          {err && <p role="alert" className="rounded-xl border border-bata/30 bg-bata/5 px-3 py-2.5 text-sm text-bata">{err}</p>}
          <Button variant="ghost" className="w-full" disabled={kunci.replace(/[^a-z0-9]/gi, '').length < 12 || busy} onClick={kirim}>
            {busy ? 'Mengaktifkan…' : 'Aktifkan'}
          </Button>
          <p className="text-xs text-redup">Aktivasi butuh internet sekali. Setelah itu Pro tetap jalan tanpa internet.</p>
        </div>
      )}
    </Sheet>
  )
}

/** Kartu kecil di tempat fitur terkunci. */
export function ProKartu({ judul, children }: { judul: string; children?: ReactNode }) {
  const [buka, setBuka] = useState(false)
  return (
    <div className="rounded-2xl border border-emas/50 bg-emas-muda p-4">
      <p className="flex items-center gap-2 font-bold"><span className="text-[#C98A00]"><Bintang /></span>{judul}</p>
      {children && <div className="mt-1 text-sm text-redup">{children}</div>}
      <button onClick={() => setBuka(true)} className="mt-3 rounded-full bg-tinta px-4 py-2 text-sm font-semibold text-white">Buka dengan Pro</button>
      {buka && <ProSheet onClose={() => setBuka(false)} />}
    </div>
  )
}

/** Bagian Lisensi di Pengaturan. */
export function LisensiPengaturan() {
  const { aktif, pro, status, kunci, nama } = useLisensi()
  const [lepasYakin, setLepasYakin] = useState(false)
  const [buka, setBuka] = useState(false)
  if (!aktif) return null
  return (
    <>
      <h2 className="pt-2 text-lg font-bold tracking-tight">Lisensi</h2>
      {pro && status === 'pro' ? (
        <div className="rounded-2xl border border-garis bg-white p-4">
          <p className="flex items-center gap-2 font-bold"><span className="text-emas"><Bintang /></span>Pro aktif</p>
          <p className="mt-1 text-sm text-redup">Atas nama {nama}. Kunci <span className="font-mono">{kunci?.replace(/-(\w{4})-(\w{4})-/, '-••••-••••-')}</span></p>
          {lepasYakin ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setLepasYakin(false)}>Batal</Button>
              <Button variant="danger" onClick={async () => { await lepas(); setLepasYakin(false) }}>Ya, lepas</Button>
            </div>
          ) : (
            <button onClick={() => setLepasYakin(true)} className="mt-3 text-sm font-semibold text-redup underline">Lepas dari HP ini (untuk pindah HP)</button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-garis bg-white p-4">
          <p className="font-bold">Versi gratis</p>
          <p className="mt-1 text-sm text-redup">Buka semua fitur dengan sekali bayar, berlaku seumur hidup.</p>
          <Button className="mt-3 w-full" onClick={() => setBuka(true)}>Lihat Pro atau masukkan kunci</Button>
          {buka && <ProSheet onClose={() => setBuka(false)} />}
        </div>
      )}
    </>
  )
}

/** Ucapan setelah aktivasi berhasil. Dipasang sekali di Layout. */
export function UcapanPro() {
  const { baru, nama } = useLisensi()
  if (!baru) return null
  return (
    <Sheet title="Pejuang Umrah Pro" onClose={tutupUcapan}>
      <div className="space-y-4 pb-6 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emas text-white"><Bintang size={30} /></div>
        <p className="font-display text-2xl font-extrabold">Pro sudah aktif</p>
        <p className="text-redup">Terima kasih, {nama}. Semua fitur sudah terbuka di HP ini.</p>
        <Button className="w-full" onClick={tutupUcapan}>Lanjut</Button>
      </div>
    </Sheet>
  )
}
