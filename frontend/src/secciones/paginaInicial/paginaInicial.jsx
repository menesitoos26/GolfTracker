import { useState, useEffect } from 'react';
import './paginaInicial.css';
import GraficaPaginaInicial from '../componentesSecciones/graficaPaginaInicial/graficaPaginaInicial';
import Encabezado from '../componentesSecciones/encabezado/encabezado';
import DosBotonesYTextPagInicial from '../componentesSecciones/dosBotonesYTextPagInicial/dosBotonesYTextPagInicial';

function PaginaInicial() {
  const [datosGrafica, setDatosGrafica] = useState([]);
  const [nombreCampo, setNombreCampo] = useState('');
  const [datosUsuario, setDatosUsuario] = useState({ name: "Jugador", handicap: "N/A" });

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuarioGolfTracker');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      setDatosUsuario({
        name: usuario.name,
        // Si el handicap viene vacío o nulo de la base de datos, mostramos "N/A"
        handicap: usuario.handicap !== null ? usuario.handicap : "N/A" 
      });
    }
   const cargarUltimoCampo = async () => {
        const usuarioGuardado = localStorage.getItem('usuarioGolfTracker');
        
        if (!usuarioGuardado) return;
        
        const usuario = JSON.parse(usuarioGuardado);

        try {
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
  }, []);

  return (
    <div>
      <Encabezado />
      <DosBotonesYTextPagInicial />
      
      <div className='parteGrafica'>

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