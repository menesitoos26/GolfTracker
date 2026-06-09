import { useState, createContext, useContext } from 'react'
import { Link, useNavigate } from "react-router-dom";
import Login from '../paginaUsuario/paginaUsuario'
import './registrarse.css'
function Registrarse() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        try {
            const response = await fetch('/api/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert("¡Usuario registrado con éxito!");
                navigate('/'); // Redirige automáticamente al Login
            } else {
                alert(data.detail || "Hubo un error en el registro");
            }
        } catch (error) {
            console.error("Error conectando con la base de datos:", error);
            alert("No se pudo conectar con el servidor.");
        }
    };
    return (
        <>
            <div className='rigistro'>
                <div>
                    REGISTRARSE
                </div>
                {/* Vinculamos la función al evento onSubmit */}
                <form className='rigistroformulario' onSubmit={handleSubmit}>
                    <div className='inputsRegistro'>
                        <label htmlFor="name">Nombre</label>
                        <input 
                            type="text" 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            required 
                        />

                        <label htmlFor="email">Correo (Gmail)</label>
                        <input 
                            type="email" 
                            id="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />

                        <label htmlFor="password">Contraseña</label>
                        <input 
                            type="password" 
                            id="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className='btRegistrar'>
                        <button className='botonRegistro' type="submit">Registrarse</button>
                    <Link to="/">
                        <button className='botonRegistro' type="button">Logearse</button> 
                    </Link>
                    </div>
                    
                </form>
               
            </div>
            <div className='fondoLogin'></div>
        </>

    )
}

export default Registrarse