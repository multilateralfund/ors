import './instrumentation.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('main')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)