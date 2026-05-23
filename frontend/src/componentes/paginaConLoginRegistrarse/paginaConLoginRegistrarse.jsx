import { useState, createContext, useContext } from 'react'
import Login from '../login/login'
import './paginaConLoginRegistrarse.css'
import Registrarse from '../registrarse/registrarse';
import { Routes, Route } from 'react-router-dom';
function PaginaLR() {


  return (
    <>
      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/registrarse"
          element={<Registrarse />}
        />

      </Routes>
      <div className='fondoLogin'></div>
    </>

  )
}

export default PaginaLR