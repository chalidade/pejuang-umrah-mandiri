import { useEffect, type ReactNode } from 'react'

/** Panel bawah (bottom sheet) untuk form ubah. */
export default function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-tinta/40" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="pb-safe max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white px-5 pt-3" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-garis" aria-hidden />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-sm font-semibold text-redup">
            Tutup
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
