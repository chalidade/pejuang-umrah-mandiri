// Materi ibadah yang sudah ditandai "sudah dipelajari". Disimpan di HP ini saja.
import { useEffect, useState } from 'react'

const KEY = 'pum-dipelajari'
const baca = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }

export function useDipelajari() {
  const [ids, setIds] = useState<string[]>(baca)
  useEffect(() => {
    const on = () => setIds(baca())
    window.addEventListener('storage', on); window.addEventListener('pum-dipelajari', on)
    return () => { window.removeEventListener('storage', on); window.removeEventListener('pum-dipelajari', on) }
  }, [])
  const toggle = (id: string) => {
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* mode privat */ }
    setIds(next); window.dispatchEvent(new Event('pum-dipelajari'))
  }
  return { ids, toggle, sudah: (id: string) => ids.includes(id) }
}
