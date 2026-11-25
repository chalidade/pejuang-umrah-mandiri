import { useState } from 'react'
import { useAkun } from '../lib/akun'

/** Foto profil Google (atau huruf depan nama) kalau sudah masuk; ikon pengaturan kalau belum. */
export function FotoProfil() {
  const { akun } = useAkun()
  const [gagal, setGagal] = useState(false)
  if (!akun) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </svg>
    )
  }
  if (akun.foto && !gagal) {
    return <img src={akun.foto} alt="" referrerPolicy="no-referrer" onError={() => setGagal(true)} className="h-full w-full rounded-full object-cover" />
  }
  const huruf = (akun.nama || akun.email || '?').trim().charAt(0).toUpperCase()
  return <span className="grid h-full w-full place-items-center rounded-full bg-nabawi text-[1.05rem] font-bold text-white">{huruf}</span>
}
