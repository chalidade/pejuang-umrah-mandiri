// Kartu produk rekomendasi dengan link afiliasi. Link dibuka di browser/aplikasi toko.
import { namaToko, type Produk } from '../lib/konten'

export const CATATAN_AFILIASI = 'Sebagian link adalah link afiliasi. Kami bisa dapat komisi kecil dari toko, harganya tetap sama untukmu.'
const REL = 'sponsored noopener noreferrer'

function Tas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

export function ProdukList({ items, judul = 'Rekomendasi produk' }: { items: Produk[] | undefined; judul?: string }) {
  const xs = (items ?? []).filter((p) => namaToko(p.url))
  if (!xs.length) return null
  return (
    <section className="space-y-3">
      <h2 className="pt-2 text-lg font-bold tracking-tight">{judul}</h2>
      <ul className="space-y-2">
        {xs.map((p) => {
          const toko = namaToko(p.url)
          return (
            <li key={p.nama + p.url}>
              <a href={p.url} target="_blank" rel={REL} className="flex items-center gap-3 rounded-2xl border border-garis bg-white p-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emas-muda text-tinta"><Tas /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug">{p.nama}</span>
                  {p.catatan && <span className="block text-sm leading-snug text-redup">{p.catatan}</span>}
                  <span className="mt-0.5 block text-sm">
                    {p.harga && <span className="font-semibold tabular-nums">{p.harga} · </span>}
                    <span className="font-semibold text-nabawi">Lihat di {toko}</span>
                  </span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-redup">{CATATAN_AFILIASI}</p>
    </section>
  )
}

/** Tombol kecil "Beli" di sebelah item checklist. */
export function BeliKecil({ produk }: { produk: Produk }) {
  return (
    <a href={produk.url} target="_blank" rel={REL} aria-label={`Beli ${produk.nama} di ${namaToko(produk.url)}`}
      className="shrink-0 rounded-full bg-emas-muda px-3 py-1 text-xs font-bold text-tinta">
      Beli
    </a>
  )
}
