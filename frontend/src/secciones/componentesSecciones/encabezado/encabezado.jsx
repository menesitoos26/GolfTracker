import React, { useState } from 'react';
// 1. IMPORTANTE: Importamos useLocation junto a Link
import { Link, useLocation } from 'react-router-dom';
import './encabezado.css';

function Encabezado() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  // 2. Inicializamos useLocation para saber en qué página estamos
  const location = useLocation();

  // --- CONFIGURACIÓN DE PRUEBA ---
  const usuarioLogueado = {
    nombre: 'Carlos Gómez',
    iniciales: 'CG',
    gmail: 'carlos@gmail.com',
    fotoPerfil: null
  };

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  return (
    <header className="encabezado-container">
      {/* 1. Logotipo */}
      <div className="encabezado-logo">
        <Link to="/paginaInicial">⛳ GolfTracker</Link>
      </div>

      {/* 2. Botón Hamburguesa (Móviles) */}
      <button className="menu-hamburguesa" onClick={toggleMenu}>
        {menuAbierto ? '✖' : '☰'}
      </button>

      {/* 3. Navegación */}
      <nav className={`encabezado-nav ${menuAbierto ? 'abierto' : ''}`}>
        <ul className="nav-links">
          <li><Link to="/funcionalidades" onClick={() => setMenuAbierto(false)}>Funcionalidades</Link></li>
          <li><Link to="/como-funciona" onClick={() => setMenuAbierto(false)}>Cómo Funciona</Link></li>
          <li><Link to="/precios" onClick={() => setMenuAbierto(false)}>Precios</Link></li>
        </ul>

        {/* 4. RENDIMIENTO CONDICIONAL */}
        {usuarioLogueado ? (
          /* Agrupamos la tarjeta y el botón en este div para alinearlos */
          <div className="encabezado-usuario-bloque">
            
            {/* Tarjeta de usuario */}
            <Link to="/paginaUsuario" onClick={() => setMenuAbierto(false)}>
              <div className="encabezado-usuario">
                <div className="usuario-info">
                  <span className="usuario-nombre">{usuarioLogueado.nombre}</span>
                  <span className="usuario-email">{usuarioLogueado.gmail}</span>
                </div>

                <div className="usuario-avatar">
                  {usuarioLogueado.fotoPerfil ? (
                    <img src={usuarioLogueado.fotoPerfil} alt={usuarioLogueado.nombre} />
                  ) : (
                    <div className="avatar-iniciales">{usuarioLogueado.iniciales}</div>
                  )}
                </div>
              </div>
            </Link>

            {/* 3. CONDICIONAL DE RUTA: Solo aparece si location.pathname es exactamente '/paginaUsuario' */}
            {location.pathname === '/paginaUsuario' && (
              <Link to="/editarPerfil" className="btn-editar-perfil" onClick={() => setMenuAbierto(false)}>
                Editar perfil 
              </Link>
            )}

          </div>
        ) : (
          /* SI NO EXISTE: Muestra el botón de iniciar sesión */
          <div className="nav-botones">
            <Link to="/" className="btn-inicio-sesion" onClick={() => setMenuAbierto(false)}>
              Inicio de Sesión
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Encabezado;