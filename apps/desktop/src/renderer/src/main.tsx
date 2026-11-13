import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Lets CSS adapt the title bar per OS (e.g. room for the macOS traffic lights)
document.documentElement.dataset.platform = window.electron.process.platform

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
