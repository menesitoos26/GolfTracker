import React, { useState } from 'react';
import './misRondas.css'; // Asegúrate de que la ruta sea correcta según tus carpetas
import  Encabezado from '../componentesSecciones/encabezado/encabezado';
function MisRondas() {
    const [rondas, setRondas] = useState([
        { id: 1, campo: 'Club de Campo', fecha: '15 may 2026', golpes: 88, plusMinus: '+16', putts: 34 },
        { id: 2, campo: 'La Moraleja', fecha: '8 may 2026', golpes: 82, plusMinus: '+10', putts: 30 },
        { id: 3, campo: 'Real Club Sevilla', fecha: '1 may 2026', golpes: 91, plusMinus: '+19', putts: 36 }
    ]);

    const gestionarFiltro = () => {
        alert("¡Filtros en desarrollo!");
    };

    return (
      <>
      <Encabezado />
      
        <div className="contenedor-rondas">
            <div className="cabecera-rondas">
                <h2 className="titulo-rondas">Mis rondas</h2>
                <button onClick={gestionarFiltro} className="boton-filtrar">
                    ⏳ Filtrar
                </button>
            </div>

            <div className="contenedor-tabla">
                <table className="tabla-rondas">
                    <thead>
                        <tr>
                            <th className="th-rondas text-left">Campo</th>
                            <th className="th-rondas">Fecha</th>
                            <th className="th-rondas">Golpes</th>
                            <th className="th-rondas">+/- Par</th>
                            <th className="th-rondas">Putts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rondas.map((ronda) => (
                            <tr key={ronda.id}>
                                <td className="td-rondas text-left text-bold">{ronda.campo}</td>
                                <td className="td-rondas text-muted">{ronda.fecha}</td>
                                <td className="td-rondas text-bold">{ronda.golpes}</td>
                                <td className="par-destacado td-rondas">{ronda.plusMinus}</td>
                                <td className="td-rondas text-muted">{ronda.putts}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        </>
    );
}

export default MisRondas;