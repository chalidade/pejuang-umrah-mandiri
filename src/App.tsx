import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Persiapan from './pages/Persiapan'
import Biaya from './pages/Biaya'
import Ibadah, { IbadahDetail } from './pages/Ibadah'
import Penghitung from './pages/Penghitung'
import Darurat from './pages/Darurat'
import Pengaturan from './pages/Pengaturan'
import ScrollTop from './components/ScrollTop'

export default function App() {
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
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
