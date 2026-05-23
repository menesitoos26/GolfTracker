import { useState, createContext, useContext } from 'react'
import { Link } from "react-router-dom";
import Registrarse from '../registrarse/registrarse';
import './login.css'

function Login() {


    return (
        <>
            
            <div className='logearse'>
                <div>
                    WELCOME
                </div>
                <form className='logearseformulario' id='loginForm'>
                    <div className='inputsLogin'>
                        <label htmlFor="username">Usuario</label>
                        <input type="text" id="username" name="username"  />
                        <label htmlFor="password">Contraseña</label>
                        <input type="password" id="password" name="password" />
                    </div>
                </form>
                <div className='seccionBotonesLogin'>
                    <button type="submit" form='loginForm'>Iniciar Sesion</button>
                    <Link to="/registrarse">
                        <button type="submit">Registrarse</button>
                    </Link>
                </div>

            </div>


        </>

    )
}

export default Login