// Warna bar status HP saat aplikasi dipasang. Bawaannya putih supaya menyatu dengan halaman;
// layar yang latarnya biru (sambutan) mengganti sementara.
import { useEffect } from 'react'

export const WARNA_BAR = '#FFFFFF'

export function useWarnaBar(warna: string) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) return
    meta.content = warna
    return () => { meta.content = WARNA_BAR }
  }, [warna])
}
