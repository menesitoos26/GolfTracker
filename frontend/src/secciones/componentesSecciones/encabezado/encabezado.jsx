import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './encabezado.css'

function Encabezado() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Intentamos obtener el usuario del localStorage
    const guardado = localStorage.getItem('usuarioGolfTracker');
    if (guardado) {
      setUsuarioLogueado(JSON.parse(guardado));
    }
  }, []);

  // función para cerrar sesión (borrar la memoria)
  const cerrarSesion = () => {
    localStorage.removeItem('usuarioGolfTracker'); // Borramos datos
    setUsuarioLogueado(null); // Limpiamos la vista
    setMenuAbierto(false);
    navigate('/'); // Lo mandamos al login
  };

  const obtenerIniciales = (nombre) => {
    // si el nombre no existe o no es texto, devolvemos un carácter vacío o "?"
    if (!nombre || typeof nombre !== 'string') return "?";

    // Quitamos espacios en blanco extremos y dividimos el nombre por CUALQUIER espacio intermedio
    const palabras = nombre.trim().split(/\s+/);

  
    if (palabras.length === 1) {
      return palabras[0].charAt(0).toUpperCase();
    }
    // Tomamos la inicial de la primera palabra y la inicial de la SEGUNDA palabra
    const primeraInicial = palabras[0].charAt(0);
    const segundaInicial = palabras[1].charAt(0);

    return (primeraInicial + segundaInicial).toUpperCase();
  };

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  return (
    <header className="encabezado-container">

      <div className="encabezado-logo">
        <img src="/logo.png" alt="Logo GolfTracker" />
        <Link to="/paginaInicial"> GolfTracker</Link>
      </div>


      <button className="menu-hamburguesa" onClick={toggleMenu}>
        {menuAbierto ? '✖' : '☰'}
      </button>

      {/* Navegación */}
      <nav className={`encabezado-nav ${menuAbierto ? 'abierto' : ''}`}>
        <ul className="nav-links">
          <li><Link to="/misRondas" onClick={() => setMenuAbierto(false)}>Mis Rondas</Link></li>
        </ul>
        <ul className="nav-links">
          <li><Link to="/nuevaRonda" onClick={() => setMenuAbierto(false)}>Nueva Rondas</Link></li>
        </ul>

        {usuarioLogueado ? (
          <div className="encabezado-usuario-bloque">
            <Link to="/paginaUsuario" onClick={() => setMenuAbierto(false)}>
              <div className="encabezado-usuario">
                <div className="usuario-info">
                  <span className="usuario-nombre">{usuarioLogueado.name}</span>
                  <span className="usuario-email">{usuarioLogueado.email}</span>
                </div>
                <div className="usuario-avatar">
                  <div className="avatar-iniciales">
                    {obtenerIniciales(usuarioLogueado.name)}
                  </div>
                </div>
              </div>
            </Link>

            {location.pathname === '/paginaUsuario' && (
              <Link to="/editarPerfil" className="btn-editar-perfil" onClick={() => setMenuAbierto(false)}>
                Editar perfil
              </Link>
            )}

            <button onClick={cerrarSesion} className="btn-cerrar-sesion" style={{ marginLeft: '15px', background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' }}>
              Salir
            </button>
          </div>
        ) : (
          
          <div className="nav-botones">
            <Link to="/" className="btn-iniciar-sesion">Iniciar Sesión</Link>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Encabezado;