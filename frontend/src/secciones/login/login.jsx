import { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import './login.css'

function Login() {
    // 1. Creamos los estados para guardar lo que escribe el usuario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    // El hook useNavigate nos permite cambiar de página mediante código
    const navigate = useNavigate();

    // 2. Función que se ejecuta al enviar el formulario
    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita que la página se recargue por defecto
        setError(''); // Limpiamos errores anteriores

        try {
            // Enviamos los datos a Nginx en /api/login
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password }) // Coincide con el modelo de Python
            });

            const data = await response.json();

            if (response.ok) {
                // ¡Login correcto!
                alert(`¡Bienvenido de nuevo, ${data.usuario.name}!`);
                
                // Aquí podrías guardar el usuario en un localStorage si lo necesitas más adelante:
                // localStorage.setItem('usuario', JSON.stringify(data.usuario));

                // Redirigimos programáticamente a la página inicial
                navigate("/paginaInicial");
            } else {
                // Si el backend devuelve un error (ej. 401), lo mostramos
                setError(data.detail || 'Correo o contraseña incorrectos');
            }
        } catch (err) {
            console.error("Error en el login:", err);
            setError('Error de conexión con el servidor.');
        }
    };

    return (
        <>
            <div className='logearse'>
                <div>
                    WELCOME
                </div>
                
                {/* Asignamos la función handleSubmit al evento onSubmit del formulario */}
                <form className='logearseformulario' id='loginForm' onSubmit={handleSubmit}>
                    <div className='inputsLogin'>
                        {/* Cambiado a Correo Electrónico para coincidir con tu Base de Datos */}
                        <label htmlFor="email">Correo Electrónico</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                        
                        <label htmlFor="password">Contraseña</label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                    </div>

                    {/* Si hay un error, lo pintamos en la pantalla */}
                    {error && <p style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>{error}</p>}
                </form>

                <div className='seccionBotonesLogin'>
                    {/* Quitamos el <Link> de aquí para controlar el acceso por código */}
                    <button className='botonLogin' type="submit" form='loginForm'>
                        Iniciar Sesion
                    </button>
                    
                    {/* Este sí se queda con <Link> porque ir a registrarse es libre */}
                    <Link to="/registrarse">
                        <button className='botonLogin' type="button">Registrarse</button>
                    </Link>
                </div>
            </div>
            <div className='fondoLogin'></div>
        </>
    )
}

export default Login