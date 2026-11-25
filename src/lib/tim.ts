// Menu "Untuk tim" hanya muncul di HP anggota tim: yang pernah membuka halaman tim
// (Kelola konten / Admin lisensi) atau mengetuk tulisan versi di Pengaturan 7 kali.
const K = 'pum-tim'

export const adalahTim = () => { try { return localStorage.getItem(K) === '1' } catch { return false } }
export const tandaiTim = (aktif = true) => {
  try { if (aktif) localStorage.setItem(K, '1'); else localStorage.removeItem(K) } catch { /* mode privat */ }
}
