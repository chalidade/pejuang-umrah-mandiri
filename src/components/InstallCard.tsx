import { useEffect, useState, useSyncExternalStore } from 'react'
import { canPrompt, dismiss, dismissedRecently, isInstalled, platform, promptInstall, subscribe } from '../lib/install'

const IOS_STEPS = ['Buka halaman ini di Safari.', 'Ketuk ikon Bagikan (kotak dengan panah ke atas).', 'Pilih "Tambahkan ke Layar Utama", lalu ketuk Tambah.']
const ANDROID_STEPS = ['Buka halaman ini di Chrome.', 'Ketuk menu titik tiga di kanan atas.', 'Pilih "Instal aplikasi" atau "Tambahkan ke layar utama".']
const DESKTOP_STEPS = ['Buka halaman ini di Chrome atau Edge.', 'Klik ikon pasang di ujung kanan kolom alamat.', 'Pilih Instal.']

/** Ajakan memasang aplikasi ke layar utama. `always` dipakai di halaman pengaturan. */
export default function InstallCard({ always = false }: { always?: boolean }) {
  const prompt = useSyncExternalStore(subscribe, canPrompt)
  const [hidden, setHidden] = useState(() => !always && dismissedRecently())
  const [help, setHelp] = useState(false)
  const [installed, setInstalled] = useState(isInstalled)

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    const on = () => setInstalled(isInstalled())
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  if (installed) {
    return always ? <p className="rounded-2xl bg-nabawi-muda p-4 text-sm">Aplikasi sudah terpasang di perangkat ini.</p> : null
  }
  if (hidden) return null

  const p = platform()
  const steps = p === 'ios' ? IOS_STEPS : p === 'android' ? ANDROID_STEPS : DESKTOP_STEPS

  const install = async () => {
    if (prompt) {
      if (await promptInstall()) setInstalled(true)
    } else setHelp(true)
  }

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-garis bg-white p-4 shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
      <div className="flex items-start gap-3">
        <img src={`${import.meta.env.BASE_URL}icons/icon-192-v2.png`} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-[14px]" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.02rem] font-bold">Pasang di HP</h2>
          <p className="mt-0.5 text-sm leading-snug text-redup">Buka langsung dari layar utama, tetap bisa dipakai tanpa internet di Tanah Suci.</p>
        </div>
        {!always && (
          <button
            onClick={() => {
              dismiss()
              setHidden(true)
            }}
            aria-label="Tutup ajakan pasang"
            className="-mt-1 -mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#93a0b8]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      {help || (!prompt && p === 'ios') ? (
        <ol className="mt-3 space-y-2 rounded-2xl bg-nabawi-muda p-3.5">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-2.5 text-[0.88rem] leading-snug">
              <span className="font-display grid h-5 w-5 shrink-0 place-items-center rounded-full bg-nabawi text-[0.7rem] font-extrabold text-white">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      ) : (
        <button onClick={install} className="mt-3 w-full rounded-2xl bg-nabawi py-3 text-[0.95rem] font-bold text-white shadow-[0_8px_18px_rgba(24,87,240,0.3)]">
          Pasang aplikasi
        </button>
      )}
    </section>
  )
}
