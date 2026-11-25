import { useWarnaBar } from '../lib/themeColor'
import { AKUN_AKTIF, useAkun } from '../lib/akun'
import { TombolGoogle } from '../components/Akun'
import { useMemo, useState } from 'react'
import { db, DEFAULT_TRIP, saveTrip, stamp, type Trip } from '../db'
import { costTotal, defaultCostRows } from '../data/costs'
import { jutaan, parseAngka, rupiah, tanggal, today } from '../lib/format'
import { inputClass } from '../components/ui'

const TOTAL_STEPS = 3 // nama, rencana, tabungan (layar sambutan & selesai tidak dihitung)

// Estimasi versi hemat 9 hari dari pos biaya bawaan, sama dengan tab Estimasi
const estimate = (days: number) => defaultCostRows().reduce((a, c) => a + costTotal(c.kind, c.hemat, days), 0)

function Skyline({ className = '' }: { className?: string }) {
  return (
    <svg className={`pointer-events-none absolute bottom-0 left-0 w-full ${className}`} viewBox="0 0 350 78" preserveAspectRatio="xMidYMax slice" fill="#fff" fillOpacity=".16" aria-hidden>
      <rect y="60" width="350" height="18" />
      <path d="M127 60a48 48 0 0196 0z" />
      <rect x="173.5" y="4" width="3" height="10" />
      <path d="M52 60V22l5-10 5 10v38zM288 60V22l5-10 5 10v38zM16 60V36l4-8 4 8v24zM326 60V36l4-8 4 8v24z" />
      <path d="M78 60a15 15 0 0130 0zM242 60a15 15 0 0130 0z" />
    </svg>
  )
}

function Arrow() {
  return (
    <svg width="36" height="26" viewBox="0 0 36 26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 4c12-2 22 4 26 17" />
      <path d="M22 17l7 5 4-8" />
    </svg>
  )
}

function Centang() {
  return (
    <svg className="mt-0.5 shrink-0 text-nabawi" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export default function Onboarding({ initial }: { initial: Trip | null }) {
  const base = initial ?? DEFAULT_TRIP
  const [step, setStep] = useState(0)
  const [pilih, setPilih] = useState(false)
  const akun = useAkun().akun
  useWarnaBar(step === 0 || step === 4 ? '#1857F0' : '#FFFFFF')
  const [name, setName] = useState(base.nickname ?? '')
  const [depart, setDepart] = useState(base.departDate ?? '')
  const [unknownDate, setUnknownDate] = useState(!!initial && !base.departDate)
  const [people, setPeople] = useState(String(base.travelers || 1))
  const peopleN = Math.min(Math.max(Number(people) || 1, 1), 50)
  const suggested = useMemo(() => estimate(9) * peopleN, [peopleN])
  const [target, setTarget] = useState<number | null>(initial ? base.savingsTarget : null)
  const [saved, setSaved] = useState('')
  const targetN = target ?? suggested

  const first = name.trim().split(/\s+/)[0] ?? ''
  const next = () => setStep((s) => s + 1)
  const back = () => setStep((s) => Math.max(0, s - 1))

  const finish = async () => {
    await saveTrip({ nickname: name.trim(), departDate: unknownDate ? undefined : depart || undefined, travelers: peopleN, savingsTarget: targetN, onboarded: true })
    const n = parseAngka(saved)
    if (n > 0) await db.deposits.add({ amount: n, date: today(), note: 'Tabungan awal', ...stamp() })
  }

  // Pilih: masuk dengan Google atau lanjut sebagai tamu
  if (step === 0 && pilih) {
    const setelahMasuk = (dipulihkan: boolean) => {
      // ada data lama: aplikasi langsung terbuka (onboarded ikut dipulihkan). Belum ada: lanjut isi perkenalan.
      if (dipulihkan) return
      const depan = (akun?.nama || '').trim().split(/\s+/)[0]
      if (depan && !name.trim()) setName(depan)
      next()
    }
    return (
      <div className="pt-safe pb-safe mx-auto flex min-h-dvh max-w-md flex-col bg-marmer px-5">
        <button onClick={() => setPilih(false)} className="mt-5 flex items-center gap-1 self-start text-sm font-semibold text-nabawi">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
          Kembali
        </button>
        <h1 className="mt-5 text-[1.9rem] leading-tight font-extrabold tracking-tight">Simpan datamu di mana?</h1>
        <p className="mt-2 text-[0.98rem] leading-relaxed text-redup">Catatan, tabungan, dan pengeluaranmu bakal terus bertambah sampai hari berangkat. Pilih cara menyimpannya.</p>

        <section className="mt-6 rounded-2xl border-2 border-nabawi bg-white p-4 shadow-[0_6px_18px_rgba(24,87,240,0.1)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Masuk dengan Google</h2>
            <span className="shrink-0 rounded-full bg-nabawi-muda px-2.5 py-1 text-xs font-bold text-nabawi">Disarankan</span>
          </div>
          <ul className="mt-2 space-y-1.5 text-[0.95rem]">
            {['Data dicadangkan otomatis ke akunmu', 'Ganti HP atau pasang ulang, tinggal masuk lagi', 'Lisensi Pro ikut tersimpan'].map((t) => (
              <li key={t} className="flex gap-2"><Centang />{t}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-redup">Sudah pernah pakai? Masuk dengan akun yang sama, datamu kembali.</p>
          <div className="mt-4"><TombolGoogle onHasil={setelahMasuk} /></div>
        </section>

        <section className="mt-4 rounded-2xl border border-garis bg-white p-4">
          <h2 className="text-lg font-bold">Lanjut sebagai tamu</h2>
          <p className="mt-2 flex gap-2 rounded-xl bg-emas-muda px-3 py-2.5 text-sm leading-relaxed">
            <span aria-hidden className="font-bold">!</span>
            <span>Data hanya tersimpan di HP ini. Kalau aplikasi dihapus, HP hilang, atau ganti HP, datanya <b>tidak bisa dikembalikan</b>.</span>
          </p>
          <p className="mt-2 text-sm text-redup">Kamu bisa masuk dengan Google kapan saja dari Pengaturan.</p>
          <button onClick={next} className="mt-4 w-full rounded-xl border border-garis py-3 font-semibold text-tinta">Lanjut sebagai tamu</button>
        </section>
        <p className="mt-4 mb-6 text-center text-xs text-redup">
          Dengan masuk, kamu menyetujui <a href="/privasi" className="underline">kebijakan privasi</a> kami.
        </p>
      </div>
    )
  }

  // Layar sambutan
  if (step === 0) {
    return (
      <div className="pt-safe pb-safe relative mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden bg-nabawi px-6 text-white">
        <div className="absolute top-[12%] right-8 h-20 w-20 rounded-full bg-emas" aria-hidden />
        <div className="relative mt-[38%]">
          <p className="flex items-center gap-2.5 text-[0.95rem] font-semibold text-white/90">
            <img src={`${import.meta.env.BASE_URL}logo/simbol-di-biru.svg`} alt="" className="h-9 w-9" />
            Pejuang Umrah
          </p>
          <h1 className="mt-3 text-[2.6rem] leading-[1.05] font-extrabold">Umroh mandiri, nggak pakai ribet.</h1>
          <p className="mt-4 max-w-[30ch] text-[1.02rem] leading-relaxed text-white/85">Persiapan, biaya, dan panduan ibadah dalam satu tempat. Tetap jalan tanpa internet.</p>
          <p className="tulis mt-6 flex -rotate-3 items-end gap-1 text-[1.6rem] !text-[#FFE08A]" aria-hidden>
            bismillah, kita mulai!
            <Arrow />
          </p>
        </div>
        <Skyline className="h-[120px]" />
        <div className="relative mt-auto mb-8">
          <button onClick={() => (AKUN_AKTIF && !akun ? setPilih(true) : next())} className="w-full rounded-2xl bg-white py-4 text-[1.05rem] font-bold text-nabawi shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
            Mulai persiapan
          </button>
          <p className="mt-3 text-center text-xs text-white/75">{AKUN_AKTIF ? 'Masuk dengan Google atau lanjut sebagai tamu.' : 'Tanpa akun. Bisa diubah kapan saja.'}</p>
        </div>
      </div>
    )
  }

  // Layar selesai
  if (step === 4) {
    return (
      <div className="pt-safe pb-safe relative mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden bg-nabawi px-6 text-white">
        <div className="absolute top-[10%] right-8 h-16 w-16 rounded-full bg-emas" aria-hidden />
        <div className="relative mt-[34%]">
          <p className="text-[1rem] font-semibold text-white/85">Calon tamu Allah</p>
          <h1 className="mt-1 text-[2.9rem] leading-[1.05] font-extrabold break-words">{name.trim()}</h1>
          <p className="tulis mt-4 -rotate-2 text-[1.6rem] !text-[#FFE08A]" aria-hidden>
            semoga dimudahkan sampai ke Baitullah
          </p>
          <ul className="mt-8 space-y-3 text-[0.98rem]">
            <li className="flex justify-between gap-4 border-b border-white/20 pb-3">
              <span className="text-white/75">Berangkat</span>
              <span className="font-semibold">{!unknownDate && depart ? tanggal(depart) : 'Belum ditentukan'}</span>
            </li>
            <li className="flex justify-between gap-4 border-b border-white/20 pb-3">
              <span className="text-white/75">Jumlah orang</span>
              <span className="font-semibold">{peopleN} orang</span>
            </li>
            <li className="flex justify-between gap-4 border-b border-white/20 pb-3">
              <span className="text-white/75">Target tabungan</span>
              <span className="font-semibold">{jutaan(targetN)}</span>
            </li>
          </ul>
        </div>
        <Skyline className="h-[110px]" />
        <div className="relative mt-auto mb-8">
          <button onClick={finish} className="w-full rounded-2xl bg-white py-4 text-[1.05rem] font-bold text-nabawi shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
            Masuk ke aplikasi
          </button>
          <button onClick={back} className="mt-2 w-full py-2.5 text-sm font-semibold text-white/80">
            Ubah jawaban
          </button>
        </div>
      </div>
    )
  }

  const canNext = step === 1 ? name.trim().length > 0 : step === 2 ? unknownDate || !!depart : targetN > 0

  return (
    <div className="pt-safe pb-safe mx-auto flex min-h-dvh max-w-md flex-col bg-white px-6">
      <div className="flex items-center gap-3 pt-5">
        <button onClick={back} aria-label="Kembali" className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-nabawi-muda">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step} aria-label={`Langkah ${step} dari ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <i key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-nabawi' : 'bg-langit'}`} />
          ))}
        </div>
        <span className="w-10 text-right text-xs font-semibold text-redup tabular-nums">
          {step}/{TOTAL_STEPS}
        </span>
      </div>

      <form
        className="flex flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault()
          if (canNext) next()
        }}
      >
        {step === 1 && (
          <div className="mt-10">
            <h1 className="text-[2rem] leading-tight font-extrabold">Siapa namamu?</h1>
            <p className="mt-2 text-redup">Nama ini muncul di beranda. Hanya tersimpan di HP-mu.</p>
            <input autoFocus className={`${inputClass} mt-6 !py-4 !text-lg`} placeholder="Contoh: Chalid" value={name} onChange={(e) => setName(e.target.value)} aria-label="Namamu" autoComplete="given-name" />
            {first && (
              <div className="mt-6 rounded-[22px] bg-nabawi-muda p-4">
                <p className="text-xs text-redup">Tampil di beranda</p>
                <p className="mt-1 text-[0.85rem] text-redup">Calon tamu Allah</p>
                <p className="font-display text-[1.2rem] font-bold">{name.trim()}</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="mt-10">
            <h1 className="text-[2rem] leading-tight font-extrabold">Kapan rencana berangkat?</h1>
            <p className="mt-2 text-redup">Untuk hitung mundur dan jadwal persiapanmu.</p>
            <label className="mt-6 block">
              <span className="mb-1.5 block text-sm font-semibold">Tanggal berangkat</span>
              <input
                type="date"
                min={today()}
                disabled={unknownDate}
                className={`${inputClass} disabled:opacity-40`}
                value={depart}
                onChange={(e) => setDepart(e.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={() => setUnknownDate((v) => !v)}
              aria-pressed={unknownDate}
              className={`mt-3 rounded-full px-4 py-2 text-sm font-semibold ${unknownDate ? 'bg-nabawi text-white' : 'bg-nabawi-muda text-tinta'}`}
            >
              Belum tahu tanggalnya
            </button>
            <label className="mt-8 block">
              <span className="mb-1.5 block text-sm font-semibold">Berangkat berapa orang?</span>
              <div className="flex items-center rounded-xl border border-garis bg-white focus-within:border-nabawi focus-within:ring-2 focus-within:ring-nabawi/20">
                <input
                  inputMode="numeric"
                  className="w-full min-w-0 bg-transparent py-3 pl-3.5 text-base tabular-nums outline-none focus-visible:outline-none"
                  value={people}
                  onChange={(e) => setPeople(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                  onBlur={() => setPeople(String(peopleN))}
                  onFocus={(e) => e.target.select()}
                />
                <span className="pr-3.5 text-redup">orang</span>
              </div>
            </label>
            <p className="tulis mt-5 -rotate-2 text-[1.35rem]" aria-hidden>
              bareng teman atau pasangan? bisa sync nanti
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="mt-10">
            <h1 className="text-[2rem] leading-tight font-extrabold">Target tabunganmu</h1>
            <p className="mt-2 text-redup">
              Perkiraan umroh mandiri versi hemat 9 hari sekitar <b className="font-semibold text-tinta">{rupiah(estimate(9))}</b> per orang. Ubah sesuai rencanamu.
            </p>
            <label className="mt-6 block">
              <span className="mb-1.5 block text-sm font-semibold">Target untuk {peopleN} orang (Rp)</span>
              <input inputMode="numeric" className={`${inputClass} !py-4 !text-lg font-bold tabular-nums`} value={targetN.toLocaleString('id-ID')} onChange={(e) => setTarget(parseAngka(e.target.value))} />
            </label>
            <label className="mt-6 block">
              <span className="mb-1.5 block text-sm font-semibold">Sudah terkumpul berapa? (opsional)</span>
              <input inputMode="numeric" className={inputClass} placeholder="0" value={saved ? parseAngka(saved).toLocaleString('id-ID') : ''} onChange={(e) => setSaved(e.target.value)} />
            </label>
            <p className="tulis mt-5 -rotate-2 text-[1.35rem]" aria-hidden>
              sedikit-sedikit, lama-lama jadi tiket
            </p>
          </div>
        )}

        <div className="mt-auto pt-8 pb-8">
          <button type="submit" disabled={!canNext} className="w-full rounded-2xl bg-nabawi py-4 text-[1.02rem] font-bold text-white shadow-[0_8px_18px_rgba(24,87,240,0.3)] disabled:opacity-40 disabled:shadow-none">
            {step === 3 ? 'Selesai' : 'Lanjut'}
          </button>
          {step !== 1 && (
            <button type="button" onClick={next} className="mt-2 w-full py-2.5 text-sm font-semibold text-redup">
              Lewati dulu
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
