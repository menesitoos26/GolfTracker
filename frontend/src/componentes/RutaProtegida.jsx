import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Cargando from './Cargando'

/** Deja pasar sólo a los usuarios autenticados. */
export function RutaProtegida() {
  const { autenticado, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) return <Cargando texto="Comprobando tu sesión…" />

  if (!autenticado) {
    // Guardamos a dónde iba para devolverlo ahí tras iniciar sesión.
    return <Navigate to="/login" state={{ destino: ubicacion.pathname }} replace />
  }

  return <Outlet />
}

/** Para login y registro: si ya hay sesión, no tiene sentido mostrarlos. */
export function RutaSoloInvitados() {
  const { autenticado, cargando } = useAuth()

  if (cargando) return <Cargando texto="Comprobando tu sesión…" />
  if (autenticado) return <Navigate to="/panel" replace />

  return <Outlet />
}
