import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initCanonicalHost } from './auth'

initCanonicalHost()

createRoot(document.getElementById('root')!).render(<App />)
