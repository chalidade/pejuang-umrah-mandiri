// Akun Google + cadangan otomatis ke server (Cloudflare Worker + D1, sama dengan server lisensi).
// Data tetap tersimpan di HP dulu (jalan offline), lalu dicadangkan ke akun saat online.
// Setelah aplikasi dipasang ulang, "Masuk dengan Google" memulihkan semua data, termasuk lisensi Pro.
// Nonaktif kalau server atau Client ID Google belum diatur, dan di aplikasi Android (WebView tidak didukung Google).
import { useSyncExternalStore } from 'react'
import { Capacitor } from '@capacitor/core'
import { importCode, kemas, keKode } from './sync'
import { aktivasi, kunciLisensi } from './lisensi'

const API = (import.meta.env.VITE_LISENSI_API ?? '').replace(/\/+$/, '')
// Client ID OAuth Google (bukan rahasia), project Google Cloud "pejuang-umrah"
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1037586807242-h6dk50ib1jk13jab71lv6hn07gdhmkg5.apps.googleusercontent.com'
export const AKUN_AKTIF = !!(API && GOOGLE_CLIENT_ID) && !Capacitor.isNativePlatform()

const K = 'pum-akun'
const K_DIPELAJARI = 'pum-dipelajari'
const INTERVAL = 2 * 60 * 1000

type Akun = { sesi: string; email: string; nama: string; tarik: number; jejak: string; terakhir: number }
type Status = 'diam' | 'menyimpan' | 'gagal'
type State = { akun: Akun | null; status: Status; pesan?: string }

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* mode privat */ } },
  del: (k: string) => { try { localStorage.removeItem(k) } catch { /* mode privat */ } },
}
const bacaAkun = (): Akun | null => { try { return JSON.parse(ls.get(K) ?? 'null') } catch { return null } }

let state: State = { akun: bacaAkun(), status: 'diam' }
const subs = new Set<() => void>()
const setState = (p: Partial<State>) => {
  state = { ...state, ...p }
  if ('akun' in p) { if (state.akun) ls.set(K, JSON.stringify(state.akun)); else ls.del(K) }
  subs.forEach((f) => f())
}
const ubahAkun = (p: Partial<Akun>) => state.akun && setState({ akun: { ...state.akun, ...p } })

async function panggil(path: string, init: RequestInit = {}) {
  let res: Response
  try {
    res = await fetch(API + path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(state.akun ? { Authorization: `Bearer ${state.akun.sesi}` } : {}), ...(init.headers ?? {}) },
    })
  } catch { throw new Error('Tidak bisa terhubung. Pastikan ada internet.') }
  const j = await res.json().catch(() => ({}))
  if (res.status === 401 && state.akun) { keluar(); throw new Error('Sesi habis. Masuk lagi dengan Google.') }
  if (!res.ok) throw new Error(j.error ?? 'Server sedang bermasalah. Coba lagi sebentar lagi.')
  return j
}

async function sha256(s: string) {
  const b = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}
const dipelajari = (): string[] => { try { return JSON.parse(ls.get(K_DIPELAJARI) ?? '[]') } catch { return [] } }

type Isi = { kode: string; ekstra?: { dipelajari?: string[]; kunci?: string } }

let berjalan: Promise<{ dipulihkan: boolean }> | null = null
/** Gabungkan cadangan di server ke HP ini, lalu unggah data terbaru kalau berubah. */
export function sinkron(opsi: { paksa?: boolean; pulihkanLisensi?: boolean } = {}) {
  if (!berjalan) berjalan = jalan(opsi).finally(() => { berjalan = null })
  return berjalan
}

async function jalan({ paksa = false, pulihkanLisensi = false }) {
  if (!AKUN_AKTIF || !state.akun) return { dipulihkan: false }
  if (!navigator.onLine) return { dipulihkan: false }
  let dipulihkan = false
  setState({ status: 'menyimpan', pesan: undefined })
  try {
    // 1. tarik
    const r = await panggil('/cadangan')
    const pertama = (state.akun?.tarik ?? 0) === 0 // pertama kali menarik di HP ini (mis. baru pasang ulang)
    if (r.data && r.diperbarui > (state.akun?.tarik ?? 0)) {
      const isi = JSON.parse(r.data) as Isi
      const hasil = await importCode(isi.kode, 'cadangan')
      dipulihkan = hasil.added + hasil.updated > 0
      const ids = isi.ekstra?.dipelajari ?? []
      if (ids.length) {
        ls.set(K_DIPELAJARI, JSON.stringify([...new Set([...dipelajari(), ...ids])]))
        window.dispatchEvent(new Event('pum-dipelajari'))
      }
      if ((pulihkanLisensi || pertama) && isi.ekstra?.kunci && !kunciLisensi()) {
        try { await aktivasi(isi.ekstra.kunci); dipulihkan = true } catch { /* mis. sudah di 2 HP lain: pengguna bisa aktifkan manual */ }
      }
      ubahAkun({ tarik: r.diperbarui })
    }
    // 2. unggah kalau berubah
    const isiLokal = await kemas('cadangan')
    const ekstra = { dipelajari: dipelajari(), kunci: kunciLisensi() }
    const jejak = await sha256(JSON.stringify({ isiLokal, ekstra }))
    if (paksa || jejak !== state.akun?.jejak) {
      const data = JSON.stringify({ kode: await keKode(isiLokal), ekstra } satisfies Isi)
      const u = await panggil('/cadangan', { method: 'PUT', body: JSON.stringify({ data }) })
      ubahAkun({ jejak, tarik: u.diperbarui, terakhir: Date.now() })
    } else ubahAkun({ terakhir: Date.now() })
    setState({ status: 'diam' })
  } catch (e) {
    setState({ status: 'gagal', pesan: (e as Error).message })
  }
  return { dipulihkan }
}

// ── Google Identity Services ─────────────────────────────────────────────
type Gis = {
  accounts: { id: {
    initialize: (o: Record<string, unknown>) => void
    renderButton: (el: HTMLElement, o: Record<string, unknown>) => void
    disableAutoSelect: () => void
  } }
}
let gis: Promise<Gis> | null = null
function muatGis(): Promise<Gis> {
  const w = window as unknown as { google?: Gis }
  if (w.google?.accounts?.id) return Promise.resolve(w.google)
  if (!gis) gis = new Promise((ok, no) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => (w.google ? ok(w.google) : no(new Error('Login Google gagal dimuat.')))
    s.onerror = () => { gis = null; no(new Error('Login Google butuh internet. Coba lagi saat online.')) }
    document.head.appendChild(s)
  })
  return gis
}

/** Pasang tombol resmi "Lanjutkan dengan Google" di elemen ini. */
export async function pasangTombol(el: HTMLElement, selesai: (hasil: { dipulihkan: boolean } | Error) => void) {
  const g = await muatGis()
  g.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    ux_mode: 'popup',
    auto_select: false,
    callback: async (r: { credential: string }) => {
      try { selesai(await masuk(r.credential)) } catch (e) { selesai(e as Error) }
    },
  })
  el.innerHTML = ''
  g.accounts.id.renderButton(el, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'id', width: Math.min(400, Math.max(200, el.clientWidth || 300)) })
}

export async function masuk(idToken: string) {
  const j = await panggil('/akun/masuk', { method: 'POST', body: JSON.stringify({ idToken }) })
  setState({ akun: { sesi: j.sesi, email: j.email, nama: j.nama, tarik: 0, jejak: '', terakhir: 0 } })
  return sinkron({ pulihkanLisensi: true })
}

export function keluar() {
  setState({ akun: null, status: 'diam', pesan: undefined })
  try { (window as unknown as { google?: Gis }).google?.accounts.id.disableAutoSelect() } catch { /* belum dimuat */ }
}

export async function hapusAkun() {
  await panggil('/akun', { method: 'DELETE' })
  keluar()
}

/** Cadangkan otomatis: saat dibuka, tiap 2 menit, saat aplikasi ditutup/disembunyikan, dan saat kembali online. */
let otomatis = false
export function mulaiOtomatis() {
  if (otomatis || !AKUN_AKTIF) return
  otomatis = true
  const jalan = () => { if (state.akun) sinkron() }
  setTimeout(jalan, 2000)
  setInterval(jalan, INTERVAL)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') jalan() })
  window.addEventListener('online', jalan)
}

export function useAkun() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => state)
}
