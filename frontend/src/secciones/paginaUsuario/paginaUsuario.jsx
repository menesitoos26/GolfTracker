import React, { useState, useEffect } from 'react';
import Encabezado from '../componentesSecciones/encabezado/encabezado';
import './paginaUsuario.css';

function PaginaUsuario() {
    // Inicializamos las estadísticas en 0/NA de forma segura
    const [estadisticas, setEstadisticas] = useState({
        handicap: "N/A",
        torneosJugados: 0,
        campos: 0
    });

    useEffect(() => {
        const cargarDatosUsuario = async () => {
            // 1. Recuperamos el usuario logueado desde el localStorage
            const usuarioGuardado = localStorage.getItem('usuarioGolfTracker');
            if (!usuarioGuardado) return;

            const usuario = JSON.parse(usuarioGuardado);
            const handicapUser = usuario.handicap !== null ? usuario.handicap : "N/A";

            try {
                // CORRECCIÓN CLAVE: Añadido /api/ para que Nginx conecte correctamente con FastAPI
                const response = await fetch(`/api/rondas/${usuario.id}`);
                
                if (response.ok) {
                    const rondas = await response.json(); // Trae el historial completo del usuario
                    
                    // --- LÓGICA PARA FILTRAR SOLO LA SEMANA ACTUAL ---
                    const hoy = new Date();
                    const diaSemana = hoy.getDay(); // 0 es Domingo, 1 es Lunes, etc.
                    
                    // Calculamos cuántos días restar para llegar al Lunes de esta semana
                    const diasAlLunes = diaSemana === 0 ? 6 : diaSemana - 1;
                    
                    const lunesEstaSemana = new Date(hoy);
                    lunesEstaSemana.setDate(hoy.getDate() - diasAlLunes);
                    lunesEstaSemana.setHours(0, 0, 0, 0); // Inicio del lunes

                    const domingoEstaSemana = new Date(lunesEstaSemana);
                    domingoEstaSemana.setDate(lunesEstaSemana.getDate() + 6);
                    domingoEstaSemana.setHours(23, 59, 59, 999); // Fin del domingo

                    // Filtramos el array de rondas quedándonos solo con las de esta semana
                    const rondasDeEstaSemana = rondas.filter(r => {
                        // Forzamos formato de hora local para evitar desfases de zonas horarias de bases de datos
                        const fechaRonda = new Date(r.date + "T00:00:00");
                        return fechaRonda >= lunesEstaSemana && fechaRonda <= domingoEstaSemana;
                    });
                    
                    // 2. Contamos los resultados filtrados
                    const totalRondasSemana = rondasDeEstaSemana.length;
                    
                    // Extraemos los nombres de los clubes y usamos un Set para no contar campos repetidos esta semana
                    const camposUnicosSemana = new Set(rondasDeEstaSemana.map(r => r.course.club_name)).size;

                    // 3. Guardamos los datos reales calculados en el estado
                    setEstadisticas({
                        handicap: handicapUser,
                        torneosJugados: totalRondasSemana,
                        campos: camposUnicosSemana
                    });
                } else {
                    // Si el servidor responde mal, dejamos al menos el hándicap cargado
                    setEstadisticas(prev => ({ ...prev, handicap: handicapUser }));
                }
            } catch (error) {
                console.error("Error obteniendo estadísticas del usuario:", error);
                setEstadisticas(prev => ({ ...prev, handicap: handicapUser }));
            }
        };

        cargarDatosUsuario();
    }, []);

    return (
        <>
            <Encabezado />

            <div className='usuarioSeccion'>
                <div className="usuario-stats-grid">
                    
                    <div className="tarjeta-dato">
                        <div className="tarjeta-contenido">
                            <h3>Hándicap Actual</h3>
                            <p className="tarjeta-valor">{estadisticas.handicap}</p>
                        </div>
                    </div>

                    <div className="tarjeta-dato">
                        <div className="tarjeta-contenido">
                            <h3>Rondas (Esta Semana)</h3>
                            <p className="tarjeta-valor">{estadisticas.torneosJugados}</p>
                        </div>
                    </div>

                    <div className="tarjeta-dato">
                        <div className="tarjeta-contenido">
                            <h3>Campos (Esta Semana)</h3>
                            <p className="tarjeta-valor">{estadisticas.campos}</p>
                        </div>
                    </div>

                </div>
            </div>

            <div className='FondoUsuarioSeccion'></div> 
        </>
    );
}

export default PaginaUsuario;