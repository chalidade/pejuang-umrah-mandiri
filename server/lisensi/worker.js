// Server lisensi Pejuang Umrah — Cloudflare Worker + D1.
// Lisensi sekali bayar seumur hidup, maksimal MAKS_HP perangkat per kunci.
//
// Publik
//   GET  /kunci-publik                  kunci publik untuk memeriksa token di aplikasi (ECDSA P-256, JWK)
//   POST /aktivasi  {kunci, perangkat, namaPerangkat?}  -> {token}
//   POST /cek       {kunci, perangkat}  -> {status: 'aktif' | 'dicabut' | 'tidak-terdaftar'}
// Admin (header Authorization: Bearer <ADMIN_KUNCI>)
//   GET  /admin/lisensi                 daftar lisensi + perangkat
//   POST /admin/lisensi {nama, kontak?, catatan?}  -> lisensi baru
//   POST /admin/cabut {kunci, alasan?} · /admin/pulihkan {kunci} · /admin/lepas {kunci, perangkat}
//
// Token = base64url(JSON payload) + "." + base64url(tanda tangan). Aplikasi memeriksanya tanpa internet.

const MAKS_HP = 2
const ASAL = ['https://pejuangumrah.my.id', 'https://www.pejuangumrah.my.id', 'https://chalidade.github.io', 'http://localhost:5173', 'http://localhost:4173', 'capacitor://localhost', 'https://localhost']
const HURUF = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // tanpa 0/O, 1/I agar tidak salah ketik

const SKEMA = [
  `CREATE TABLE IF NOT EXISTS lisensi (kunci TEXT PRIMARY KEY, nama TEXT NOT NULL, kontak TEXT, catatan TEXT, dibuat INTEGER NOT NULL, dicabut INTEGER, alasan TEXT)`,
  `CREATE TABLE IF NOT EXISTS perangkat (kunci TEXT NOT NULL, perangkat TEXT NOT NULL, nama TEXT, aktif INTEGER NOT NULL, terakhir INTEGER NOT NULL, PRIMARY KEY (kunci, perangkat))`,
  `CREATE TABLE IF NOT EXISTS pengaturan (nama TEXT PRIMARY KEY, nilai TEXT NOT NULL)`,
]
let siap = null

// ── util ─────────────────────────────────────────────────────────────────
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const enc = (s) => new TextEncoder().encode(s)
const rapikanKunci = (s) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^PUM/, '')
const formatKunci = (raw) => `PUM-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`
const validPerangkat = (s) => typeof s === 'string' && /^[\w-]{8,64}$/.test(s)

function kunciBaru() {
  const b = crypto.getRandomValues(new Uint8Array(12))
  return formatKunci([...b].map((x) => HURUF[x % HURUF.length]).join(''))
}

function cors(req) {
  const o = req.headers.get('Origin')
  return {
    'Access-Control-Allow-Origin': o && ASAL.includes(o) ? o : ASAL[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}
const json = (req, data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(req) } })
const gagal = (req, pesan, status) => json(req, { error: pesan }, status)

async function init(env) {
  if (!siap) siap = env.DB.batch(SKEMA.map((s) => env.DB.prepare(s))).catch((e) => { siap = null; throw e })
  return siap
}

async function pasanganKunci(env) {
  const row = await env.DB.prepare(`SELECT nilai FROM pengaturan WHERE nama = 'kunci-tanda-tangan'`).first()
  if (row) return JSON.parse(row.nilai)
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const nilai = { privat: await crypto.subtle.exportKey('jwk', kp.privateKey), publik: await crypto.subtle.exportKey('jwk', kp.publicKey) }
  // INSERT OR IGNORE: kalau dua permintaan pertama datang bersamaan, yang tersimpan duluan yang dipakai
  await env.DB.prepare(`INSERT OR IGNORE INTO pengaturan (nama, nilai) VALUES ('kunci-tanda-tangan', ?)`).bind(JSON.stringify(nilai)).run()
  const simpan = await env.DB.prepare(`SELECT nilai FROM pengaturan WHERE nama = 'kunci-tanda-tangan'`).first()
  return JSON.parse(simpan.nilai)
}

async function tandaTangan(env, payload) {
  const { privat } = await pasanganKunci(env)
  const key = await crypto.subtle.importKey('jwk', privat, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const body = b64u(enc(JSON.stringify(payload)))
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc(body))
  return `${body}.${b64u(sig)}`
}

async function baca(req) {
  try { return await req.json() } catch { return {} }
}

// ── handler ──────────────────────────────────────────────────────────────
export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) })
    const url = new URL(req.url)
    const p = url.pathname.replace(/\/+$/, '') || '/'
    try {
      await init(env)

      if (p === '/' && req.method === 'GET') return json(req, { ok: true, layanan: 'Lisensi Pejuang Umrah' })

      if (p === '/kunci-publik' && req.method === 'GET') {
        const { publik } = await pasanganKunci(env)
        return json(req, { jwk: { kty: publik.kty, crv: publik.crv, x: publik.x, y: publik.y } })
      }

      if (p === '/aktivasi' && req.method === 'POST') {
        const b = await baca(req)
        const raw = rapikanKunci(b.kunci)
        if (raw.length !== 12) return gagal(req, 'Kunci lisensi tidak lengkap. Formatnya seperti PUM-ABCD-EFGH-JKLM.', 400)
        if (!validPerangkat(b.perangkat)) return gagal(req, 'Data perangkat tidak dikenali. Muat ulang aplikasi lalu coba lagi.', 400)
        const kunci = formatKunci(raw)
        const lis = await env.DB.prepare('SELECT * FROM lisensi WHERE kunci = ?').bind(kunci).first()
        if (!lis) return gagal(req, 'Kunci lisensi tidak ditemukan. Periksa lagi huruf dan angkanya.', 404)
        if (lis.dicabut) return gagal(req, 'Kunci lisensi ini sudah tidak berlaku. Hubungi tim Pejuang Umrah.', 403)
        const sekarang = Date.now()
        const ada = await env.DB.prepare('SELECT 1 FROM perangkat WHERE kunci = ? AND perangkat = ? AND aktif = 1').bind(kunci, b.perangkat).first()
        if (!ada) {
          const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM perangkat WHERE kunci = ? AND aktif = 1').bind(kunci).first()
          if (n >= MAKS_HP) return gagal(req, `Kunci ini sudah dipakai di ${MAKS_HP} HP. Lepaskan dari HP lama lewat Pengaturan, atau hubungi tim Pejuang Umrah.`, 409)
        }
        await env.DB.prepare(
          `INSERT INTO perangkat (kunci, perangkat, nama, aktif, terakhir) VALUES (?1, ?2, ?3, 1, ?4)
           ON CONFLICT (kunci, perangkat) DO UPDATE SET aktif = 1, terakhir = ?4, nama = COALESCE(?3, nama)`,
        ).bind(kunci, b.perangkat, String(b.namaPerangkat ?? '').slice(0, 60) || null, sekarang).run()
        const token = await tandaTangan(env, { k: kunci, d: b.perangkat, n: lis.nama, t: sekarang })
        return json(req, { token, kunci, nama: lis.nama })
      }

      if (p === '/cek' && req.method === 'POST') {
        const b = await baca(req)
        const kunci = formatKunci(rapikanKunci(b.kunci))
        const lis = await env.DB.prepare('SELECT dicabut FROM lisensi WHERE kunci = ?').bind(kunci).first()
        if (!lis || lis.dicabut) return json(req, { status: 'dicabut' })
        const hp = validPerangkat(b.perangkat) && (await env.DB.prepare('SELECT 1 FROM perangkat WHERE kunci = ? AND perangkat = ? AND aktif = 1').bind(kunci, b.perangkat).first())
        if (!hp) return json(req, { status: 'tidak-terdaftar' })
        await env.DB.prepare('UPDATE perangkat SET terakhir = ? WHERE kunci = ? AND perangkat = ?').bind(Date.now(), kunci, b.perangkat).run()
        return json(req, { status: 'aktif' })
      }

      if (p === '/lepas' && req.method === 'POST') {
        // pengguna melepas lisensi dari HP-nya sendiri (misalnya mau ganti HP)
        const b = await baca(req)
        const kunci = formatKunci(rapikanKunci(b.kunci))
        if (validPerangkat(b.perangkat)) await env.DB.prepare('UPDATE perangkat SET aktif = 0 WHERE kunci = ? AND perangkat = ?').bind(kunci, b.perangkat).run()
        return json(req, { ok: true })
      }

      if (p.startsWith('/admin/')) {
        const auth = req.headers.get('Authorization') ?? ''
        if (!env.ADMIN_KUNCI || auth !== `Bearer ${env.ADMIN_KUNCI}`) return gagal(req, 'Kunci admin salah.', 401)

        if (p === '/admin/lisensi' && req.method === 'GET') {
          const { results: lis } = await env.DB.prepare('SELECT * FROM lisensi ORDER BY dibuat DESC').all()
          const { results: hp } = await env.DB.prepare('SELECT * FROM perangkat WHERE aktif = 1 ORDER BY terakhir DESC').all()
          return json(req, { lisensi: lis.map((l) => ({ ...l, perangkat: hp.filter((h) => h.kunci === l.kunci) })), maksHp: MAKS_HP })
        }
        if (p === '/admin/lisensi' && req.method === 'POST') {
          const b = await baca(req)
          const nama = String(b.nama ?? '').trim().slice(0, 80)
          if (!nama) return gagal(req, 'Nama pembeli wajib diisi.', 400)
          let kunci = kunciBaru()
          while (await env.DB.prepare('SELECT 1 FROM lisensi WHERE kunci = ?').bind(kunci).first()) kunci = kunciBaru()
          await env.DB.prepare('INSERT INTO lisensi (kunci, nama, kontak, catatan, dibuat) VALUES (?, ?, ?, ?, ?)')
            .bind(kunci, nama, String(b.kontak ?? '').trim().slice(0, 80) || null, String(b.catatan ?? '').trim().slice(0, 200) || null, Date.now()).run()
          return json(req, { kunci, nama }, 201)
        }
        const b = await baca(req)
        const kunci = formatKunci(rapikanKunci(b.kunci))
        if (p === '/admin/cabut') {
          await env.DB.prepare('UPDATE lisensi SET dicabut = ?, alasan = ? WHERE kunci = ?').bind(Date.now(), String(b.alasan ?? '').slice(0, 200) || null, kunci).run()
          return json(req, { ok: true })
        }
        if (p === '/admin/pulihkan') {
          await env.DB.prepare('UPDATE lisensi SET dicabut = NULL, alasan = NULL WHERE kunci = ?').bind(kunci).run()
          return json(req, { ok: true })
        }
        if (p === '/admin/lepas') {
          await env.DB.prepare('UPDATE perangkat SET aktif = 0 WHERE kunci = ? AND perangkat = ?').bind(kunci, String(b.perangkat ?? '')).run()
          return json(req, { ok: true })
        }
      }
      return gagal(req, 'Alamat tidak dikenali.', 404)
    } catch (e) {
      console.error(e)
      return gagal(req, 'Server lisensi sedang bermasalah. Coba lagi sebentar lagi.', 500)
    }
  },
}
