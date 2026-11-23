// Dijalankan sebelum build. Kalau konten rusak, build berhenti dan versi lama tetap tayang.
import { readFileSync } from 'node:fs'
import { cekKonten } from '../src/lib/konten.ts'

const file = new URL('../src/data/rekomendasi.json', import.meta.url)
let data: unknown
try {
  data = JSON.parse(readFileSync(file, 'utf8'))
} catch (e) {
  console.error(`✗ src/data/rekomendasi.json tidak bisa dibaca: ${(e as Error).message}`)
  process.exit(1)
}
const masalah = cekKonten(data)
if (masalah.length) {
  console.error('✗ Konten Destinasi & Tips belum bisa diterbitkan:')
  for (const m of masalah) console.error('  - ' + m)
  process.exit(1)
}
console.log('✓ Konten Destinasi & Tips aman.')
