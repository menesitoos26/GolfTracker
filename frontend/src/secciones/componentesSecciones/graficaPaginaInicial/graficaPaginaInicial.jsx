import React from 'react'; 
import { LineChart, Line, ResponsiveContainer, CartesianGrid, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import './graficaPaginaInicial.css';

function GraficaPaginaInicial({ datos, handicapActual, nombreUser }) {

  // Si no hay datos, dejamos la tarjeta vacía con un mensaje
  if (!datos || datos.length === 0) {
    return (
      <div className="tarjeta-progreso">
        <div className="cabecera-progreso">
          <div className="titulos">
            <span className="subtitulo">Rendimiento por Hoyo</span>
            <h2 className="titulo-principal">Bienvenido {nombreUser}</h2>
          </div>
          <div className="nuevaRonda">
            <button>
              <Link to="/nuevaRonda"> + Nueva ronda</Link>
            </button>
          </div>
        </div>
        <div style={{ textAlign: 'center', color: '#888', marginTop: '20px', paddingBottom: '20px' }}>
          No hay datos suficientes para mostrar la gráfica. ¡Juega tu primera ronda!
        </div>
      </div>
    );
  }

  // Aseguranos que si los datos entren mal que los pongan en cero en la array de datos
  const datosProcesados = datos.map((d) => ({
    hoyo: d.hole_number || d.numero || 0,
    parNecesario: d.par || 0,
    tusGolpes: d.golpes || d.strokes || 0
  }));

  // --- METRICAS BASADAS SÓLO EN LO JUGADO ---

  const totalHoyos = datosProcesados.length;
  // reduce, pasa por toda la arrya
  // acc = acumulador 
  // d = elemento actual del array.
  const totalPar = datosProcesados.reduce((acc, d) => acc + d.parNecesario, 0);

  const valorMaximo = Math.max(...datosProcesados.map(d => Math.max(d.parNecesario, d.tusGolpes)));
  // toFixed es para redondear
  const mediaPar = totalHoyos > 0 ? (totalPar / totalHoyos).toFixed(1) : 0;

  return (
    <div className="tarjeta-progreso">

      <div className="cabecera-progreso">
        <div className="titulos">
          <span className="subtitulo">Rendimiento por Hoyo</span>
          <h2 className="titulo-principal">Bienvenido {nombreUser}</h2>
        </div>

        <div className="nuevaRonda">
          <button>
            <Link to="/nuevaRonda"> + Nueva ronda</Link>
          </button>
        </div>
      </div>

      <div className="estadisticas-inferiores">
        <div className="stat-box">
          <span className="stat-label">Handicap Actual</span>
          <span className="stat-value">{handicapActual}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Hoyos</span>
          <span className="stat-value">{totalHoyos}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Total Par</span>
          <span className="stat-value">{totalPar}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Media Par</span>
          <span className="stat-value">{mediaPar}</span>
        </div>
      </div>

      <div className="contenedor-grafica">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datosProcesados} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#333" />
            <XAxis dataKey="hoyo" stroke="#888" tickLine={false} dy={10} />
            <YAxis stroke="#888" tickLine={false} domain={[0, valorMaximo + 2]} dx={-5} />

            <Tooltip
              contentStyle={{ backgroundColor: '#2a2a2a', border: 'none', borderRadius: '8px', color: '#fff' }}
              labelFormatter={(value) => `Hoyo: ${value}`}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#fff' }} />

            {/* LÍNEA ROJA: Par necesario */}
            <Line 
              type="monotone" 
              name="Par necesario" 
              dataKey="parNecesario" 
              stroke="#ef4444" 
              strokeWidth={3} 
              dot={{ r: 4 }} 
              activeDot={{ r: 6 }} 
            />
            
            {/* LÍNEA VERDE: Tus Golpes */}
            <Line 
              type="monotone" 
              name="Tus golpes" 
              dataKey="tusGolpes" 
              stroke="#22c55e" 
              strokeWidth={3} 
              dot={{ r: 4 }} 
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default GraficaPaginaInicial;