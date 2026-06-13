import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Encabezado from '../componentesSecciones/encabezado/encabezado';
import { obtenerCamposDeGolf } from '../../Funciones/golfService/golfService';
import './nuevaRonda.css';

function NuevaRonda() {
  const navigate = useNavigate();

  // Estados para la API
  const [campos, setCampos] = useState([]);
  const [campoSeleccionado, setCampoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Cargar campos al iniciar y limpiarlos
  useEffect(() => {
  const cargarDatos = async () => {
    setCargando(true);
    const datosLimpios = await obtenerCamposDeGolf();
    setCampos(datosLimpios);
    setCargando(false);
  };
  cargarDatos();
}, []);

  // Manejar selección de campo a través del índice del array
  const manejarSeleccion = (e) => {
    const indexSeleccionado = e.target.value;
    const campoEncontrado = campos[indexSeleccionado];
    setCampoSeleccionado(campoEncontrado || null);
  };

  const fechaActual = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  // Lista con 10 hoyos por defecto
  const [hoyos, setHoyos] = useState(
    Array.from({ length: 10 }, (_, i) => ({
      numero: i + 1,
      par: 4,
      golpes: ''
    }))
  );

  const handleInputChange = (index, campo, valor) => {
    const nuevosHoyos = [...hoyos];
    nuevosHoyos[index][campo] = valor === '' ? '' : parseInt(valor, 10);
    setHoyos(nuevosHoyos);
  };

  // Cálculos automáticos
  const totalPar = hoyos.reduce((acc, h) => acc + (h.par || 0), 0);
  const totalGolpes = hoyos.reduce((acc, h) => acc + (h.golpes || 0), 0);
  const hoyosJugados = hoyos.filter(h => h.golpes !== '').length;
  const parAcumuladoJugado = hoyos.reduce((acc, h) => h.golpes !== '' ? acc + h.par : acc, 0);
  const diferencia = totalGolpes - parAcumuladoJugado;

  const formatearDiferencia = () => {
    if (hoyosJugados === 0) return '0';
    if (diferencia > 0) return `+${diferencia}`;
    if (diferencia < 0) return `${diferencia}`;
    return 'E (Par)';
  };

  const añadirHoyo = () => {
    setHoyos([...hoyos, { numero: hoyos.length + 1, par: 4, golpes: '' }]);
  };

  const quitarHoyo = () => {
    if (hoyos.length > 1) {
      setHoyos(hoyos.slice(0, -1));
    } else {
      alert("¡No puedes tener menos de 1 hoyo!");
    }
  };

  // --- NUEVA FUNCIÓN: ENVIAR A LA BASE DE DATOS ---
  const guardarRonda = async (e) => {
    e.preventDefault();

    // 1. VALIDACIÓN: Bloqueamos si hay hoyos sin golpes o en 0
    const hoyosIncompletos = hoyos.some(hoyo => hoyo.golpes === '' || hoyo.golpes <= 0);
    
    if (hoyosIncompletos) {
        alert("⚠️ Por favor, introduce la cantidad de golpes en todos los hoyos. No puedes dejarlos vacíos ni en cero.");
        return; // Detiene la ejecución aquí
    }

    if (!campoSeleccionado) {
        alert("Por favor, selecciona un campo de golf del desplegable.");
        return;
    }

    const usuarioGuardado = localStorage.getItem('usuarioGolfTracker');
    if (!usuarioGuardado) {
        alert("Debes iniciar sesión para poder guardar rondas.");
        return;
    }
    const usuario = JSON.parse(usuarioGuardado);

    const payload = {
        user_id: usuario.id,
        course: {
            club_name: campoSeleccionado.club_name,
            city: campoSeleccionado.city || "Desconocida",
            country: campoSeleccionado.country || "Desconocido"
        },
        total_par: totalPar,
        total_strokes: totalGolpes,
        hoyos: hoyos.map(h => ({
            numero: h.numero,
            par: h.par,
            golpes: h.golpes
        }))
    };

    try {
        const response = await fetch('/api/guardar-ronda', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            // ACTUALIZAMOS LA MEMORIA CON EL NUEVO HÁNDICAP EN VIVO
            if (data.nuevo_handicap !== undefined) {
                usuario.handicap = data.nuevo_handicap;
                localStorage.setItem('usuarioGolfTracker', JSON.stringify(usuario));
            }

            alert(" ¡Ronda guardada con éxito!");
            navigate('/misRondas');
        } else {
            alert(`Hubo un problema: ${data.detail}`);
        }
    } catch (error) {
        console.error("Error al guardar la ronda:", error);
        alert("Fallo de conexión. Revisa que el servidor esté encendido.");
    }
  };

  return (
    <>
      <Encabezado />

      <div className="nueva-ronda-seccion">
        <div className="ronda-contenedor">

          {/* CABECERA DINÁMICA */}
          <div className="ronda-header dinamico">
            <div className="info-titulo">
              <h2 className="titulo-truncado" title={campoSeleccionado ? campoSeleccionado.club_name : 'Nueva Ronda de Golf'}>
                {campoSeleccionado ? `Nueva ronda - ${campoSeleccionado.club_name}` : 'Nueva Ronda de Golf'}
              </h2>

              {campoSeleccionado ? (
                <p className="subtitulo-ubicacion titulo-truncado" title={`${campoSeleccionado.address || 'Sin dirección'}, ${campoSeleccionado.city}, ${campoSeleccionado.country}`}>
                  📍 {campoSeleccionado.location?.address || 'Sin dirección'}
                </p>
              ) : (
                <p className="subtitulo-ubicacion">{fechaActual}</p>
              )}
            </div>

            <div className="controles-derecha">
              <select
                className="selector-campo"
                onChange={manejarSeleccion}
                defaultValue=""
                disabled={cargando}
              >
                <option value="" disabled>
                  {cargando ? 'Cargando campos...' : 'Elige un campo...'}
                </option>
                {campos.map((campo, index) => (
                  <option key={`${campo.club_name || 'club'}-${index}`} value={index}>
                    {campo.club_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MARCADOR EN TIEMPO REAL */}
          <div className="marcador-resumen">
            <div className="marcador-item">
              <span>Par Total</span>
              <p>{totalPar}</p>
            </div>
            <div className="marcador-item destacado">
              <span>Tus Golpes</span>
              <p>{totalGolpes}</p>
            </div>
            <div className={`marcador-item status ${diferencia > 0 ? 'sobre-par' : diferencia < 0 ? 'bajo-par' : ''}`}>
              <span>Resultado Neto</span>
              <p>{formatearDiferencia()}</p>
            </div>
          </div>

          {/* TABLA DE PUNTUACIÓN */}
          <form onSubmit={guardarRonda}>
            <div className="tabla-scroll">
              <table className="tabla-scorecard">
                <thead>
                  <tr>
                    <th>Hoyo</th>
                    <th>Par (Recomendado)</th>
                    <th>Tus Golpes</th>
                    <th>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {hoyos.map((hoyo, index) => {
                    const diffHoyo = hoyo.golpes !== '' ? hoyo.golpes - hoyo.par : '-';
                    return (
                      <tr key={hoyo.numero}>
                        <td className="hoyo-num"> {hoyo.numero}</td>
                        <td>
                          <input
                            type="number"
                            min="3"
                            max="5"
                            value={hoyo.par}
                            onChange={(e) => handleInputChange(index, 'par', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            max="15"
                            placeholder="-"
                            value={hoyo.golpes}
                            onChange={(e) => handleInputChange(index, 'golpes', e.target.value)}
                            required /* DOBLE SEGURIDAD: Evita el envío si el campo está vacío */
                          />
                        </td>
                        <td className={`diff-col ${diffHoyo > 0 ? 'text-rojo' : diffHoyo < 0 ? 'text-azul' : ''}`}>
                          {diffHoyo > 0 ? `+${diffHoyo}` : diffHoyo}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="ronda-acciones">
              <div className="btn-addOrDelet-hoyos">
                <button type="button" className="btn-add-hoyos" onClick={añadirHoyo}>
                  Añadir Hoyo
                </button>
                <button type="button" className="btn-delete-hoyos" onClick={quitarHoyo}>
                  Quitar Hoyo
                </button>
              </div>
              <button type="submit" className="btn-guardar-ronda">
                Guardar Ronda
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className='FondoUsuarioSeccion'></div>
    </>
  );
}

export default NuevaRonda;