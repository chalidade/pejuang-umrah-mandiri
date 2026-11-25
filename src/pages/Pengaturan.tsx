import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LisensiPengaturan } from '../components/Pro'
import { AkunPengaturan } from '../components/Akun'
import { useAkun } from '../lib/akun'
import { db, saveTrip, type Trip } from '../db'
import { parseAngka } from '../lib/format'
import { useTrip } from '../lib/hooks'
import { Button, Field, PageHeader, inputClass } from '../components/ui'
import InstallCard from '../components/InstallCard'
import { adalahTim, tandaiTim } from '../lib/tim'

export default function Pengaturan() {
  const trip = useTrip()
  const { akun } = useAkun()
  const set = (patch: Partial<Trip>) => saveTrip(patch)
  const [confirm, setConfirm] = useState(false)
  const [tim, setTim] = useState(adalahTim)
  const [ketuk, setKetuk] = useState(0)
  const ketukVersi = () => {
    const n = ketuk + 1
    setKetuk(n)
    if (n >= 7) { const baru = !tim; tandaiTim(baru); setTim(baru); setKetuk(0) }
  }

  const reset = async () => {
    await Promise.all([db.trip.clear(), db.steps.clear(), db.checklist.clear(), db.expenses.clear(), db.deposits.clear(), db.costs.clear(), db.categories.clear()])
    setConfirm(false)
  }

  return (
    <div>
      <PageHeader title="Atur perjalanan" subtitle={akun ? "Tersimpan di HP-mu dan dicadangkan ke akun Google." : "Semua data tersimpan di HP-mu."} back="/" />
      <form className="space-y-4 px-5" onSubmit={(e) => e.preventDefault()}>
        <AkunPengaturan />
        <h2 className="pt-2 text-lg font-bold tracking-tight">Perjalanan</h2>
        <div className="grid gap-3 min-[420px]:grid-cols-2">
          <Field label="Namamu">
            <input className={inputClass} placeholder="Contoh: Chalid" value={trip.nickname ?? ''} onChange={(e) => set({ nickname: e.target.value })} />
          </Field>
          <Field label="Nama perjalanan">
            <input className={inputClass} value={trip.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-3 min-[420px]:grid-cols-2">
          <Field label="Tanggal berangkat">
            <input type="date" className={inputClass} value={trip.departDate ?? ''} onChange={(e) => set({ departDate: e.target.value || undefined })} />
          </Field>
          <Field label="Tanggal pulang">
            <input type="date" className={inputClass} value={trip.returnDate ?? ''} onChange={(e) => set({ returnDate: e.target.value || undefined })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Jumlah orang">
            <input type="number" min={1} className={inputClass} value={trip.travelers} onChange={(e) => set({ travelers: Math.max(1, Number(e.target.value) || 1) })} />
          </Field>
          <Field label="Kurs 1 SAR (Rp)" hint="Sesuaikan dengan kurs hari ini.">
            <input inputMode="numeric" className={inputClass} value={trip.sarRate.toLocaleString('id-ID')} onChange={(e) => set({ sarRate: parseAngka(e.target.value) || 1 })} />
          </Field>
        </div>

        <h2 className="pt-2 text-lg font-bold tracking-tight">Hotel</h2>
        <Field label="Nama dan alamat hotel di Makkah">
          <textarea rows={2} className={inputClass} value={trip.hotelMakkah ?? ''} onChange={(e) => set({ hotelMakkah: e.target.value })} />
        </Field>
        <Field label="Nama dan alamat hotel di Madinah">
          <textarea rows={2} className={inputClass} value={trip.hotelMadinah ?? ''} onChange={(e) => set({ hotelMadinah: e.target.value })} />
        </Field>

        <h2 className="pt-2 text-lg font-bold tracking-tight">Info darurat</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Golongan darah">
            <select className={inputClass} value={trip.bloodType ?? ''} onChange={(e) => set({ bloodType: e.target.value })}>
              {['', 'A', 'B', 'AB', 'O'].map((b) => (
                <option key={b} value={b}>
                  {b || 'Pilih'}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kontak keluarga">
            <input className={inputClass} placeholder="Nama & nomor" value={trip.emergencyContact ?? ''} onChange={(e) => set({ emergencyContact: e.target.value })} />
          </Field>
        </div>
        <Field label="Alergi atau penyakit">
          <input className={inputClass} value={trip.allergies ?? ''} onChange={(e) => set({ allergies: e.target.value })} />
        </Field>

        <LisensiPengaturan />

        <h2 className="pt-2 text-lg font-bold tracking-tight">Aplikasi</h2>
        <InstallCard always />

        {tim && (
          <>
          <h2 className="pt-2 text-lg font-bold tracking-tight">Untuk tim</h2>
          <Link to="/kelola" className="flex items-center justify-between rounded-2xl border border-garis bg-white p-4">
            <span>
              <span className="block font-semibold">Kelola konten</span>
              <span className="block text-sm text-redup">Tambah dan ubah Destinasi serta Tips di tab Panduan.</span>
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-redup" aria-hidden>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
          <Link to="/admin-lisensi" className="flex items-center justify-between rounded-2xl border border-garis bg-white p-4">
            <span>
              <span className="block font-semibold">Admin lisensi</span>
              <span className="block text-sm text-redup">Buat kunci Pro untuk pembeli, cabut, atau lepas HP.</span>
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-redup" aria-hidden>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
          </>
        )}

        <div className="border-t border-garis pt-5">
          {confirm ? (
            <div className="space-y-2">
              <p className="text-sm">Semua catatan, tabungan, dan checklist akan dihapus dari HP ini.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" onClick={() => setConfirm(false)}>
                  Batal
                </Button>
                <Button variant="danger" onClick={reset}>
                  Hapus semua data
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="danger" className="w-full" onClick={() => setConfirm(true)}>
              Hapus semua data
            </Button>
          )}
        </div>
        <Link to="/privasi" className="block pt-2 text-center text-sm font-semibold text-redup underline">Kebijakan privasi</Link>
        <button type="button" onClick={ketukVersi} className="block w-full select-none pb-4 pt-2 text-center text-xs text-redup">
          Pejuang Umrah Mandiri{ketuk >= 3 && ketuk < 7 ? ` · ${7 - ketuk} ketukan lagi` : ''}
        </button>
      </form>
    </div>
  )
}
