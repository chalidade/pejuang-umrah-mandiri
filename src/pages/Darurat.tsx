import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTrip } from '../lib/hooks'
import { PageHeader } from '../components/ui'

const NUMBERS = [
  { label: 'Darurat terpadu', number: '911' },
  { label: 'Ambulans', number: '997' },
]

export default function Darurat() {
  const trip = useTrip()
  const [show, setShow] = useState<'makkah' | 'madinah' | null>(null)
  const hotel = show === 'makkah' ? trip.hotelMakkah : show === 'madinah' ? trip.hotelMadinah : undefined

  if (show) {
    return (
      <div className="pt-safe flex min-h-dvh flex-col bg-white px-6 pb-32">
        <button onClick={() => setShow(null)} className="mt-6 self-start text-sm font-semibold text-nabawi">
          Tutup
        </button>
        <div className="flex flex-1 flex-col justify-center">
          <p className="arab text-right text-[1.9rem]" lang="ar">
            من فضلك، أوصلني إلى هذا الفندق
          </p>
          <p className="mt-1 text-sm text-redup">Tolong antarkan saya ke hotel ini.</p>
          <p className="mt-8 text-[2rem] leading-tight font-bold">{hotel || 'Alamat hotel belum diisi'}</p>
          <p className="mt-2 text-redup">{show === 'makkah' ? 'Makkah' : 'Madinah'}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Darurat" subtitle="Tunjukkan layar ini saat tersesat atau butuh bantuan." />
      <div className="space-y-3 px-5">
        <div className="grid grid-cols-2 gap-3">
          {NUMBERS.map((n) => (
            <a key={n.number} href={`tel:${n.number}`} className="rounded-2xl border border-bata/25 bg-white p-4">
              <p className="text-sm text-redup">{n.label}</p>
              <p className="text-3xl font-extrabold text-bata tabular-nums">{n.number}</p>
            </a>
          ))}
        </div>

        <div className="rounded-2xl bg-white p-4 border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
          <h2 className="font-bold">Kartu alamat hotel</h2>
          <p className="mt-0.5 text-sm text-redup">Tampilkan ke sopir taksi atau petugas, lengkap dengan kalimat bahasa Arab.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => setShow('makkah')} className="rounded-xl bg-nabawi py-3 font-semibold text-white">
              Hotel Makkah
            </button>
            <button onClick={() => setShow('madinah')} className="rounded-xl bg-nabawi py-3 font-semibold text-white">
              Hotel Madinah
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-garis shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
          <div className="flex items-baseline justify-between">
            <h2 className="font-bold">Info medis</h2>
            <Link to="/pengaturan" className="text-sm font-semibold text-nabawi">
              Ubah
            </Link>
          </div>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[0.95rem]">
            <dt className="text-redup">Golongan darah</dt>
            <dd className="font-semibold">{trip.bloodType || '–'}</dd>
            <dt className="text-redup">Alergi / penyakit</dt>
            <dd className="font-semibold">{trip.allergies || '–'}</dd>
            <dt className="text-redup">Kontak keluarga</dt>
            <dd className="font-semibold">{trip.emergencyContact || '–'}</dd>
          </dl>
        </div>

        <div className="rounded-2xl bg-nabawi-muda p-4 text-[0.95rem]">
          <h2 className="font-bold">Perwakilan Indonesia</h2>
          <p className="mt-1 text-redup">
            Simpan nomor hotline KJRI Jeddah dan KBRI Riyadh dari situs resmi Kementerian Luar Negeri sebelum berangkat, untuk kehilangan paspor atau masalah hukum.
          </p>
        </div>
      </div>
    </div>
  )
}
