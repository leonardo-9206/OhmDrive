import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import 'katex/dist/katex.min.css'
import './index.css'
import App from './App.jsx'

// Register offline-first PWA service worker with silent auto-updates
registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
