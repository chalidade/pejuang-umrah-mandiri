// Lisensi Pro: sekali bayar, seumur hidup, maksimal 2 HP per kunci.
// Aktivasi butuh internet sekali; setelah itu bukti aktivasi (token bertanda tangan server)
// diperiksa di HP tanpa internet. Saat online, aplikasi sesekali mengecek apakah kunci dicabut.
// Kalau alamat server belum diatur (VITE_LISENSI_API kosong), semua fitur terbuka.
import { useSyncExternalStore } from 'react'

const API = (import.meta.env.VITE_LISENSI_API ?? '').replace(/\/+$/, '')
const PUB_BUILD = import.meta.env.VITE_LISENSI_PUBKEY ?? ''
export const LISENSI_AKTIF = !!API
export const BELI_URL = import.meta.env.VITE_LISENSI_BELI ?? ''
export const ADMIN_API = API

/** Batas versi gratis. */
export const GRATIS = { setoran: 3, pengeluaran: 5, langkahPenuh: 3 }

const K_TOKEN = 'pum-lisensi'
const K_HP = 'pum-perangkat'
const K_PUB = 'pum-lisensi-pub'
const K_CEK = 'pum-lisensi-cek'
const SEHARI = 24 * 60 * 60 * 1000

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* mode privat */ } },
  del: (k: string) => { try { localStorage.removeItem(k) } catch { /* mode privat */ } },
}

export function perangkatId(): string {
  let id = ls.get(K_HP)
  if (!id) {
    id = 'hp-' + Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => b.toString(16).padStart(2, '0')).join('')
    ls.set(K_HP, id)
  }
  return id
}

function namaPerangkat() {
  const ua = navigator.userAgent
  const m = ua.match(/Android [\d.]+; ([^;)]+)/) || ua.match(/(iPhone|iPad)/)
  return (m?.[1] ?? (/Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : 'Browser')).trim().slice(0, 60)
}

type Payload = { k: string; d: string; n: string; t: number }
type State = { status: 'memeriksa' | 'gratis' | 'pro'; kunci?: string; nama?: string; baru?: boolean }

let state: State = { status: LISENSI_AKTIF ? 'memeriksa' : 'pro' }
const subs = new Set<() => void>()
const setState = (s: State) => { state = s; subs.forEach((f) => f()) }

const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0))

async function kunciPublik(): Promise<CryptoKey | null> {
  const raw = PUB_BUILD || ls.get(K_PUB)
  if (!raw) return null
  try {
    return await crypto.subtle.importKey('jwk', JSON.parse(raw), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
  } catch { return null }
}

async function periksaToken(token: string): Promise<Payload | null> {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const key = await kunciPublik()
  if (!key) return null
  try {
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, unb64u(sig), new TextEncoder().encode(body))
    if (!ok) return null
    const p = JSON.parse(new TextDecoder().decode(unb64u(body))) as Payload
    return p.d === perangkatId() ? p : null
  } catch { return null }
}

async function panggil(path: string, body: unknown) {
  let res: Response
  try {
    // kalau login Google, kirim sesi supaya HP lama dengan akun yang sama bisa digantikan (pasang ulang aplikasi)
    let sesi = ''
    try { sesi = JSON.parse(localStorage.getItem('pum-akun') ?? 'null')?.sesi ?? '' } catch { /* abaikan */ }
    res = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(sesi ? { Authorization: `Bearer ${sesi}` } : {}) }, body: JSON.stringify(body) })
  } catch {
    throw new Error('Tidak bisa terhubung. Pastikan ada internet, lalu coba lagi.')
  }
  const j = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(j.error ?? 'Server lisensi sedang bermasalah. Coba lagi sebentar lagi.')
  return j
}

async function cekBerkala(kunci: string) {
  if (!navigator.onLine) return
  const terakhir = Number(ls.get(K_CEK) ?? 0)
  if (Date.now() - terakhir < SEHARI) return
  try {
    const { status } = await panggil('/cek', { kunci, perangkat: perangkatId() })
    ls.set(K_CEK, String(Date.now()))
    if (status !== 'aktif') { ls.del(K_TOKEN); setState({ status: 'gratis' }) }
  } catch { /* offline atau server sibuk: coba lagi lain kali */ }
}

let mulai = false
function init() {
  if (mulai || !LISENSI_AKTIF) return
  mulai = true
  const token = ls.get(K_TOKEN)
  if (!token) return setState({ status: 'gratis' })
  periksaToken(token).then((p) => {
    if (!p) { setState({ status: 'gratis' }); return }
    setState({ status: 'pro', kunci: p.k, nama: p.n })
    cekBerkala(p.k)
  })
}

export async function aktivasi(kunci: string) {
  const j = await panggil('/aktivasi', { kunci, perangkat: perangkatId(), namaPerangkat: namaPerangkat() })
  if (!PUB_BUILD) {
    const r = await fetch(API + '/kunci-publik').then((x) => x.json()).catch(() => null)
    if (r?.jwk) ls.set(K_PUB, JSON.stringify(r.jwk))
  }
  const p = await periksaToken(j.token)
  if (!p) throw new Error('Bukti aktivasi tidak valid. Coba lagi, atau hubungi tim Pejuang Umrah.')
  ls.set(K_TOKEN, j.token)
  ls.set(K_CEK, String(Date.now()))
  setState({ status: 'pro', kunci: p.k, nama: p.n, baru: true })
  return p
}

/** Kunci lisensi yang aktif di HP ini (untuk dicadangkan ke akun). */
export const kunciLisensi = () => (state.status === 'pro' ? state.kunci : undefined)

/** Tutup ucapan selamat setelah aktivasi. */
export const tutupUcapan = () => setState({ ...state, baru: false })

/** Lepas lisensi dari HP ini supaya bisa dipakai di HP lain. */
export async function lepas() {
  const k = state.kunci
  if (k && navigator.onLine) { try { await panggil('/lepas', { kunci: k, perangkat: perangkatId() }) } catch { /* tetap lepas di HP */ } }
  ls.del(K_TOKEN)
  setState({ status: 'gratis' })
}

export function useLisensi() {
  init()
  const s = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => state)
  // selama memeriksa (sepersekian detik), anggap Pro supaya pemilik lisensi tidak melihat kunci berkedip
  return { ...s, pro: s.status !== 'gratis', aktif: LISENSI_AKTIF }
}
