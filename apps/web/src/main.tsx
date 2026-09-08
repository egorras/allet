import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './app/styles/global.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root is missing from index.html')

createRoot(rootElement).render(
  <StrictMode>
    <main className="p-6">
      <h1 className="text-xl font-semibold">Allet</h1>
    </main>
  </StrictMode>,
)
