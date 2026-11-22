/** Tombol hapus kecil (×) untuk item di dalam daftar. */
export default function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={`Hapus ${label}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#93a0b8] active:bg-bata/10 active:text-bata">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" aria-hidden>
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}
