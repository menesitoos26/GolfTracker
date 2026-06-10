import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './encabezado.css'

function Encabezado() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  // 1. Iniciamos el usuario en null por defecto
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // 2. AÑADIMOS ESTE useEffect: Se ejecuta automáticamente al cargar el encabezado
  useEffect(() => {
    // Intentamos obtener el usuario del localStorage
    const guardado = localStorage.getItem('usuarioGolfTracker');
    if (guardado) {
      setUsuarioLogueado(JSON.parse(guardado));
    }
  }, []);

  // 3. Añadimos una función para cerrar sesión (borrar la memoria)
  const cerrarSesion = () => {
    localStorage.removeItem('usuarioGolfTracker'); // Borramos datos
    setUsuarioLogueado(null); // Limpiamos la vista
    setMenuAbierto(false);
    navigate('/'); // Lo mandamos al login
  };

  const obtenerIniciales = (nombreCompleto) => {
    if (!nombreCompleto) return "";
    return nombreCompleto
      .split(" ")
      .map(palabra => palabra[0])
      .join("")
      .toUpperCase();
  };

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };
  return (
    <header className="encabezado-container">
      {/* Logotipo */}
      <div className="encabezado-logo">
        <img src="/logo.png" alt="Logo GolfTracker" />
        <Link to="/paginaInicial"> GolfTracker</Link>
      </div>

      {/* Botón Hamburguesa (Móviles) */}
      <button className="menu-hamburguesa" onClick={toggleMenu}>
        {menuAbierto ? '✖' : '☰'}
      </button>

      {/* Navegación */}
      <nav className={`encabezado-nav ${menuAbierto ? 'abierto' : ''}`}>
        <ul className="nav-links">
          <li><Link to="/misRondas" onClick={() => setMenuAbierto(false)}>Mis Rondas</Link></li>
        </ul>

        {/* RENDIMIENTO CONDICIONAL REAL */}
        {/* --- Cambia esta parte del renderizado --- */}
        {usuarioLogueado ? (
          // SI EXISTE EL USUARIO, pintamos la información
          <div className="encabezado-usuario-bloque">
            <Link to="/paginaUsuario" onClick={() => setMenuAbierto(false)}>
              <div className="encabezado-usuario">
                <div className="usuario-info">
                  <span className="usuario-nombre">{usuarioLogueado.name}</span>
                  <span className="usuario-email">{usuarioLogueado.email}</span>
                </div>
                <div className="usuario-avatar">
                  <div className="avatar-iniciales">
                    {/* Asegúrate de tener la función obtenerIniciales definida */}
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
          // SI NO EXISTE (es null), mostramos un botón de acceso o simplemente nada
          <div className="nav-botones">
            <Link to="/" className="btn-iniciar-sesion">Iniciar Sesión</Link>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Encabezado;