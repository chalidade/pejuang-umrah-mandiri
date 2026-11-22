import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

// Ikon aktif diisi penuh, ikon lain bergaris, seperti di mockup.
const ICONS: Record<string, (active: boolean) => ReactNode> = {
  beranda: (a) => <path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z" {...line} fill={a ? 'currentColor' : 'none'} />,
  persiapan: () => <path d="M10 6h10M10 12h10M10 18h10M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" {...line} />,
  biaya: (a) =>
    a ? (
      <>
        <rect x="3" y="6" width="18" height="13" rx="3" fill="currentColor" />
        <path d="M3 10.500h18" stroke="#fff" strokeWidth="1.600" />
      </>
    ) : (
      <>
        <rect x="3" y="6" width="18" height="13" rx="3" {...line} />
        <path d="M3 10h18M15 15h2" {...line} />
      </>
    ),
  ibadah: (a) => <circle cx="12" cy="12" r="8.200" fill="none" stroke="currentColor" strokeWidth={a ? 2.800 : 2.300} strokeDasharray="5.300 2.100" />,
  darurat: () => <path d="M12 4l9 15H3zM12 10v4M12 16.500v.5" {...line} />,
}

const NAV = [
  { to: '/', label: 'Beranda', icon: 'beranda' },
  { to: '/persiapan', label: 'Persiapan', icon: 'persiapan' },
  { to: '/biaya', label: 'Biaya', icon: 'biaya' },
  { to: '/ibadah', label: 'Ibadah', icon: 'ibadah' },
  { to: '/darurat', label: 'Darurat', icon: 'darurat' },
]

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-marmer">
      <main className="flex-1 pb-28">
        <Outlet />
      </main>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-garis bg-white" aria-label="Navigasi utama">
        <ul className="flex px-2">
          {NAV.map((n) => (
            <li key={n.to} className="flex-1">
              <NavLink to={n.to} end={n.to === '/'} className={({ isActive }) => `flex flex-col items-center gap-1 pt-2.5 pb-1 text-[0.69rem] font-semibold ${isActive ? 'text-nabawi' : 'text-[#93a0b8]'}`}>
                {({ isActive }) => (
                  <>
                    <span className={`grid h-[30px] w-[52px] place-items-center rounded-full ${isActive ? 'bg-nabawi-muda' : ''}`}>
                      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                        {ICONS[n.icon](isActive)}
                      </svg>
                    </span>
                    {n.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
