import React, { useState, useEffect } from 'react';
import Encabezado from '../componentesSecciones/encabezado/encabezado';
import './paginaEditUsuario.css';

function PaginaEditUsuario() {
    const [datosFormulario, setDatosFormulario] = useState({
        name: '',
        email: '',
        password: '' // Opcional por si quiere cambiarla
    });
    const [mensaje, setMensaje] = useState('');

    useEffect(() => {
        // Al cargar la página, rellenamos el formulario con los datos actuales
        const usuarioGuardado = localStorage.getItem('usuarioGolfTracker');
        if (usuarioGuardado) {
            const usuario = JSON.parse(usuarioGuardado);
            setDatosFormulario({
                name: usuario.name || '',
                email: usuario.email || '',
                password: '' // Dejamos la contraseña en blanco por seguridad
            });
        }
    }, []);

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setDatosFormulario(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const guardarCambios = async (e) => {
        e.preventDefault();
        
        // Validación básica
        if (!datosFormulario.name || !datosFormulario.email) {
            setMensaje("El nombre y el correo son obligatorios.");
            return;
        }

        /* =========================================================
        NOTA PARA EL BACKEND: 
        Aquí en el futuro harás el fetch hacia tu API, por ejemplo:
        const response = await fetch(`/api/usuarios/editar/${usuario.id}`, { ... })
        =========================================================
        */
        
        setMensaje("¡Simulación exitosa! (Falta conectar con FastAPI)");
        
        // Si tuvieras backend, aquí actualizarías el localStorage con los nuevos datos
        // y redirigirías al usuario de vuelta al perfil.
    };

    return (
        <>
            <Encabezado />

            <div className="editUsuarioSeccion">
                <div className="tarjeta-edicion">
                    <div className="cabecera-edicion">
                        <h2>Editar Perfil</h2>
                        <p>Actualiza tus datos personales de Golf Tracker</p>
                    </div>

                    <form onSubmit={guardarCambios} className="formulario-edicion">
                        <div className="grupo-input">
                            <label>Nombre de Jugador</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={datosFormulario.name} 
                                onChange={manejarCambio} 
                                placeholder="Tu nombre..."
                            />
                        </div>

                        <div className="grupo-input">
                            <label>Correo Electrónico</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={datosFormulario.email} 
                                onChange={manejarCambio} 
                                placeholder="tu@correo.com"
                            />
                        </div>

                        <div className="grupo-input">
                            <label>Nueva Contraseña (Opcional)</label>
                            <input 
                                type="password" 
                                name="password" 
                                value={datosFormulario.password} 
                                onChange={manejarCambio} 
                                placeholder="Déjalo en blanco para no cambiarla"
                            />
                        </div>

                        {mensaje && <p className="mensaje-feedback">{mensaje}</p>}

                        <div className="botones-edicion">
                            <button type="submit" className="btn-guardar">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className='FondoUsuarioSeccion'></div>
        </>
    );
}

export default PaginaEditUsuario;