import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import FloatingScreen from './components/screen/FloatingScreen'

// Lets CSS adapt the title bar per OS (e.g. room for the macOS traffic lights)
document.documentElement.dataset.platform = window.electron.process.platform

// A floating screen window loads the same page with #/screen/<projectId>
const floatingScreen = /^#\/screen\/(.+)$/.exec(location.hash)
if (floatingScreen) document.documentElement.classList.add('floating-window')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {floatingScreen ? (
      <FloatingScreen projectId={decodeURIComponent(floatingScreen[1])} />
    ) : (
      <App />
    )}
  </StrictMode>
)
