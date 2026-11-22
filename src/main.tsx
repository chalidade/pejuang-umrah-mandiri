import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/wix-madefor-text'
import '@fontsource-variable/wix-madefor-display'
import '@fontsource-variable/caveat'
import '@fontsource/amiri/400.css'
import './index.css'
import './lib/install'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
