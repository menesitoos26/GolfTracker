import { useState, createContext, useContext } from 'react'
import './paginaInicial.css'
import { Routes, Route } from 'react-router-dom';
import GraficaPaginaInicial from '../componentesSecciones/graficaPaginaInicial/graficaPaginaInicial'
import Encabezado from '../componentesSecciones/encabezado/encabezado'
import DosBotonesYTextPagInicial from '../componentesSecciones/dosBotonesYTextPagInicial/dosBotonesYTextPagInicial'
import './paginaInicial.css'
function PaginaInicial() {


  // Imagina que estos datos vienen de tu Base de Datos o API
  const datosUsuarioEjemplo = [
    { handicap: 24.0 },
    { handicap: 24.5 },
    { handicap: 1 },
    { handicap: 40.0 },
    { handicap: 18 },
    { handicap: 30.4 },
    { handicap: 22.5 },
    { handicap: 22.5 },
  ];

  const handicapActualDelUsuario = 18.4;

  return (
    <div>
      <Encabezado></Encabezado>
      <DosBotonesYTextPagInicial></DosBotonesYTextPagInicial>
      {/* Usamos el componente pasándole las propiedades dinámicas */}
      <div className='parteGrafica'>
        <GraficaPaginaInicial
          datos={datosUsuarioEjemplo}
          handicapActual={handicapActualDelUsuario}
        />
      </div>

      <div className='fondoInicial'></div>
    </div>
  );
}
export default PaginaInicial