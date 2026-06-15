import React from 'react';
import { Link } from 'react-router-dom';
import Encabezado from '../componentesSecciones/encabezado/encabezado';
import './paginaPublica.css';

function PaginaPublica() {
  return (
    <div className="publica-pagina">
      <Encabezado />

      {/* HERO */}
      <section className="publica-hero">
        <div className="publica-hero-contenido">
          <span className="publica-kicker">Tu progreso, hoyo a hoyo</span>
          <h1>Mejora tu juego ronda a ronda</h1>
          <p>
            Golf Tracker te ayuda a registrar tus partidas, calcular tu hándicap
            automáticamente y descubrir en qué parte de tu juego puedes ganar más golpes.
          </p>
          <div className="publica-hero-botones">
            <Link to="/registrarse" className="btn-publica btn-publica-primario">
              Crear cuenta gratis
            </Link>
            <Link to="/login" className="btn-publica btn-publica-secundario">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* CARACTERÍSTICAS */}
      <section className="publica-seccion">
        <h2 className="publica-titulo-seccion">Todo lo que necesitas para bajar tu hándicap</h2>
        <p className="publica-subtitulo-seccion">
          Una sola plataforma para anotar, analizar y entender tu evolución como golfista.
        </p>

        <div className="publica-grid-caracteristicas">
          <div className="publica-tarjeta">
            <span className="publica-icono">⛳</span>
            <h3>Registro de rondas</h3>
            <p>Anota tus golpes hoyo a hoyo al terminar cada partida, en cualquier dispositivo.</p>
          </div>

          <div className="publica-tarjeta">
            <span className="publica-icono">📈</span>
            <h3>Hándicap automático</h3>
            <p>Tu nivel se recalcula solo con cada ronda registrada, sin hojas de cálculo.</p>
          </div>

          <div className="publica-tarjeta">
            <span className="publica-icono">📊</span>
            <h3>Estadísticas y gráficas</h3>
            <p>Visualiza tu rendimiento por hoyo y detecta dónde pierdes más golpes respecto al par.</p>
          </div>

          <div className="publica-tarjeta">
            <span className="publica-icono">📍</span>
            <h3>Campos reales</h3>
            <p>Elige entre miles de campos de golf reales gracias a nuestra integración con datos oficiales.</p>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="publica-seccion publica-seccion-alterna">
        <h2 className="publica-titulo-seccion">Cómo funciona</h2>

        <div className="publica-pasos">
          <div className="publica-paso">
            <div className="publica-paso-numero">1</div>
            <h3>Crea tu cuenta</h3>
            <p>Regístrate en menos de un minuto, totalmente gratis.</p>
          </div>

          <div className="publica-paso">
            <div className="publica-paso-numero">2</div>
            <h3>Juega y registra</h3>
            <p>Después de cada ronda, introduce tus golpes por hoyo y el campo jugado.</p>
          </div>

          <div className="publica-paso">
            <div className="publica-paso-numero">3</div>
            <h3>Analiza tu progreso</h3>
            <p>Consulta tu hándicap, tu historial de rondas y tus gráficas de rendimiento.</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="publica-cta">
        <h2>¿Listo para empezar a mejorar?</h2>
        <p>Únete gratis y registra tu primera ronda hoy mismo.</p>
        <Link to="/registrarse" className="btn-publica btn-publica-primario">
          Crear cuenta gratis
        </Link>
      </section>

      <footer className="publica-footer">
        <p>⛳ Golf Tracker — Proyecto Fin de Grado (DAW)</p>
      </footer>
    </div>
  );
}

export default PaginaPublica;
