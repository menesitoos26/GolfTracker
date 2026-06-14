import { useState, useEffect } from 'react';
import './paginaInicial.css';
import GraficaPaginaInicial from '../componentesSecciones/graficaPaginaInicial/graficaPaginaInicial';
import Encabezado from '../componentesSecciones/encabezado/encabezado';
import DosBotonesYTextPagInicial from '../componentesSecciones/dosBotonesYTextPagInicial/dosBotonesYTextPagInicial';

function PaginaInicial() {
  // 1. Estados para almacenar los datos reales del usuario y del campo
  const [datosGrafica, setDatosGrafica] = useState([]);
  const [nombreCampo, setNombreCampo] = useState('');
  const [datosUsuario, setDatosUsuario] = useState({ name: "Jugador", handicap: "N/A" });

  useEffect(() => {
    // 2. Recuperar el usuario logueado desde el localStorage
    const usuarioGuardado = localStorage.getItem('usuarioGolfTracker');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      setDatosUsuario({
        name: usuario.name,
        // Si el handicap viene vacío o nulo de la base de datos, mostramos "N/A"
        handicap: usuario.handicap !== null ? usuario.handicap : "N/A" 
      });
    }

    // 3. Consultar a tu API (FastAPI) el último campo creado para coger los datos
   const cargarUltimoCampo = async () => {
        const usuarioGuardado = localStorage.getItem('usuarioGolfTracker');
        
        if (!usuarioGuardado) return;
        
        const usuario = JSON.parse(usuarioGuardado);

        try {
            // Cogemos el fetch de rondas ultimas con el id del usuairo
            const response = await fetch(`/api/rondas/ultima/detalle/${usuario.id}`);
            
            if (response.ok) {
                const data = await response.json(); 
                setDatosGrafica(data); 
                setNombreCampo("Última Ronda Jugada");
            } else {
                inyectarCerosPorDefecto();
            }
        } catch (error) {
            console.error("Error al conectar con la API:", error);
            inyectarCerosPorDefecto();
        }
    };

    // Función de seguridad: Genera 18 hoyos a cero para que la gráfica no explote
    const inyectarCerosPorDefecto = () => {
      const ceros = Array.from({ length: 18 }, (_, i) => ({
        hole_number: i + 1,
        par: 0
      }));
      setDatosGrafica(ceros);
      setNombreCampo('Sin campos registrados');
    };

    cargarUltimoCampo();
    console.log("GRAFICA "+datosGrafica)
  }, []); // El array vacío asegura que esto solo se ejecute una vez al cargar la página

  return (
    <div>
      <Encabezado />
      <DosBotonesYTextPagInicial />
      
      <div className='parteGrafica'>

        {/* Le pasamos a tu gráfica los datos reales procesados */}
        <GraficaPaginaInicial
          datos={datosGrafica}
          handicapActual={datosUsuario.handicap}
          nombreUser={datosUsuario.name}
        />
      </div>

      <div className='fondoInicial'></div>
    </div>
  );
}

export default PaginaInicial;