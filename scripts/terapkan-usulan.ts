// Dipakai workflow "Usulan konten". Membaca issue dari GITHUB_EVENT_PATH (tidak pernah lewat shell),
// lalu: --cek  hanya memeriksa; tanpa flag  menerapkan ke src/data/rekomendasi.json.
// Hasil untuk komentar issue ditulis ke file yang ditunjuk HASIL (markdown). Kode keluar 1 kalau gagal.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { PENANDA_USULAN, terapkanUsulan, type Konten, type Usulan } from '../src/lib/konten.ts'

const cekSaja = process.argv.includes('--cek')
const hasilFile = process.env.HASIL || '/tmp/hasil.md'
const jsonFile = new URL('../src/data/rekomendasi.json', import.meta.url)

function selesai(ok: boolean, pesan: string, judul = '') {
  writeFileSync(hasilFile, pesan + '\n')
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `judul=${judul.replace(/[\r\n]/g, ' ').slice(0, 120)}\n`)
  process.exit(ok ? 0 : 1)
}

const ev = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH!, 'utf8'))
const body: string = ev.issue?.body ?? ''
if (!body.includes(PENANDA_USULAN)) selesai(false, 'Issue ini bukan usulan konten dari aplikasi.')
const m = body.match(/```json\s*\n([\s\S]*?)\n```/)
if (!m) selesai(false, 'Bagian data usulan tidak ditemukan. Kirim ulang usulan dari aplikasi tanpa mengubah teks di bagian "Data untuk sistem".')

let u: Usulan
try { u = JSON.parse(m![1]) } catch { selesai(false, 'Bagian data usulan rusak (mungkin teksnya terubah). Kirim ulang usulan dari aplikasi.') }

const konten: Konten = JSON.parse(readFileSync(jsonFile, 'utf8'))
const nama = (u!.data && ('nama' in u!.data ? u!.data.nama : u!.data.judul)) || u!.sasaran || ''
const judul = `${{ tambah: 'tambah', ubah: 'ubah', hapus: 'hapus' }[u!.aksi] ?? u!.aksi} ${u!.jenis === 'tempat' ? 'tempat' : 'tips'} "${nama}"`
try {
  const hasil = terapkanUsulan(konten, u!)
  if (cekSaja) selesai(true, `✅ Usulan ini aman (${judul}).\n\nMenunggu persetujuan. Pemilik repo: beri label **disetujui** untuk menerbitkannya.`, judul)
  writeFileSync(jsonFile, JSON.stringify(hasil, null, 2) + '\n')
  selesai(true, `🎉 Usulan diterapkan: ${judul}. Muncul di aplikasi sekitar 2 menit lagi.`, judul)
} catch (e) {
  selesai(false, `⚠️ Usulan belum bisa diterapkan:\n\n${(e as Error).message.split('\n').map((x) => '- ' + x).join('\n')}\n\nPerbaiki lewat aplikasi lalu kirim usulan baru.`, judul)
}
