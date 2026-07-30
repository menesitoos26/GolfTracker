import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { obtenerIniciales } from '../utils/formato'
import './encabezado.css'

const ENLACES_PRIVADOS = [
  { a: '/panel', texto: 'Panel' },
  { a: '/rondas/nueva', texto: 'Nueva ronda' },
  { a: '/rondas', texto: 'Mis rondas' },
  { a: '/torneos', texto: 'Torneos' },
  { a: '/estadisticas', texto: 'Estadísticas' },
]

export default function Encabezado() {
  const { usuario, autenticado, cerrarSesion } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const navegar = useNavigate()
  const ubicacion = useLocation()

  // Al cambiar de página cerramos el menú móvil.
  useEffect(() => setMenuAbierto(false), [ubicacion.pathname])

  const salir = () => {
    cerrarSesion()
    navegar('/', { replace: true })
  }

  return (
    <header className="encabezado">
      <div className="encabezado-interior">
        <Link to={autenticado ? '/panel' : '/'} className="encabezado-marca">
          <img src="/logo.png" alt="" width="38" height="38" />
          <span>CaddexGolf</span>
        </Link>

        <button
          type="button"
          className="encabezado-hamburguesa"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-expanded={menuAbierto}
          aria-controls="navegacion-principal"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        >
          {menuAbierto ? '✕' : '☰'}
        </button>

        <nav
          id="navegacion-principal"
          className={`encabezado-nav ${menuAbierto ? 'abierto' : ''}`}
        >
          {autenticado && (
            <ul className="encabezado-enlaces">
              {ENLACES_PRIVADOS.map((enlace) => (
                <li key={enlace.a}>
                  <NavLink
                    to={enlace.a}
                    end={enlace.a === '/rondas'}
                    className={({ isActive }) => (isActive ? 'activo' : '')}
                  >
                    {enlace.texto}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}

          {autenticado ? (
            <div className="encabezado-usuario">
              <Link to="/perfil" className="encabezado-perfil">
                <span className="encabezado-avatar" aria-hidden="true">
                  {obtenerIniciales(usuario?.name)}
                </span>
                <span className="encabezado-datos">
                  <span className="encabezado-nombre">{usuario?.name}</span>
                  <span className="encabezado-handicap">
                    Hcp {usuario?.handicap ?? '—'}
                  </span>
                </span>
              </Link>
              <button type="button" className="encabezado-salir" onClick={salir}>
                Salir
              </button>
            </div>
          ) : (
            <div className="encabezado-acceso">
              <Link to="/registro" className="btn btn-secundario btn-pequeno">
                Registrarse
              </Link>
              <Link to="/login" className="btn btn-primario btn-pequeno">
                Iniciar sesión
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
