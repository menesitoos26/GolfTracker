import { useState, createContext, useContext } from 'react'
import { Link } from "react-router-dom";
import Login from '../login/login'
import './registrarse.css'
function Registrarse() {
    return (
        <>
            <div className='rigistro'>
                <div>
                    REGISTRARSE
                </div>
                <form className='rigistroformulario'>
                    <div className='inputsRegistro'>
                        <label for="username">Usuario</label>
                        <input type="text" id="username" name="username"  />
                        <label for="password">Contraseña</label>
                        <input type="password" id="password" name="password" />
                    </div>
                    <button className='botonRegistro' type="submit">Registrarse</button>
                    <Link to="/">
                        <button className='botonRegistro' type="submit">Logearse</button> 
                    </Link>
                </form>
               
            </div>
            <div className='fondoLogin'></div>

        </>

    )
}

export default Registrarse