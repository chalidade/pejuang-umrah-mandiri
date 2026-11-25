// Kebijakan privasi. Bisa dibuka tanpa melewati perkenalan (dipakai Google Login dan Play Store).
import { PageHeader } from '../components/ui'

const DIPERBARUI = '25 November 2026'
const KONTAK = 'chalidade@gmail.com'

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="pt-3 text-lg font-bold tracking-tight">{judul}</h2>
      <div className="space-y-2 text-[0.97rem] leading-relaxed">{children}</div>
    </section>
  )
}

export default function Privasi() {
  return (
    <article className="mx-auto max-w-md pb-16">
      <PageHeader title="Kebijakan privasi" subtitle={`Pejuang Umrah Mandiri · diperbarui ${DIPERBARUI}`} back="/pengaturan" />
      <div className="space-y-2 px-5">
        <p className="text-[0.97rem] leading-relaxed">Pejuang Umrah Mandiri membantu kamu menyiapkan umroh mandiri. Halaman ini menjelaskan data apa yang kami simpan, di mana, dan bagaimana kamu menghapusnya.</p>

        <Bagian judul="Data di HP-mu">
          <p>Catatan persiapan, checklist, estimasi biaya, tabungan, pengeluaran, info hotel, info medis, dan kontak darurat tersimpan di HP-mu. Aplikasi tetap bisa dipakai tanpa internet.</p>
        </Bagian>

        <Bagian judul="Cadangan dengan akun Google (pilihan)">
          <p>Kalau kamu memilih <b>Masuk dengan Google</b>, kami menerima nama, alamat email, dan ID akun Google-mu untuk mengenali akunmu. Kami tidak meminta akses ke Gmail, Drive, kontak, atau data Google lainnya.</p>
          <p>Setelah masuk, data perjalananmu (termasuk info medis dan kontak darurat yang kamu isi), daftar materi yang sudah dipelajari, dan kunci lisensi Pro dicadangkan ke server kami di Cloudflare, supaya bisa dipulihkan saat ganti HP atau memasang ulang aplikasi.</p>
          <p>Kamu bisa menghapus akun dan seluruh cadangan kapan saja lewat <b>Pengaturan → Cadangan data → Hapus akun dan cadangan</b>. Data di HP-mu tidak ikut terhapus.</p>
        </Bagian>

        <Bagian judul="Lisensi Pro">
          <p>Saat kamu membeli Pro, tim kami mencatat nama dan nomor WhatsApp pembeli untuk membuat dan mengirim kunci. Saat kunci diaktifkan, server menyimpan ID acak perangkat dan jenis HP supaya satu kunci bisa dipakai di maksimal 2 HP.</p>
        </Bagian>

        <Bagian judul="Umroh bareng">
          <p>Fitur ini membuat kode berisi data perjalanan yang kamu kirim sendiri lewat WhatsApp atau aplikasi lain. Kode tidak melewati server kami. Info medis dan kontak darurat tidak ikut di kode itu.</p>
        </Bagian>

        <Bagian judul="Layanan pihak lain">
          <p>Video YouTube, TikTok, dan Instagram baru dimuat saat kamu mengetuknya, dan tunduk pada kebijakan privasi layanan tersebut. Link produk di aplikasi bisa berupa link afiliasi; toko tujuan dapat mencatat bahwa kamu datang dari aplikasi ini.</p>
        </Bagian>

        <Bagian judul="Yang tidak kami lakukan">
          <p>Kami tidak menjual data pribadimu, tidak memasang iklan, dan tidak memakai data cadanganmu untuk tujuan lain selain menyimpan dan memulihkannya untukmu.</p>
        </Bagian>

        <Bagian judul="Hubungi kami">
          <p>Pertanyaan atau permintaan hapus data: <a className="font-semibold text-nabawi underline" href={`mailto:${KONTAK}`}>{KONTAK}</a></p>
        </Bagian>
      </div>
    </article>
  )
}
