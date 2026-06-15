import Login from '../login/login'
import './paginaConLoginRegistrarse.css'
import Registrarse from '../registrarse/registrarse';
import PaginaInicial from '../paginaInicial/paginaInicial'
import PaginaUsuario from '../paginaUsuario/paginaUsuario'
import NuevaRonda from '../nuevaRonda/nuevaRonda'
import MisRondas from '../misRondas/misRondas'
import PaginaEditUsuario from '../paginaEditUsuario/paginaEditUsuario'
import PaginaPublica from '../paginaPublica/paginaPublica'
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from "framer-motion";

function PageTransition({ children }) {
  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }} 
    >
      {children}
    </motion.div>
  );
}

function PaginaLR() {
  const location = useLocation();

  return (
    <>
      <div className='fondoLogin'></div>
      <AnimatePresence mode="wait">
        <Routes
          location={location}
          key={location.pathname}
        >
          <Route
            path="/"
            element={
              <PaginaPublica />
            }
          />
          <Route
            path="/login"
            element={
              <PageTransition>
                <Login />
              </PageTransition>
            }
          />
          <Route
            path="/paginaInicial"
            element={
              <PaginaInicial />
            }
          />
          <Route
            path="/registrarse"
            element={
              <PageTransition>
                <Registrarse />
              </PageTransition>
            }
          />
          <Route
            path="/paginaUsuario"
            element={
              <PaginaUsuario>
              </PaginaUsuario>
            }
          />
          <Route
            path="/nuevaRonda"
            element={
              <NuevaRonda>
              </NuevaRonda>
            }
          />
          <Route
            path="/misRondas"
            element={
              <MisRondas>
              </MisRondas>
            }
          />
          <Route
            path="/editarPerfil"
            element={
              <PaginaEditUsuario>
              </PaginaEditUsuario>
            }
          />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default PaginaLR;
