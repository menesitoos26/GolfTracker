import React from 'react';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import './dosBotonesYTextPagInicial.css';

// Ahora el componente recibe "datos" y el "handicapActual" como propiedades (props)
function DosBotonesYTextPagInicial() {
  

  return (
    <div className="divSeccionDosBotonesYTextPagInicial">
      <div className='tituloSeccionDosBotonesYTextPagInicial'>Mejora tu juego ronda a ronda</div>
      <div className='textoSeccionDosBotonesYTextPagInicial'>Registra tus partidas, analiza tus estadisticas e indentifica tus puntos debiles para bajar tu handicap</div>
      <div className='botonesSeccionDosBotonesYTextPagInicial'>
        <button>Empezar gratis</button>
        <button>Ver demo</button>
      </div>

    </div>
  );
}

export default DosBotonesYTextPagInicial;