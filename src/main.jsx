import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/auth.css'
import './styles/layout.css'
import './styles/dashboard.css'
import './styles/components.css'
import './styles/books.css'
import './styles/members.css'
import './styles/issues.css'
import './styles/fines.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
