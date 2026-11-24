// Ikon dan warna untuk kategori pengeluaran. Satu ketebalan garis, sudut membulat.
import type { Category } from '../db'

type Def = { label: string; d: string; fg: string; bg: string }
export const IKON: Record<string, Def> = {
  pesawat: { label: 'Pesawat', fg: '#1857F0', bg: '#E9F1FF', d: '<path d="M3 13.5 21 6l-4 14-5-5-4 3v-5z"/>' },
  dokumen: { label: 'Dokumen', fg: '#5B4BDB', bg: '#EFEDFF', d: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>' },
  hotel: { label: 'Hotel', fg: '#0E7C86', bg: '#E2F6F7', d: '<path d="M3 20V7M3 14h18v6M21 20v-6a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="11" r="2"/>' },
  bus: { label: 'Transport', fg: '#1F8A5B', bg: '#E4F6EC', d: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 21v-3M16 21v-3"/><circle cx="8" cy="14.5" r=".6" fill="currentColor"/><circle cx="16" cy="14.5" r=".6" fill="currentColor"/>' },
  makan: { label: 'Makan', fg: '#D6453A', bg: '#FDECEA', d: '<path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2.2 0-3.5 2.5-3.5 6v4H17"/>' },
  jajan: { label: 'Jajan', fg: '#C7731A', bg: '#FFF2E2', d: '<path d="M5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M11 3v3M14 3v3"/>' },
  tas: { label: 'Perlengkapan', fg: '#8A5A2B', bg: '#F6EEE6', d: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>' },
  kesehatan: { label: 'Kesehatan', fg: '#D23A6E', bg: '#FDE9F0', d: '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5h6v2M12 11v5M9.5 13.5h5"/>' },
  masjid: { label: 'Ibadah', fg: '#0B1F4B', bg: '#E6EAF3', d: '<path d="M4 21V11a8 6 0 0 1 16 0v10zM12 5V2M9 21v-4a3 3 0 0 1 6 0v4"/>' },
  hadiah: { label: 'Oleh-oleh', fg: '#2E9E5B', bg: '#E5F6EB', d: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3 8 4.5 9.5 8 12 8zM12 8s1.5-5 4-3.5S14.5 8 12 8z"/>' },
  sedekah: { label: 'Sedekah', fg: '#DB4C8C', bg: '#FDEBF4', d: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>' },
  internet: { label: 'Internet', fg: '#2F6FE4', bg: '#E8F0FD', d: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r=".8" fill="currentColor"/>' },
  belanja: { label: 'Belanja', fg: '#B5541C', bg: '#FCEDE3', d: '<path d="M3 4h2l2.4 11h11L21 7H6.2"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>' },
  laundry: { label: 'Laundry', fg: '#3A86A8', bg: '#E5F3F9', d: '<path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3a4 4 0 0 1-8 0z"/>' },
  uang: { label: 'Uang', fg: '#2D7D46', bg: '#E5F4EA', d: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M16 12.5h2M3 9.5h18"/>' },
  lainnya: { label: 'Lainnya', fg: '#66748F', bg: '#EEF1F6', d: '<circle cx="6" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18" cy="12" r="1.4" fill="currentColor"/>' },
}
export const KUNCI_IKON = Object.keys(IKON)

const BAWAAN: Record<string, string> = {
  tiket: 'pesawat', visa: 'dokumen', hotel: 'hotel', transport: 'bus', makan: 'makan', perlengkapan: 'tas',
  kesehatan: 'kesehatan', ibadah: 'masjid', 'oleh-oleh': 'hadiah', lainnya: 'lainnya',
}
const KATA: [RegExp, string][] = [
  [/tiket|pesawat|terbang/i, 'pesawat'], [/visa|dokumen|paspor|asuransi/i, 'dokumen'], [/hotel|penginapan|apartemen/i, 'hotel'],
  [/transport|bus|taksi|kereta|uber|careem/i, 'bus'], [/jajan|kopi|snack|minum/i, 'jajan'], [/makan|konsumsi|kuliner/i, 'makan'],
  [/sedekah|infaq|infak|zakat|wakaf/i, 'sedekah'], [/internet|esim|sim|kuota|pulsa/i, 'internet'], [/oleh|hadiah|souvenir/i, 'hadiah'],
  [/obat|sehat|vaksin|dokter/i, 'kesehatan'], [/laundry|cuci/i, 'laundry'], [/belanja|shopping/i, 'belanja'],
  [/ibadah|dam|umroh|umrah/i, 'masjid'], [/perlengkapan|koper|ihram|baju/i, 'tas'], [/tabung|uang|tukar/i, 'uang'],
]

/** Ikon yang dipakai sebuah kategori: pilihan pengguna, bawaan, ditebak dari nama, atau "lainnya". */
export function kunciIkon(c?: Pick<Category, 'uid' | 'name' | 'icon'>): string {
  if (!c) return 'lainnya'
  if (c.icon && IKON[c.icon]) return c.icon
  const def = c.uid?.startsWith('default:cat:') ? BAWAAN[c.uid.slice('default:cat:'.length)] : undefined
  if (def) return def
  return KATA.find(([re]) => re.test(c.name))?.[1] ?? 'lainnya'
}

export function IkonKategori({ kunci, size = 40 }: { kunci: string; size?: number }) {
  const k = IKON[kunci] ?? IKON.lainnya
  return (
    <span className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, background: k.bg, color: k.fg }} aria-hidden>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: k.d }} />
    </span>
  )
}
export const warnaIkon = (kunci: string) => (IKON[kunci] ?? IKON.lainnya).fg
