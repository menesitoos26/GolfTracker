import React from 'react';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import './graficaPaginaInicial.css';

// Ahora el componente recibe "datos" y el "handicapActual" como propiedades (props)
function GraficaPaginaInicial({ datos, handicapActual, nombreUser}) {
  
  // CONTROL DE SEGURIDAD: Si no hay datos todavía, mostramos un mensaje de carga
  if (!datos || datos.length === 0) {
    return <div className="tarjeta-progreso">Cargando datos...</div>;
  }

  // --- AUTOMATIZACIÓN DE MÉTRICAS ---
  
  // 1. Total de rondas jugadas (el tamaño del array)
  const totalRondas = datos.length;

  // 2. Calcular el Mejor resultado (el valor mínimo en la propiedad 'score' o 'handicap' según uses)
  // Nota: En el golf, "mejor" suele ser la ronda con menos golpes (score) o el hándicap más bajo.
  const mejorHandicap = Math.min(...datos.map(d => d.handicap));

  // 3. Calcular la Media de hándicap
  const sumaHandicaps = datos.reduce((acc, d) => acc + d.handicap, 0);
  const mediaHandicap = (sumaHandicaps / totalRondas).toFixed(1); // Redondeado a 1 decimal

  // 4. Calcular la diferencia del último mes (comparando el primero y el último dato del array)
  const primerHandicap = datos[0].handicap;
  const ultimoHandicap = datos[datos.length - 1].handicap;
  const diferencia = (ultimoHandicap - primerHandicap).toFixed(1);
  
  // Determinamos si ha mejorado (bajado) o subido para el estilo visual
  const esMejora = diferencia <= 0;

  return (
    <div className="tarjeta-progreso">
      
      {/* Cabecera de la gráfica dinámica */}
      <div className="cabecera-progreso">
        <div className="titulos">
          <span className="subtitulo">Tu progreso</span>
          <h2 className="titulo-principal">Bienvenido {nombreUser}</h2>
        </div>
        
        {/* Etiqueta de rendimiento dinámica (Verde si bajó o se mantuvo, Roja si subió) */}
        <div className="nuevaRonda">
          <button>
              + Nueva ronda
          </button>
        </div>
      </div>

            {/* Estadísticas calculadas automáticamente */}
      <div className="estadisticas-inferiores">
        <div className="stat-box">
          <span className="stat-label">Handicap Actual</span>
          <span className="stat-value">{handicapActual}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Rondas</span>
          <span className="stat-value">{totalRondas}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Mejor Hcp</span>
          <span className="stat-value">{mejorHandicap}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Media Hcp</span>
          <span className="stat-value">{mediaHandicap}</span>
        </div>
      </div>

      {/* Contenedor de la Gráfica */}
      <div className="contenedor-grafica">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#333" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#2a2a2a', border: 'none', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#4ade80' }}
              labelFormatter={(value, name) => `Ronda: ${value + 1}`} // Para que muestre "Ronda X" al pasar el mouse
            />
            <Line 
              type="monotone" 
              dataKey="handicap" // Clave del diccionario que leerá para graficar
              stroke="#2ecc71" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#1e1e1e', stroke: '#2ecc71', strokeWidth: 2 }} 
              activeDot={{ r: 6, fill: '#2ecc71' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>



    </div>
  );
}

export default GraficaPaginaInicial;