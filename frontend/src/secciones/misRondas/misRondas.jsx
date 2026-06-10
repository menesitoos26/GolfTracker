import React, { useState, useEffect } from 'react';
import './misRondas.css'; 
import Encabezado from '../componentesSecciones/encabezado/encabezado';

function MisRondas() {
    const [rondas, setRondas] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Separé la lógica de cargar rondas en su propia función para poder llamarla cuando queramos
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

    // El useEffect llama a la función al entrar a la página
    useEffect(() => {
        cargarRondas();
    }, []);

    // --- NUEVA FUNCIÓN: Generar datos de prueba ---
    const generarRondaDePrueba = async () => {
        const usuarioGuardado = localStorage.getItem('usuarioGolfTracker');
        if (!usuarioGuardado) return alert("Debes iniciar sesión primero");
        
        const usuario = JSON.parse(usuarioGuardado);
        
        try {
            // Llamamos al backend para que inyecte los datos
            const response = await fetch(`/api/crear-ronda-prueba/${usuario.id}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                // Si funcionó, recargamos la tabla para ver el nuevo dato
                cargarRondas(); 
            } else {
                alert("Hubo un error al generar los datos.");
            }
        } catch (error) {
            console.error("Fallo de red:", error);
        }
    };

    return (
        <>
            <Encabezado />
      
            <div className="contenedor-rondas">
                <div className="cabecera-rondas" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="titulo-rondas">Mis rondas</h2>
                </div>

                <div className="contenedor-tabla">
                    {cargando ? (
                        <p style={{ textAlign: 'center', color: 'white', padding: '20px' }}>Cargando tus rondas...</p>
                    ) : rondas.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'white', padding: '20px' }}>Aún no has registrado ninguna ronda.</p>
                    ) : (
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
                    )}
                </div>
            </div>
        </>
    );
}

export default MisRondas;