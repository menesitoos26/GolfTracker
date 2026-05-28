import React from 'react';
import { Link } from "react-router-dom";
import Encabezado from '../componentesSecciones/encabezado/encabezado'
import './paginaUsuario.css'

function PaginaUsuario() {
    // Datos simulados del jugador para rellenar los recuadros
    const estadisticas = {
        handicap: 18.4,
        torneosJugados: 24,
        campos: 6
    };

    return (
        <>
            <Encabezado />

            <div className='usuarioSeccion'>
                {/* Contenedor principal de los recuadros de datos */}
                <div className="usuario-stats-grid">
                    
                    {/* Recuadro 1: Hándicap */}
                    <div className="tarjeta-dato">
                        <div className="tarjeta-contenido">
                            <h3>Hándicap Actual</h3>
                            <p className="tarjeta-valor">{estadisticas.handicap}</p>
                        </div>
                    </div>

                    {/* Recuadro 2: Torneos Jugados */}
                    <div className="tarjeta-dato">
                        <div className="tarjeta-contenido">
                            <h3>Rondas Jugadas</h3>
                            <p className="tarjeta-valor">{estadisticas.torneosJugados}</p>
                        </div>
                    </div>

                    {/* Recuadro 3: Mejor Resultado */}
                    <div className="tarjeta-dato">
                        <div className="tarjeta-contenido">
                            <h3>Campos</h3>
                            <p className="tarjeta-valor">{estadisticas.campos}</p>
                        </div>
                    </div>

                </div>
            </div>

            <div className='FondoUsuarioSeccion'></div> 
        </>
    )
}

export default PaginaUsuario;