// Foto dan video (YouTube, TikTok, Instagram) untuk Panduan.
// Video tidak dimuat sampai diketuk: halaman tetap cepat, hemat kuota, dan pengguna tidak dilacak platform
// sebelum memutuskan menonton. Tanpa internet, tampil pesan dan tombol buka link.
import { useEffect, useState } from 'react'
import { formatMenit, infoMedia, type InfoMedia, type Media } from '../lib/konten'

const NAMA: Record<InfoMedia['jenis'], string> = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', foto: 'Foto' }
const src = (u: string) => (u.startsWith('/') ? `${import.meta.env.BASE_URL.replace(/\/$/, '')}${u}` : u)

function Play({ size = 22 }: { size?: number }) {
  return (
    <span className="grid place-items-center rounded-full bg-black/55 text-white" style={{ width: size * 2, height: size * 2 }} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
    </span>
  )
}

function Logo({ jenis, size = 28 }: { jenis: InfoMedia['jenis']; size?: number }) {
  if (jenis === 'tiktok')
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16.5 3c.4 2.2 1.8 3.7 4 4v3.1c-1.5 0-2.9-.4-4-1.2v6.3a6.2 6.2 0 1 1-6.2-6.2c.3 0 .6 0 .9.1v3.2a3 3 0 1 0 2.1 2.9V3h3.2z" /></svg>
  if (jenis === 'instagram')
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></svg>
}

const TILE_BG: Record<InfoMedia['jenis'], string> = {
  youtube: 'bg-tinta', tiktok: 'bg-tinta', instagram: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4]', foto: 'bg-batu',
}

/** Gambar kecil untuk daftar. */
export function Thumb({ media, className = '', time = true }: { media?: Media; className?: string; time?: boolean }) {
  const info = media ? infoMedia(media) : null
  const [rusak, setRusak] = useState(false)
  if (!info) return null
  const video = info.jenis !== 'foto'
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl text-white ${TILE_BG[info.jenis]} ${className}`}>
      {info.thumb && !rusak ? (
        <img src={src(info.thumb)} alt="" loading="lazy" onError={() => setRusak(true)} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className={info.jenis === 'foto' ? 'text-redup' : ''}><Logo jenis={info.jenis} size={22} /></span>
      )}
      {video && info.thumb && !rusak && <span className="relative"><Play size={11} /></span>}
      {time && info.mulai > 0 && (
        <span className="absolute right-1 bottom-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[0.7rem] font-semibold tabular-nums text-white">{formatMenit(info.mulai)}</span>
      )}
    </span>
  )
}

/** Satu media besar. Video baru dimuat setelah diketuk. */
export function Pemutar({ media, autoplayKey }: { media: Media; autoplayKey?: string }) {
  const info = infoMedia(media)
  const [main, setMain] = useState(false)
  const [offline, setOffline] = useState(false)
  const [rusak, setRusak] = useState(false)
  const [besar, setBesar] = useState(false)
  useEffect(() => { setMain(false); setOffline(false); setRusak(false) }, [media.url, media.mulai, autoplayKey])
  if (!info) return null

  const rasio = info.jenis === 'youtube' ? 'aspect-video' : info.jenis === 'foto' ? 'aspect-[4/3]' : 'aspect-[9/16] max-h-[70dvh] mx-auto'
  const ketuk = () => {
    if (info.jenis === 'foto') return setBesar(true)
    if (!navigator.onLine) return setOffline(true)
    setMain(true)
  }

  return (
    <figure>
      <div className={`relative w-full overflow-hidden rounded-2xl ${TILE_BG[info.jenis]} ${rasio}`} style={info.jenis === 'tiktok' || info.jenis === 'instagram' ? { maxWidth: 360 } : undefined}>
        {main ? (
          <iframe
            src={info.embed}
            title={media.keterangan || `Video ${NAMA[info.jenis]}`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button onClick={ketuk} className="absolute inset-0 grid place-items-center text-white" aria-label={info.jenis === 'foto' ? 'Perbesar foto' : `Putar video ${NAMA[info.jenis]}`}>
            {info.thumb && !rusak ? (
              <img src={src(info.thumb)} alt={media.keterangan ?? ''} onError={() => setRusak(true)} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              info.jenis === 'foto' ? (
                <span className="absolute inset-0 grid place-items-center text-redup"><Logo jenis="foto" size={44} /></span>
              ) : (
                <span className="absolute top-4 right-4 opacity-90"><Logo jenis={info.jenis} size={28} /></span>
              )
            )}
            {info.jenis !== 'foto' && <span className="relative"><Play size={26} /></span>}
            {info.jenis !== 'foto' && (
              <span className="absolute bottom-3 left-3 flex items-center gap-2 text-sm font-semibold">
                <span className="rounded-full bg-black/60 px-2.5 py-1">{NAMA[info.jenis]}</span>
                {info.mulai > 0 && <span className="rounded-full bg-black/60 px-2.5 py-1 tabular-nums">Mulai {formatMenit(info.mulai)}</span>}
              </span>
            )}
          </button>
        )}
        {offline && !main && (
          <div className="absolute inset-0 grid place-items-center bg-tinta/80 p-5 text-center text-white">
            <div>
              <p className="font-semibold">Video butuh internet</p>
              <p className="mt-1 text-sm text-white/75">Tulisan di bawah tetap bisa dibaca tanpa internet.</p>
              <button onClick={() => (navigator.onLine ? setMain(true) : setOffline(true))} className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-tinta">Coba lagi</button>
            </div>
          </div>
        )}
      </div>
      <figcaption className="mt-2 flex items-start justify-between gap-3 text-sm text-redup">
        <span>{media.keterangan}</span>
        {info.jenis !== 'foto' && (
          <a href={info.buka} target="_blank" rel="noreferrer" className="shrink-0 font-semibold text-nabawi">Buka di {NAMA[info.jenis]}</a>
        )}
      </figcaption>
      {besar && (
        <div role="dialog" aria-modal="true" aria-label="Foto" className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={() => setBesar(false)}>
          <img src={src(info.thumb)} alt={media.keterangan ?? ''} className="max-h-full max-w-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">Tutup</button>
        </div>
      )}
    </figure>
  )
}

/** Galeri: satu media besar, sisanya berupa deretan gambar kecil yang bisa diketuk. */
export function Galeri({ media }: { media: Media[] }) {
  const valid = media.filter((m) => infoMedia(m))
  const [aktif, setAktif] = useState(0)
  if (!valid.length) return null
  const i = Math.min(aktif, valid.length - 1)
  return (
    <div>
      <Pemutar media={valid[i]} autoplayKey={String(i)} />
      {valid.length > 1 && (
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1" role="list" aria-label="Foto dan video lain">
          {valid.map((m, j) => (
            <button key={m.url + j} role="listitem" onClick={() => setAktif(j)} aria-current={j === i}
              className={`shrink-0 rounded-xl p-0.5 ${j === i ? 'ring-2 ring-nabawi' : ''}`} aria-label={`Media ${j + 1}`}>
              <Thumb media={m} className="h-16 w-24" time={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
