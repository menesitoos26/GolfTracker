import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/cliente'
import { useAuth } from '../hooks/useAuth'
import { useNotificaciones } from '../hooks/useNotificaciones'
import { claseDiferencia, formatearDiferencia, hoyIso } from '../utils/formato'
import './nuevaRonda.css'

// Recorrido tipo par 72: los 9 primeros suman 36 y los 9 siguientes también.
const PARES_ESTANDAR = [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4]

const CLIMAS = ['Soleado', 'Nublado', 'Viento', 'Lluvia', 'Calor', 'Frío']

function tarjetaInicial(numeroDeHoyos) {
  return Array.from({ length: numeroDeHoyos }, (_, indice) => ({
    hole_number: indice + 1,
    par: PARES_ESTANDAR[indice],
    strokes: '',
    putts: '',
    fairway_hit: null,
    green_in_regulation: null,
  }))
}

export default function NuevaRonda() {
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const { exito, error: avisarError } = useNotificaciones()
  const { actualizarUsuario } = useAuth()

  const [hoyos, setHoyos] = useState(() => tarjetaInicial(18))
  const [campo, setCampo] = useState({ name: '', city: '', country: '' })
  const [sugerencias, setSugerencias] = useState([])
  const [torneos, setTorneos] = useState([])
  const [detalleAbierto, setDetalleAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [datos, setDatos] = useState({
    played_on: hoyIso(),
    tournament_id: parametros.get('torneo') || '',
    weather: '',
    notes: '',
  })

  useEffect(() => {
    api
      .listarTorneos()
      .then(setTorneos)
      .catch(() => setTorneos([])) // no es crítico: la ronda se puede guardar sin torneo
  }, [])

  // Buscamos campos mientras el usuario escribe, con una pequeña espera para
  // no lanzar una petición por cada tecla.
  useEffect(() => {
    const texto = campo.name.trim()
    if (texto.length < 3) {
      setSugerencias([])
      return undefined
    }

    const temporizador = setTimeout(async () => {
      try {
        setSugerencias(await api.buscarCampos(texto))
      } catch {
        setSugerencias([])
      }
    }, 350)

    return () => clearTimeout(temporizador)
  }, [campo.name])

  const cambiarNumeroDeHoyos = (cantidad) => {
    setHoyos((anteriores) => {
      const nueva = tarjetaInicial(cantidad)
      // Conservamos lo ya introducido al ampliar o reducir el recorrido.
      return nueva.map((hoyo, indice) => anteriores[indice] ?? hoyo)
    })
  }

  const cambiarHoyo = (indice, propiedad, valor) => {
    setHoyos((anteriores) =>
      anteriores.map((hoyo, i) => (i === indice ? { ...hoyo, [propiedad]: valor } : hoyo)),
    )
  }

  const totales = useMemo(() => {
    const jugados = hoyos.filter((hoyo) => hoyo.strokes !== '' && hoyo.strokes > 0)
    const golpes = jugados.reduce((suma, hoyo) => suma + Number(hoyo.strokes), 0)
    const parJugado = jugados.reduce((suma, hoyo) => suma + Number(hoyo.par), 0)
    const putts = jugados.reduce((suma, hoyo) => suma + (Number(hoyo.putts) || 0), 0)

    return {
      hoyosJugados: jugados.length,
      golpes,
      parTotal: hoyos.reduce((suma, hoyo) => suma + Number(hoyo.par), 0),
      parJugado,
      putts,
      diferencia: jugados.length > 0 ? golpes - parJugado : null,
    }
  }, [hoyos])

  const guardar = async (evento) => {
    evento.preventDefault()
    setError('')

    if (!campo.name.trim()) {
      setError('Indica en qué campo has jugado.')
      return
    }

    const incompletos = hoyos.filter((hoyo) => hoyo.strokes === '' || Number(hoyo.strokes) < 1)
    if (incompletos.length > 0) {
      setError(
        `Falta anotar los golpes en ${incompletos.length} ${
          incompletos.length === 1 ? 'hoyo' : 'hoyos'
        }. Si no jugaste el recorrido entero, cambia arriba a 9 hoyos.`,
      )
      return
    }

    setGuardando(true)
    try {
      const respuesta = await api.crearRonda({
        course: {
          name: campo.name.trim(),
          city: campo.city.trim() || null,
          country: campo.country.trim() || null,
        },
        played_on: datos.played_on,
        tournament_id: datos.tournament_id ? Number(datos.tournament_id) : null,
        weather: datos.weather || null,
        notes: datos.notes.trim() || null,
        holes: hoyos.map((hoyo) => ({
          hole_number: hoyo.hole_number,
          par: Number(hoyo.par),
          strokes: Number(hoyo.strokes),
          putts: hoyo.putts === '' ? null : Number(hoyo.putts),
          fairway_hit: hoyo.fairway_hit,
          green_in_regulation: hoyo.green_in_regulation,
        })),
      })

      actualizarUsuario({ handicap: respuesta.handicap })
      exito('¡Ronda guardada! Tu hándicap se ha actualizado.')
      navegar(`/rondas/${respuesta.ronda.id}`)
    } catch (fallo) {
      setError(fallo.message)
      avisarError('No se ha podido guardar la ronda.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="pagina">
      <div className="contenedor">
        <div className="pagina-cabecera">
          <div>
            <h1>Nueva ronda</h1>
            <p>Anota tu tarjeta hoyo a hoyo. Los totales se calculan solos.</p>
          </div>
        </div>

        <form onSubmit={guardar}>
          <section className="tarjeta seccion">
            <h2 className="seccion-titulo">Datos de la ronda</h2>

            <div className="fila-campos">
              <div className="campo">
                <label htmlFor="campo-nombre">Campo de golf</label>
                <input
                  id="campo-nombre"
                  type="text"
                  list="sugerencias-campos"
                  placeholder="Ej. Club de Campo Villa de Madrid"
                  value={campo.name}
                  onChange={(e) => setCampo({ ...campo, name: e.target.value })}
                  required
                />
                <datalist id="sugerencias-campos">
                  {sugerencias.map((sugerencia) => (
                    <option
                      key={`${sugerencia.name}-${sugerencia.city ?? ''}`}
                      value={sugerencia.name}
                    >
                      {[sugerencia.city, sugerencia.country].filter(Boolean).join(', ')}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="campo">
                <label htmlFor="campo-ciudad">Ciudad (opcional)</label>
                <input
                  id="campo-ciudad"
                  type="text"
                  value={campo.city}
                  onChange={(e) => setCampo({ ...campo, city: e.target.value })}
                />
              </div>

              <div className="campo">
                <label htmlFor="fecha">Fecha</label>
                <input
                  id="fecha"
                  type="date"
                  max={hoyIso()}
                  value={datos.played_on}
                  onChange={(e) => setDatos({ ...datos, played_on: e.target.value })}
                  required
                />
              </div>

              <div className="campo">
                <label htmlFor="torneo">Torneo (opcional)</label>
                <select
                  id="torneo"
                  value={datos.tournament_id}
                  onChange={(e) => setDatos({ ...datos, tournament_id: e.target.value })}
                >
                  <option value="">Ronda suelta</option>
                  {torneos.map((torneo) => (
                    <option key={torneo.id} value={torneo.id}>
                      {torneo.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label htmlFor="clima">Condiciones (opcional)</label>
                <select
                  id="clima"
                  value={datos.weather}
                  onChange={(e) => setDatos({ ...datos, weather: e.target.value })}
                >
                  <option value="">Sin especificar</option>
                  {CLIMAS.map((clima) => (
                    <option key={clima} value={clima}>
                      {clima}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label htmlFor="recorrido">Recorrido</label>
                <select
                  id="recorrido"
                  value={hoyos.length}
                  onChange={(e) => cambiarNumeroDeHoyos(Number(e.target.value))}
                >
                  <option value={9}>9 hoyos</option>
                  <option value={18}>18 hoyos</option>
                </select>
              </div>
            </div>
          </section>

          <section className="marcador">
            <div className="marcador-dato">
              <span>Par del recorrido</span>
              <strong>{totales.parTotal}</strong>
            </div>
            <div className="marcador-dato">
              <span>Tus golpes</span>
              <strong>{totales.golpes}</strong>
            </div>
            <div className="marcador-dato">
              <span>Resultado</span>
              <strong className={claseDiferencia(totales.diferencia)}>
                {formatearDiferencia(totales.diferencia)}
              </strong>
            </div>
            <div className="marcador-dato">
              <span>Hoyos anotados</span>
              <strong>
                {totales.hoyosJugados}/{hoyos.length}
              </strong>
            </div>
          </section>

          <section className="seccion">
            <div className="tarjeta-encabezado">
              <h2 className="seccion-titulo">Tarjeta</h2>
              <button
                type="button"
                className="btn-texto"
                onClick={() => setDetalleAbierto((abierto) => !abierto)}
                aria-expanded={detalleAbierto}
              >
                {detalleAbierto ? '− Ocultar putts y calles' : '+ Añadir putts, calles y greenes'}
              </button>
            </div>

            <div className="tabla-envoltorio">
              <table className="tabla tabla-tarjeta">
                <thead>
                  <tr>
                    <th scope="col">Hoyo</th>
                    <th scope="col">Par</th>
                    <th scope="col">Golpes</th>
                    {detalleAbierto && (
                      <>
                        <th scope="col">Putts</th>
                        <th scope="col">Calle</th>
                        <th scope="col">Green</th>
                      </>
                    )}
                    <th scope="col">+/−</th>
                  </tr>
                </thead>
                <tbody>
                  {hoyos.map((hoyo, indice) => {
                    const diferencia =
                      hoyo.strokes === '' ? null : Number(hoyo.strokes) - Number(hoyo.par)

                    return (
                      <tr key={hoyo.hole_number}>
                        <th scope="row" className="celda-hoyo">
                          {hoyo.hole_number}
                        </th>
                        <td>
                          <select
                            value={hoyo.par}
                            onChange={(e) => cambiarHoyo(indice, 'par', Number(e.target.value))}
                            aria-label={`Par del hoyo ${hoyo.hole_number}`}
                          >
                            {[3, 4, 5, 6].map((par) => (
                              <option key={par} value={par}>
                                {par}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            inputMode="numeric"
                            placeholder="—"
                            value={hoyo.strokes}
                            onChange={(e) => cambiarHoyo(indice, 'strokes', e.target.value)}
                            aria-label={`Golpes en el hoyo ${hoyo.hole_number}`}
                          />
                        </td>

                        {detalleAbierto && (
                          <>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max="15"
                                inputMode="numeric"
                                placeholder="—"
                                value={hoyo.putts}
                                onChange={(e) => cambiarHoyo(indice, 'putts', e.target.value)}
                                aria-label={`Putts en el hoyo ${hoyo.hole_number}`}
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                className="casilla"
                                // En los par 3 no se cuenta la calle.
                                disabled={Number(hoyo.par) < 4}
                                checked={hoyo.fairway_hit === true}
                                onChange={(e) =>
                                  cambiarHoyo(indice, 'fairway_hit', e.target.checked)
                                }
                                aria-label={`Calle acertada en el hoyo ${hoyo.hole_number}`}
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                className="casilla"
                                checked={hoyo.green_in_regulation === true}
                                onChange={(e) =>
                                  cambiarHoyo(indice, 'green_in_regulation', e.target.checked)
                                }
                                aria-label={`Green en regulación en el hoyo ${hoyo.hole_number}`}
                              />
                            </td>
                          </>
                        )}

                        <td className={claseDiferencia(diferencia)}>
                          {diferencia === null ? '—' : formatearDiferencia(diferencia)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="tarjeta seccion">
            <div className="campo">
              <label htmlFor="notas">Notas de la ronda (opcional)</label>
              <textarea
                id="notas"
                maxLength={2000}
                placeholder="Qué funcionó, qué no, con qué palos fallaste…"
                value={datos.notes}
                onChange={(e) => setDatos({ ...datos, notes: e.target.value })}
              />
            </div>
          </section>

          {error && (
            <p className="mensaje-error" role="alert">
              {error}
            </p>
          )}

          <div className="acciones-formulario">
            <button
              type="button"
              className="btn btn-secundario"
              onClick={() => navegar('/panel')}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar ronda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
