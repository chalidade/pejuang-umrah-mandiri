// Angka uang besar: "Rp" dan "jt" lebih kecil, dan boleh turun baris di HP dengan huruf besar.
export function Uang({ n, singkat = false, className = '' }: { n: number; singkat?: boolean; className?: string }) {
  const juta = singkat && Math.abs(n) >= 1_000_000
  const ribu = singkat && !juta && Math.abs(n) >= 1_000
  const satuan = juta ? 'jt' : ribu ? 'rb' : ''
  const angka = (juta ? n / 1_000_000 : ribu ? n / 1_000 : Math.round(n)).toLocaleString('id-ID', { maximumFractionDigits: singkat ? 1 : 0 })
  return (
    <span className={`inline-flex max-w-full flex-wrap items-baseline gap-x-[0.12em] ${className}`} aria-label={`Rp ${angka}${juta ? ' juta' : ribu ? ' ribu' : ''}`}>
      <span className="text-[0.55em]" aria-hidden>Rp</span>
      <span className="whitespace-nowrap" aria-hidden>{angka}</span>
      {satuan && <span className="text-[0.55em]" aria-hidden>{satuan}</span>}
    </span>
  )
}
