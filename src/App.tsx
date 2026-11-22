import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Persiapan from './pages/Persiapan'
import Biaya from './pages/Biaya'
import Ibadah, { IbadahDetail } from './pages/Ibadah'
import Penghitung from './pages/Penghitung'
import Darurat from './pages/Darurat'
import Pengaturan from './pages/Pengaturan'
import Bareng from './pages/Bareng'
import ScrollTop from './components/ScrollTop'
import Onboarding from './pages/Onboarding'
import { useTripRow } from './lib/hooks'

export default function App() {
  const trip = useTripRow()
  if (trip === undefined) return null
  if (!trip?.onboarded) return <Onboarding initial={trip} />

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <ScrollTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="persiapan" element={<Persiapan />} />
          <Route path="biaya" element={<Biaya />} />
          <Route path="ibadah" element={<Ibadah />} />
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
