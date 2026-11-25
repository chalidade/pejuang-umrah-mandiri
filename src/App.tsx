import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Persiapan from './pages/Persiapan'
import Biaya from './pages/Biaya'
import { lazy, Suspense } from 'react'
import Panduan, { IbadahDetail, TempatDetail, TipDetail } from './pages/Ibadah'
const Kelola = lazy(() => import('./pages/Kelola'))
const AdminLisensi = lazy(() => import('./pages/AdminLisensi'))
const Privasi = lazy(() => import('./pages/Privasi'))
import Penghitung from './pages/Penghitung'
import Darurat from './pages/Darurat'
import Pengaturan from './pages/Pengaturan'
import Bareng from './pages/Bareng'
import ScrollTop from './components/ScrollTop'
import Onboarding from './pages/Onboarding'
import { useTripRow } from './lib/hooks'
import { mulaiOtomatis } from './lib/akun'

mulaiOtomatis()

export default function App() {
  const trip = useTripRow()
  if (trip === undefined) return null
  // halaman tim konten bisa dibuka langsung tanpa melewati perkenalan
  const kelola = /\/(kelola|admin-lisensi|privasi)\/?$/.test(window.location.pathname)
  if (!trip?.onboarded && !kelola) return <Onboarding initial={trip} />

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <ScrollTop />
      <Routes>
        <Route
          path="admin-lisensi"
          element={
            <div className="mx-auto min-h-dvh max-w-md bg-marmer">
              <Suspense fallback={null}>
                <AdminLisensi />
              </Suspense>
            </div>
          }
        />
        <Route
          path="privasi"
          element={
            <div className="mx-auto min-h-dvh max-w-md bg-marmer">
              <Suspense fallback={null}>
                <Privasi />
              </Suspense>
            </div>
          }
        />
        <Route
          path="kelola"
          element={
            <div className="mx-auto min-h-dvh max-w-md bg-marmer">
              <Suspense fallback={null}>
                <Kelola />
              </Suspense>
            </div>
          }
        />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="persiapan" element={<Persiapan />} />
          <Route path="biaya" element={<Biaya />} />
          <Route path="ibadah" element={<Panduan />} />
          <Route path="ibadah/tempat/:id" element={<TempatDetail />} />
          <Route path="ibadah/tips/:id" element={<TipDetail />} />
          <Route path="ibadah/hitung" element={<Penghitung />} />
          <Route path="ibadah/:id" element={<IbadahDetail />} />
          <Route path="darurat" element={<Darurat />} />
          <Route path="pengaturan" element={<Pengaturan />} />
          <Route path="bareng" element={<Bareng />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
