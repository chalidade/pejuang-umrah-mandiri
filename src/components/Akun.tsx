import { useEffect, useRef, useState } from 'react'
import { Button } from './ui'
import { AKUN_AKTIF, hapusAkun, keluar, pasangTombol, sinkron, useAkun } from '../lib/akun'

/** Tombol resmi Google. onHasil dipanggil setelah masuk + pemulihan selesai. */
export function TombolGoogle({ onHasil }: { onHasil?: (dipulihkan: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [err, setErr] = useState('')
  const [proses, setProses] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    pasangTombol(ref.current, (h) => {
      setProses(false)
      if (h instanceof Error) setErr(h.message)
      else { setErr(''); onHasil?.(h.dipulihkan) }
    }).catch((e: Error) => setErr(e.message))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div onClickCapture={() => setProses(true)}>
      <div ref={ref} className="flex min-h-11 justify-center" />
      {proses && !err && <p className="mt-2 text-center text-sm text-redup">Menunggu login Google…</p>}
      {err && <p role="alert" className="mt-2 text-center text-sm text-bata">{err}</p>}
    </div>
  )
}

const jam = (t: number) => new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function AkunPengaturan() {
  const { akun, status, pesan } = useAkun()
  const [yakin, setYakin] = useState(false)
  const [info, setInfo] = useState('')
  if (!AKUN_AKTIF) return null
  return (
    <>
      <h2 className="pt-2 text-lg font-bold tracking-tight">Cadangan data</h2>
      {!akun ? (
        <div className="rounded-2xl border border-garis bg-white p-4">
          <p className="font-bold">Simpan data ke akun Google</p>
          <p className="mt-1 mb-4 text-sm leading-relaxed text-redup">Catatan, tabungan, pengeluaran, dan lisensi Pro dicadangkan otomatis. Kalau ganti HP atau aplikasi terhapus, cukup masuk lagi dan semua kembali.</p>
          <TombolGoogle onHasil={(d) => setInfo(d ? 'Data dari akunmu sudah dipulihkan ke HP ini.' : 'Cadangan otomatis aktif.')} />
          <p className="mt-3 text-center text-xs text-redup">Lihat <a href="/privasi" className="underline">kebijakan privasi</a>.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-garis bg-white p-4">
          <p className="font-bold">Tersimpan di akun Google</p>
          <p className="mt-1 text-sm break-all text-redup">{akun.email}</p>
          <p className={`mt-2 text-sm ${status === 'gagal' ? 'text-bata' : 'text-nabawi'}`}>
            {status === 'menyimpan' ? 'Menyimpan…' : status === 'gagal' ? `Belum tersimpan: ${pesan}` : akun.terakhir ? `Tersimpan otomatis · ${jam(akun.terakhir)}` : 'Cadangan otomatis aktif'}
          </p>
          {info && <p className="mt-2 rounded-xl bg-nabawi-muda px-3 py-2 text-sm text-nabawi">{info}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="ghost" disabled={status === 'menyimpan'} onClick={() => sinkron({ paksa: true })}>Simpan sekarang</Button>
            <Button variant="ghost" onClick={keluar}>Keluar</Button>
          </div>
          {yakin ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm">Cadangan di server dihapus permanen. Data di HP ini tetap ada.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" onClick={() => setYakin(false)}>Batal</Button>
                <Button variant="danger" onClick={async () => { try { await hapusAkun() } catch (e) { setInfo((e as Error).message) } setYakin(false) }}>Hapus cadangan</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setYakin(true)} className="mt-3 text-sm font-semibold text-redup underline">Hapus akun dan cadangan</button>
          )}
        </div>
      )}
    </>
  )
}
