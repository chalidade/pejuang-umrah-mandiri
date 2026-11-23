import { NavLink, Outlet } from 'react-router-dom'

const ICONS: Record<string, string> = {
  beranda: 'M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z',
  persiapan: 'M10 6h10M10 12h10M10 18h10M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  biaya: 'M6 6h12a3 3 0 013 3v7a3 3 0 01-3 3H6a3 3 0 01-3-3V9a3 3 0 013-3zM3 10h18M15 15h2',
  ibadah: 'M4 5.5C7 4 10 4.500 12 6c2-1.500 5-2 8-.5V19c-3-1.500-6-1-8 .5-2-1.500-5-2-8-.5zM12 6v13.500',
  darurat: 'M12 4l9 15H3zM12 10v4M12 16.500v.5',
}

const NAV = [
  { to: '/', label: 'Beranda', icon: 'beranda' },
  { to: '/persiapan', label: 'Persiapan', icon: 'persiapan' },
  { to: '/biaya', label: 'Biaya', icon: 'biaya' },
  { to: '/ibadah', label: 'Panduan', icon: 'ibadah' },
  { to: '/darurat', label: 'Darurat', icon: 'darurat' },
]

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-marmer">
      <main className="flex-1 pb-28">
        <Outlet />
      </main>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-garis bg-white/95 backdrop-blur" aria-label="Navigasi utama">
        <ul className="flex px-2">
          {NAV.map((n) => (
            <li key={n.to} className="flex-1">
              <NavLink
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) => `flex flex-col items-center gap-1 pt-2.5 pb-1 text-[0.7rem] font-semibold ${isActive ? 'text-nabawi' : 'text-[#93a0b8]'}`}
              >
                {({ isActive }) => (
                  <>
                    <span className={`grid h-[30px] w-[52px] place-items-center rounded-full ${isActive ? 'bg-nabawi-muda' : ''}`}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d={ICONS[n.icon]} />
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
