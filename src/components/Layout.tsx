import { NavLink, Outlet } from 'react-router-dom'

const ICONS: Record<string, string> = {
  beranda: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',
  persiapan: 'M9 5h10M9 12h10M9 19h10M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2',
  biaya: 'M3 7h18v12H3zM3 11h18M7 15h3',
  ibadah: 'M12 3a9 9 0 109 9M12 7a5 5 0 105 5M12 12h.01',
  darurat: 'M12 3l9 16H3zM12 10v4M12 17h.01',
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
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-garis bg-white/95 backdrop-blur" aria-label="Navigasi utama">
        <ul className="flex">
          {NAV.map((n) => (
            <li key={n.to} className="flex-1">
              <NavLink
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 pt-2.5 pb-1 text-[0.7rem] font-semibold ${isActive ? 'text-nabawi' : 'text-redup'}`
                }
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={ICONS[n.icon]} />
                </svg>
                {n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
