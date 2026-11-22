import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function PageHeader({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: string; action?: ReactNode }) {
  return (
    <header className="pt-safe px-5 pb-4">
      <div className="flex items-start justify-between gap-3 pt-5">
        <div className="min-w-0">
          {back && (
            <Link to={back} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-nabawi">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Kembali
            </Link>
          )}
          <h1 className="text-[1.65rem] leading-tight font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-[0.95rem] text-redup">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div role="tablist" className="mx-5 mb-4 flex rounded-[14px] bg-batu p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-[11px] px-3 py-2 text-[0.84rem] font-bold transition-colors ${
            value === o.value ? 'bg-white text-tinta shadow-[0_2px_6px_rgba(11,31,75,0.1)]' : 'text-redup'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-redup">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-garis bg-white px-3.5 py-3 text-base outline-none focus:border-nabawi focus:ring-2 focus:ring-nabawi/20'

export function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-nabawi text-white active:bg-nabawi-tua',
    ghost: 'bg-transparent text-nabawi border border-garis active:bg-batu',
    danger: 'bg-transparent text-bata border border-bata/30 active:bg-bata/10',
  }[variant]
  return (
    <button {...props} className={`rounded-xl px-4 py-3 text-[0.95rem] font-semibold transition-colors disabled:opacity-40 ${styles} ${className}`}>
      {children}
    </button>
  )
}

export function Section({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`px-5 ${className}`}>
      {title && <h2 className="mb-3 text-lg font-bold tracking-tight">{title}</h2>}
      {children}
    </section>
  )
}

export function Check({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
        checked ? 'border-nabawi bg-nabawi text-white' : 'border-garis bg-white'
      }`}
    >
      {checked && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 12l5 5 9-10" />
        </svg>
      )}
    </span>
  )
}

export function Progress({ value, tone = 'nabawi' }: { value: number; tone?: 'nabawi' | 'emas' }) {
  const pct = Math.max(0, Math.min(100, value * 100))
  return (
    <div className="h-2 overflow-hidden rounded-full bg-batu" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${tone === 'emas' ? 'bg-emas' : 'bg-nabawi'}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
