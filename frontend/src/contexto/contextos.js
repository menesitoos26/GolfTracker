import { createContext } from 'react'

// Los contextos viven en su propio fichero para no romper el Fast Refresh de
// Vite (un módulo con componentes no debe exportar además otras cosas).
export const AuthContext = createContext(null)
export const NotificacionesContext = createContext(null)
