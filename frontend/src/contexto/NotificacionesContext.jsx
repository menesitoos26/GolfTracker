import { useCallback, useMemo, useRef, useState } from 'react'
import { NotificacionesContext } from './contextos'
import './notificaciones.css'

const DURACION_MS = 4000

/** Sustituye a los `alert()` bloqueantes por avisos discretos y accesibles. */
export function NotificacionesProvider({ children }) {
  const [avisos, setAvisos] = useState([])
  const temporizadores = useRef(new Map())

  const cerrar = useCallback((id) => {
    setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id))
    const temporizador = temporizadores.current.get(id)
    if (temporizador) {
      clearTimeout(temporizador)
      temporizadores.current.delete(id)
    }
  }, [])

  const notificar = useCallback(
    (mensaje, tipo = 'info') => {
      const id = crypto.randomUUID()
      setAvisos((actuales) => [...actuales, { id, mensaje, tipo }])
      temporizadores.current.set(id, setTimeout(() => cerrar(id), DURACION_MS))
    },
    [cerrar],
  )

  const valor = useMemo(
    () => ({
      notificar,
      exito: (mensaje) => notificar(mensaje, 'exito'),
      error: (mensaje) => notificar(mensaje, 'error'),
    }),
    [notificar],
  )

  return (
    <NotificacionesContext.Provider value={valor}>
      {children}
      <div className="avisos-contenedor" role="status" aria-live="polite">
        {avisos.map((aviso) => (
          <div key={aviso.id} className={`aviso aviso-${aviso.tipo}`}>
            <span>{aviso.mensaje}</span>
            <button type="button" onClick={() => cerrar(aviso.id)} aria-label="Cerrar aviso">
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificacionesContext.Provider>
  )
}
