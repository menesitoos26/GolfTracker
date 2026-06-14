import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Encabezado from '../componentesSecciones/encabezado/encabezado';
import './editarPerfil.css';

function PaginaEditarPerfil() {
    const navigate = useNavigate(); // Hook para redireccionar al usuario al guardar

    // Estado inicial simulando los datos actuales del usuario
    const [formData, setFormData] = useState({
        nombre: 'Carlos Gómez',
        email: 'carlos@gmail.com',
        handicap: 18.4
    });

    // Función genérica para manejar los cambios en cualquier input
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Función al hacer submit en el formulario
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Guardando nuevos datos en Base de Datos...", formData);
        
        // Simulamos que tarda medio segundo en guardar y luego volvemos al perfil
        setTimeout(() => {
            navigate('/paginaUsuario');
        }, 500);
    };

    return (
        <>
            <Encabezado />

            <div className="editar-perfil-seccion">
                <div className="editar-tarjeta">
                    <h2>Configuración de Perfil</h2>
                    <p className="editar-subtitulo">Actualiza tus datos y estadísticas de juego.</p>

                    <form onSubmit={handleSubmit} className="editar-formulario">
                        
                        <div className="grupo-input">
                            <label htmlFor="nombre">Nombre Completo</label>
                            <input 
                                type="text" 
                                id="nombre" 
                                name="nombre" 
                                value={formData.nombre} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        <div className="grupo-input">
                            <label htmlFor="email">Correo Electrónico</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        <div className="grupo-input input-mitad">
                            <label htmlFor="handicap">Hándicap Actual</label>
                            <input 
                                type="number" 
                                step="0.1" 
                                id="handicap" 
                                name="handicap" 
                                value={formData.handicap} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        {/* Botones de acción */}
                        <div className="editar-acciones">
                            <Link to="/paginaUsuario" className="btn-cancelar">
                                Cancelar
                            </Link>
                            <button type="submit" className="btn-guardar">
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className='FondoUsuarioSeccion'></div> 
        </>
    );
}

export default PaginaEditarPerfil;