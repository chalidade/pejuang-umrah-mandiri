import { useState } from 'react'
import { exportCode, importCode, lastSync, shareMessage, type MergeResult } from '../lib/sync'
import { Button, PageHeader, inputClass } from '../components/ui'

const STEPS = [
  'Kamu ketuk "Kirim ke partner" dan kirim pesannya lewat WhatsApp.',
  'Partner menyalin pesan itu, menempelnya di sini, lalu ketuk Gabungkan.',
  'Partner mengirim balik datanya dengan cara yang sama, supaya dua HP sama persis.',
]

function summary(r: MergeResult) {
  const parts = [r.added && `${r.added} catatan baru`, r.updated && `${r.updated} diperbarui`, r.removed && `${r.removed} dihapus`].filter(Boolean)
  return parts.length ? `Berhasil digabung: ${parts.join(', ')}.` : 'Data kalian sudah sama. Tidak ada yang berubah.'
}

export default function Bareng() {
  const [sent, setSent] = useState('')
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const last = lastSync()

  const send = async (mode: 'share' | 'copy') => {
    const msg = shareMessage(await exportCode())
    if (mode === 'share' && navigator.share) {
      try {
        await navigator.share({ text: msg })
        setSent('Pesan siap dikirim ke partner.')
        return
      } catch {
        /* dibatalkan: lanjut salin */
      }
    }
    try {
      await navigator.clipboard.writeText(msg)
      setSent('Pesan tersalin. Tempel di chat partner.')
    } catch {
      setText(msg)
      setSent('Salin teks di kotak bawah secara manual, lalu kirim ke partner.')
    }
  }

  const merge = async () => {
    setBusy(true)
    try {
      setResult({ ok: true, msg: summary(await importCode(text)) })
      setText('')
    } catch {
      setResult({ ok: false, msg: 'Kode tidak dikenali. Salin seluruh pesan dari partner, lalu tempel lagi.' })
    }
    setBusy(false)
  }

  return (
    <div>
      <PageHeader title="Umroh bareng" subtitle="Samakan data dengan partner. Tanpa akun, tanpa server." back="/" />
      <div className="space-y-4 px-5">
        <ol className="space-y-2.5 rounded-[22px] bg-nabawi-muda p-4">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-3 text-[0.92rem] leading-snug">
              <span className="font-display grid h-6 w-6 shrink-0 place-items-center rounded-full bg-nabawi text-xs font-extrabold text-white">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>

        <section className="rounded-[22px] border border-garis p-4 shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
          <h2 className="text-lg font-bold">Kirim dataku</h2>
          <p className="mt-0.5 text-sm text-redup">Berisi tanggal, hotel, langkah persiapan, checklist, estimasi biaya, tabungan, dan pengeluaran.</p>
          <div className="mt-3 flex gap-2">
            <Button className="flex-1" onClick={() => send('share')}>
              Kirim ke partner
            </Button>
            <Button variant="ghost" onClick={() => send('copy')}>
              Salin
            </Button>
          </div>
          {sent && (
            <p className="mt-2.5 text-sm font-semibold text-nabawi" role="status">
              {sent}
            </p>
          )}
        </section>

        <section className="rounded-[22px] border border-garis p-4 shadow-[0_6px_18px_rgba(24,87,240,0.07)]">
          <h2 className="text-lg font-bold">Terima dari partner</h2>
          <p className="mt-0.5 text-sm text-redup">Tempel seluruh pesan yang dikirim partner.</p>
          <textarea
            rows={4}
            className={`${inputClass} mt-3 text-sm break-all`}
            placeholder="Tempel pesan di sini"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Pesan dari partner"
          />
          <Button className="mt-2 w-full" onClick={merge} disabled={!text.trim() || busy}>
            Gabungkan
          </Button>
          {result && (
            <p className={`mt-2.5 text-sm font-semibold ${result.ok ? 'text-nabawi' : 'text-bata'}`} role="status">
              {result.msg}
            </p>
          )}
        </section>

        <p className="tulis px-1 text-[1.35rem]">perubahan paling baru yang dipakai</p>
        <p className="px-1 text-xs leading-relaxed text-redup">
          Kalau kalian mengubah catatan yang sama, yang terakhir diubah yang menang. Info medis dan kontak darurat tidak ikut dikirim.
          {last && ` Terakhir digabung ${new Date(last).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}.`}
        </p>
      </div>
    </div>
  )
}
