import { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import './login.css'

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita que la página se recargue
        setError(''); // Limpia errores del intento anterior

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            // PONEMOS DOBLE SEGURIDAD: 
            // Solo si la respuesta es correcta (status 200) Y además el servidor envió al 'usuario'
            if (response.ok && data.usuario) {
                alert(`¡Bienvenido de nuevo, ${data.usuario.name}!`);
                navigate("/paginaInicial");
            } else {
                // Si el servidor responde con un 401, data NO tiene 'usuario', tiene 'detail'.
                // Así evitamos que intente leer data.usuario.name y no se romperá la web.
                setError(data.detail || 'Correo o contraseña incorrectos');
            }
            if (response.ok && data.usuario) {
                // Guardamos el objeto como texto
                localStorage.setItem('usuarioGolfTracker', JSON.stringify(data.usuario));

                navigate("/paginaInicial");
            }
        } catch (err) {
            console.error("Error en el login:", err);
            setError('Error de conexión con el servidor.');
        }
    };

    return (
        <>
            <div className='logearse'>
                <div>WELCOME</div>

                <form className='logearseformulario' id='loginForm' onSubmit={handleSubmit}>
                    <div className='inputsLogin'>
                        <label htmlFor="email">Correo Electrónico</label>
                        <input
                            type="email"
                            id="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {/* El mensaje de error ahora aparecerá limpio en pantalla sin tumbar la app */}
                    {error && <p style={{ color: 'red', marginTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>{error}</p>}
                </form>

                <div className='seccionBotonesLogin'>
                    <button className='botonLogin' type="submit" form='loginForm'>
                        Iniciar Sesion
                    </button>

                    <Link to="/registrarse">
                        <button className='botonLogin' type="button">Registrarse</button>
                    </Link>
                </div>
            </div>
            <div className='fondoLogin'></div>
        </>
    )
}

export default Login;