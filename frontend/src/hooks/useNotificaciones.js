import { useContext } from 'react'
import { NotificacionesContext } from '../contexto/contextos'

export function useNotificaciones() {
  const contexto = useContext(NotificacionesContext)
  if (!contexto) {
    throw new Error('useNotificaciones debe usarse dentro de <NotificacionesProvider>.')
  }
  return contexto
}
