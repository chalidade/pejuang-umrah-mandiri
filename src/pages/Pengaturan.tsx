import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db, saveTrip, type Trip } from '../db'
import { parseAngka } from '../lib/format'
import { useTrip } from '../lib/hooks'
import { Button, Field, PageHeader, inputClass } from '../components/ui'
import InstallCard from '../components/InstallCard'

export default function Pengaturan() {
  const trip = useTrip()
  const set = (patch: Partial<Trip>) => saveTrip(patch)
  const [confirm, setConfirm] = useState(false)

  const reset = async () => {
    await Promise.all([db.trip.clear(), db.steps.clear(), db.checklist.clear(), db.expenses.clear(), db.deposits.clear(), db.costs.clear(), db.categories.clear()])
    setConfirm(false)
  }

  return (
    <div>
      <PageHeader title="Atur perjalanan" subtitle="Semua data tersimpan di HP-mu saja." back="/" />
      <form className="space-y-4 px-5" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Namamu">
            <input className={inputClass} placeholder="Contoh: Chalid" value={trip.nickname ?? ''} onChange={(e) => set({ nickname: e.target.value })} />
          </Field>
          <Field label="Nama perjalanan">
            <input className={inputClass} value={trip.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
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

        <h2 className="pt-2 text-lg font-bold tracking-tight">Aplikasi</h2>
        <InstallCard always />

        <h2 className="pt-2 text-lg font-bold tracking-tight">Untuk tim konten</h2>
        <Link to="/kelola" className="flex items-center justify-between rounded-2xl border border-garis bg-white p-4">
          <span>
            <span className="block font-semibold">Kelola konten</span>
            <span className="block text-sm text-redup">Tambah dan ubah Destinasi serta Tips di tab Panduan.</span>
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-redup" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>

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
      </form>
    </div>
  )
}
