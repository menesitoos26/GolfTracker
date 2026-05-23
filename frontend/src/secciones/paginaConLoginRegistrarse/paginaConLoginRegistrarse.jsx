import Login from '../login/login'
import './paginaConLoginRegistrarse.css'
import Registrarse from '../registrarse/registrarse';
import PaginaInicial from '../paginaInicial/paginaInicial'

import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from "framer-motion";

function PageTransition({ children }) {
  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0 }} /* ACÁ: Cambiar de 1 a 0 para que empiece transparente */
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }} /* 0.7s puede sentirse un poco largo, 0.5s suele ser más fluido */
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
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default PaginaLR;