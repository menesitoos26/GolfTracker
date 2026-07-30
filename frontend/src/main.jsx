import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexto/AuthContext'
import { NotificacionesProvider } from './contexto/NotificacionesContext'
import './index.css'
import './estilos/componentes.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <NotificacionesProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NotificacionesProvider>
    </BrowserRouter>
  </StrictMode>,
)
