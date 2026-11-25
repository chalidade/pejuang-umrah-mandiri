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
// Akun & cadangan (Login Google, untuk semua pengguna)
//   POST   /akun/masuk {idToken}          -> {sesi, email, nama}   (idToken = Google ID token)
//   GET    /cadangan                       -> {data, diperbarui}    (header Authorization: Bearer <sesi>)
//   PUT    /cadangan {data, diperbarui}    -> {ok}
//   DELETE /akun                           hapus akun + cadangan
//
// Token = base64url(JSON payload) + "." + base64url(tanda tangan). Aplikasi memeriksanya tanpa internet.

const MAKS_HP = 2
const ASAL = ['https://pejuangumrah.my.id', 'https://www.pejuangumrah.my.id', 'https://chalidade.github.io', 'http://localhost:5173', 'http://localhost:4173', 'capacitor://localhost', 'https://localhost']
const HURUF = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // tanpa 0/O, 1/I agar tidak salah ketik

const SESI_HARI = 365
const MAKS_CADANGAN = 1_000_000 // karakter
const SKEMA = [
  `CREATE TABLE IF NOT EXISTS lisensi (kunci TEXT PRIMARY KEY, nama TEXT NOT NULL, kontak TEXT, catatan TEXT, dibuat INTEGER NOT NULL, dicabut INTEGER, alasan TEXT)`,
  `CREATE TABLE IF NOT EXISTS perangkat (kunci TEXT NOT NULL, perangkat TEXT NOT NULL, nama TEXT, aktif INTEGER NOT NULL, terakhir INTEGER NOT NULL, PRIMARY KEY (kunci, perangkat))`,
  `CREATE TABLE IF NOT EXISTS pengaturan (nama TEXT PRIMARY KEY, nilai TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS akun (sub TEXT PRIMARY KEY, email TEXT, nama TEXT, dibuat INTEGER NOT NULL, terakhir INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cadangan (sub TEXT PRIMARY KEY, data TEXT NOT NULL, diperbarui INTEGER NOT NULL, ukuran INTEGER NOT NULL)`,
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}
const json = (req, data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(req) } })
const gagal = (req, pesan, status) => json(req, { error: pesan }, status)

async function init(env) {
  if (!siap) siap = env.DB.batch(SKEMA.map((s) => env.DB.prepare(s)))
    // kolom akun di perangkat: HP yang diaktifkan sambil login Google. Gagal = kolom sudah ada.
    .then(() => env.DB.prepare('ALTER TABLE perangkat ADD COLUMN akun TEXT').run().catch(() => {}))
    .catch((e) => { siap = null; throw e })
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

const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0))
const dariJson = (bytes) => JSON.parse(new TextDecoder().decode(bytes))

// ── Google ID token ──────────────────────────────────────────────────────
let jwksCache = { kunci: null, sampai: 0 }
async function kunciGoogle() {
  if (jwksCache.kunci && Date.now() < jwksCache.sampai) return jwksCache.kunci
  const r = await fetch('https://www.googleapis.com/oauth2/v3/certs')
  const j = await r.json()
  const umur = Number((r.headers.get('cache-control') ?? '').match(/max-age=(\d+)/)?.[1] ?? 3600)
  jwksCache = { kunci: j.keys, sampai: Date.now() + umur * 1000 }
  return j.keys
}

async function periksaGoogle(env, idToken) {
  // mode uji lokal (hanya kalau MODE_UJI=1 di .dev.vars): "uji:<sub>:<email>"
  if (env.MODE_UJI === '1' && typeof idToken === 'string' && idToken.startsWith('uji:')) {
    const [, sub, email] = idToken.split(':')
    return { sub, email, name: email?.split('@')[0] }
  }
  if (!env.GOOGLE_CLIENT_ID) throw new Error('Login Google belum diatur di server.')
  try { return await periksaJwt(env, idToken) } catch { return null }
}

async function periksaJwt(env, idToken) {
  const [h, b, sig] = String(idToken ?? '').split('.')
  if (!h || !b || !sig) return null
  const head = dariJson(unb64u(h))
  if (head.alg !== 'RS256') return null
  const jwk = (await kunciGoogle()).find((k) => k.kid === head.kid)
  if (!jwk) return null
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
  if (!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, unb64u(sig), enc(`${h}.${b}`)))) return null
  const c = dariJson(unb64u(b))
  const detik = Date.now() / 1000
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(c.iss)) return null
  if (c.aud !== env.GOOGLE_CLIENT_ID || c.exp < detik || c.iat > detik + 300 || !c.sub) return null
  if (c.email && c.email_verified === false) return null
  return c
}

// ── Sesi (ditandatangani kunci server yang sama dengan lisensi) ──────────
async function periksaSesi(env, req) {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  try {
    const { publik } = await pasanganKunci(env)
    const key = await crypto.subtle.importKey('jwk', publik, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    if (!(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, unb64u(sig), enc(body)))) return null
    const p = dariJson(unb64u(body))
    if (!p.s || !(p.x > Date.now())) return null
    return p
  } catch { return null }
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
        const sesi = await periksaSesi(env, req)
        const akun = sesi?.s ?? null
        const lis = await env.DB.prepare('SELECT * FROM lisensi WHERE kunci = ?').bind(kunci).first()
        if (!lis) return gagal(req, 'Kunci lisensi tidak ditemukan. Periksa lagi huruf dan angkanya.', 404)
        if (lis.dicabut) return gagal(req, 'Kunci lisensi ini sudah tidak berlaku. Hubungi tim Pejuang Umrah.', 403)
        const sekarang = Date.now()
        const ada = await env.DB.prepare('SELECT 1 FROM perangkat WHERE kunci = ? AND perangkat = ? AND aktif = 1').bind(kunci, b.perangkat).first()
        if (!ada) {
          const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM perangkat WHERE kunci = ? AND aktif = 1').bind(kunci).first()
          // HP yang dulu diaktifkan dengan akun Google yang sama (mis. aplikasi dipasang ulang) dipindah ke HP ini
          if (n >= MAKS_HP && akun) {
            await env.DB.prepare('UPDATE perangkat SET aktif = 0 WHERE kunci = ? AND akun = ? AND aktif = 1').bind(kunci, akun).run()
          }
          const { n: sisa } = await env.DB.prepare('SELECT COUNT(*) AS n FROM perangkat WHERE kunci = ? AND aktif = 1').bind(kunci).first()
          if (sisa >= MAKS_HP) return gagal(req, `Kunci ini sudah dipakai di ${MAKS_HP} HP. Lepaskan dari HP lama lewat Pengaturan, atau hubungi tim Pejuang Umrah.`, 409)
        }
        await env.DB.prepare(
          `INSERT INTO perangkat (kunci, perangkat, nama, aktif, terakhir, akun) VALUES (?1, ?2, ?3, 1, ?4, ?5)
           ON CONFLICT (kunci, perangkat) DO UPDATE SET aktif = 1, terakhir = ?4, nama = COALESCE(?3, nama), akun = COALESCE(?5, akun)`,
        ).bind(kunci, b.perangkat, String(b.namaPerangkat ?? '').slice(0, 60) || null, sekarang, akun).run()
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

      if (p === '/akun/masuk' && req.method === 'POST') {
        const b = await baca(req)
        let g
        try { g = await periksaGoogle(env, b.idToken) } catch (e) { return gagal(req, e.message, 503) }
        if (!g) return gagal(req, 'Login Google tidak valid. Coba masuk lagi.', 401)
        const sekarang = Date.now()
        await env.DB.prepare(
          `INSERT INTO akun (sub, email, nama, dibuat, terakhir) VALUES (?1, ?2, ?3, ?4, ?4)
           ON CONFLICT (sub) DO UPDATE SET email = ?2, nama = ?3, terakhir = ?4`,
        ).bind(g.sub, g.email ?? null, g.name ?? null, sekarang).run()
        const sesi = await tandaTangan(env, { s: g.sub, e: g.email ?? '', x: sekarang + SESI_HARI * 864e5 })
        return json(req, { sesi, email: g.email ?? '', nama: g.name ?? '' })
      }

      if (p === '/cadangan' || p === '/akun') {
        const sesi = await periksaSesi(env, req)
        if (!sesi) return gagal(req, 'Sesi habis. Masuk lagi dengan Google.', 401)
        if (p === '/cadangan' && req.method === 'GET') {
          const r = await env.DB.prepare('SELECT data, diperbarui FROM cadangan WHERE sub = ?').bind(sesi.s).first()
          return json(req, { data: r?.data ?? null, diperbarui: r?.diperbarui ?? 0 })
        }
        if (p === '/cadangan' && req.method === 'PUT') {
          const b = await baca(req)
          if (typeof b.data !== 'string' || !b.data) return gagal(req, 'Data cadangan kosong.', 400)
          if (b.data.length > MAKS_CADANGAN) return gagal(req, 'Data terlalu besar untuk dicadangkan.', 413)
          const t = Date.now()
          await env.DB.prepare(
            `INSERT INTO cadangan (sub, data, diperbarui, ukuran) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT (sub) DO UPDATE SET data = ?2, diperbarui = ?3, ukuran = ?4`,
          ).bind(sesi.s, b.data, t, b.data.length).run()
          return json(req, { ok: true, diperbarui: t })
        }
        if (p === '/akun' && req.method === 'DELETE') {
          await env.DB.batch([
            env.DB.prepare('DELETE FROM cadangan WHERE sub = ?').bind(sesi.s),
            env.DB.prepare('DELETE FROM akun WHERE sub = ?').bind(sesi.s),
            env.DB.prepare('UPDATE perangkat SET akun = NULL WHERE akun = ?').bind(sesi.s),
          ])
          return json(req, { ok: true })
        }
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
