import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './encabezado.css'; // Asegúrate de importar el nuevo CSS

function Encabezado() {
  // Estado para controlar el menú hamburguesa en móviles
  const [menuAbierto, setMenuAbierto] = useState(false);

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  return (
    <header className="encabezado-container">
      {/* 1. Logotipo */}
      <div className="encabezado-logo">
          <span class="material-symbols-outlined">
            golf_course
          </span>
        <Link to="/paginaInicial"> GolfTracker</Link>
      </div>

      {/* 2. Botón Hamburguesa (Solo visible en móviles) */}
      <button className="menu-hamburguesa" onClick={toggleMenu}>
        {menuAbierto ? '✖' : '☰'}
      </button>

      {/* 3. Navegación y Botón (Escritorio + Menú Desplegable en Móvil) */}
      <nav className={`encabezado-nav ${menuAbierto ? 'abierto' : ''}`}>
        <ul className="nav-links">
          {/* Al hacer clic en un enlace en móvil, cerramos el menú */}
          <li><Link to="/funcionalidades" onClick={() => setMenuAbierto(false)}>Funcionalidades</Link></li>
          <li><Link to="/como-funciona" onClick={() => setMenuAbierto(false)}>Cómo Funciona</Link></li>
          <li><Link to="/precios" onClick={() => setMenuAbierto(false)}>Precios</Link></li>
        </ul>
        
        <div className="nav-botones">
          <Link to="/" className="btn-inicio-sesion" onClick={() => setMenuAbierto(false)}>
            Inicio de Sesión
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Encabezado;