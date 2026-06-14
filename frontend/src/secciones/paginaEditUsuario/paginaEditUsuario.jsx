import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Encabezado from '../componentesSecciones/encabezado/encabezado';
import './paginaEditUsuario.css';

function PaginaEditUsuario() {
    const navigate = useNavigate();
    const [datosFormulario, setDatosFormulario] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [mensaje, setMensaje] = useState('');
    const [usuarioId, setUsuarioId] = useState(null);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuarioGolfTracker');
        if (usuarioGuardado) {
            const usuario = JSON.parse(usuarioGuardado);
            setUsuarioId(usuario.id);
            setDatosFormulario({
                name: usuario.name || '',
                email: usuario.email || '',
                password: '' 
            });
        } else {
            navigate('/login'); 
        }
    }, [navigate]);

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setDatosFormulario(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const guardarCambios = async (e) => {
        e.preventDefault();
        
        if (!datosFormulario.name || !datosFormulario.email) {
            setMensaje("El nombre y el correo son obligatorios.");
            return;
        }

        try {

            const response = await fetch(`/api/usuarios/editar/${usuarioId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosFormulario)
            });

            const data = await response.json();

            if (response.ok) {
                const usuarioActual = JSON.parse(localStorage.getItem('usuarioGolfTracker'));
                usuarioActual.name = data.name;
                usuarioActual.email = data.email;
                localStorage.setItem('usuarioGolfTracker', JSON.stringify(usuarioActual));

                
                alert("¡Perfil actualizado con éxito!");
                navigate('/paginaUsuario'); 
            } else {
                setMensaje(data.detail || "Error al actualizar el perfil.");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            setMensaje("Fallo de conexión con el servidor.");
        }
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