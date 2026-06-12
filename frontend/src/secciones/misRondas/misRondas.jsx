import React, { useState, useEffect } from 'react';
import './misRondas.css'; 
import Encabezado from '../componentesSecciones/encabezado/encabezado';

function MisRondas() {
    const [rondas, setRondas] = useState([]);
    const [cargando, setCargando] = useState(true);

    const cargarRondas = async () => {
        const usuarioGuardado = localStorage.getItem('usuarioGolfTracker');
        if (!usuarioGuardado) {
            setCargando(false);
            return;
        }

        const usuario = JSON.parse(usuarioGuardado);
        try {
            const response = await fetch(`/api/rondas/${usuario.id}`);
            if (response.ok) {
                const data = await response.json();
                setRondas(data);
            }
        } catch (error) {
            console.error("Error cargando rondas:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarRondas();
    }, []);

    return (
        <>
            <Encabezado />
      
            <div className="contenedor-rondas">
                <div className="cabecera-rondas" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="titulo-rondas">Mis rondas</h2>
                </div>

                <div 
                    className="contenedor-tabla" 
                    style={{ 
                        maxHeight: '60vh', 
                        overflowY: 'auto', 
                        borderRadius: '8px'
                    }}
                >
                    {cargando ? (
                        <p style={{ textAlign: 'center', color: 'white', padding: '20px' }}>Cargando tus rondas...</p>
                    ) : rondas.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'white', padding: '20px' }}>Aún no has registrado ninguna ronda.</p>
                    ) : (
                        <table className="tabla-rondas" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#2C4A2B', zIndex: 1 }}>
                                <tr>
                                    <th className="th-rondas text-left">Campo</th>
                                    <th className="th-rondas">Fecha</th>
                                    <th className="th-rondas">Par Campo</th> {/* CAMBIADO: Nueva cabecera */}
                                    <th className="th-rondas">Tus Golpes</th> {/* CAMBIADO: Nombre más claro */}
                                    <th className="th-rondas">+/- Par</th>
                                    {/* CAMBIADO: Se elimina la cabecera de Putts */}
                                </tr>
                            </thead>
                            <tbody>
                                {rondas.map((ronda) => {
                                    // Extraemos el par del campo de forma segura (por si acaso viene vacío)
                                    const parCampo = ronda.course?.total_par || 0;
                                    // Calculamos la diferencia (+/- par)
                                    const diferencia = ronda.total_strokes - parCampo;
                                    
                                    // Formateamos el texto del más/menos par
                                    const plusMinusTexto = diferencia > 0 ? `+${diferencia}` : diferencia === 0 ? "E" : diferencia;

                                    return (
                                        <tr key={ronda.id}>
                                            <td className="td-rondas text-left text-bold">
                                                {ronda.course?.club_name || "Campo desconocido"}
                                            </td>
                                            <td className="td-rondas text-muted">{ronda.date}</td>
                                            
                                            {/* CAMBIADO: Añadimos la celda con el Par total necesario del campo */}
                                            <td className="td-rondas text-muted">{parCampo}</td>
                                            
                                            <td className="td-rondas text-bold">{ronda.total_strokes}</td>
                                            <td className="par-destacado td-rondas">{plusMinusTexto}</td>
                                            
                                            {/* CAMBIADO: Se elimina la celda de Putts */}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}

export default MisRondas;