import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/cliente'
import Cargando from '../componentes/Cargando'
import EstadoVacio from '../componentes/EstadoVacio'
import { useNotificaciones } from '../hooks/useNotificaciones'
import { claseDiferencia, formatearDiferencia, formatearFecha } from '../utils/formato'

export default function DetalleTorneo() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { exito, error: avisarError } = useNotificaciones()

  const [torneo, setTorneo] = useState(null)
  const [rondas, setRondas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false

    Promise.all([api.detalleTorneo(id), api.listarRondas({ torneoId: id, limit: 100 })])
      .then(([datosTorneo, pagina]) => {
        if (cancelado) return
        setTorneo(datosTorneo)
        setRondas(pagina.items)
      })
      .catch((fallo) => !cancelado && setError(fallo.message))
      .finally(() => !cancelado && setCargando(false))

    return () => {
      cancelado = true
    }
  }, [id])

  const borrar = async () => {
    const confirmado = window.confirm(
      `¿Borrar el torneo "${torneo.name}"? Sus rondas se conservarán como rondas sueltas.`,
    )
    if (!confirmado) return

    try {
      await api.borrarTorneo(torneo.id)
      exito('Torneo eliminado.')
      navegar('/torneos')
    } catch (fallo) {
      avisarError(fallo.message)
    }
  }

  if (cargando) return <Cargando texto="Cargando el torneo…" />

  if (error || !torneo) {
    return (
      <div className="pagina">
        <div className="contenedor">
          <div className="estado-vacio" style={{ paddingTop: 70 }}>
            <span className="estado-vacio-icono" aria-hidden="true">
              🔍
            </span>
            <h3>No hemos encontrado este torneo</h3>
            <p>{error || 'Puede que lo hayas borrado.'}</p>
            <Link to="/torneos" className="btn btn-primario">
              Volver a mis torneos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pagina">
      <div className="contenedor">
        <div className="pagina-cabecera">
          <div>
            <Link to="/torneos" className="btn-texto">
              ← Mis torneos
            </Link>
            <h1>{torneo.name}</h1>
            <p>
              {formatearFecha(torneo.start_date)}
              {torneo.end_date ? ` – ${formatearFecha(torneo.end_date)}` : ''}
              {torneo.location ? ` · ${torneo.location}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to={`/rondas/nueva?torneo=${torneo.id}`} className="btn btn-primario">
              + Añadir ronda
            </Link>
            <button type="button" className="btn btn-peligro" onClick={borrar}>
              Borrar
            </button>
          </div>
        </div>

        <section className="rejilla-metricas seccion">
          <article className="metrica">
            <span className="metrica-etiqueta">Rondas</span>
            <span className="metrica-valor">{torneo.rondas_jugadas}</span>
          </article>
          <article className="metrica">
            <span className="metrica-etiqueta">Golpes totales</span>
            <span className="metrica-valor">{torneo.total_golpes ?? '—'}</span>
            <span className="metrica-nota">Par acumulado: {torneo.total_par ?? '—'}</span>
          </article>
          <article className="metrica">
            <span className="metrica-etiqueta">Resultado</span>
            <span className={`metrica-valor ${claseDiferencia(torneo.diferencia_par)}`}>
              {formatearDiferencia(torneo.diferencia_par)}
            </span>
          </article>
          <article className="metrica">
            <span className="metrica-etiqueta">Puesto final</span>
            <span className="metrica-valor">
              {torneo.final_position ? `${torneo.final_position}º` : '—'}
            </span>
          </article>
        </section>

        <section className="seccion">
          <h2 className="seccion-titulo">Rondas del torneo</h2>

          {rondas.length === 0 ? (
            <div className="tarjeta">
              <EstadoVacio
                icono="⛳"
                titulo="Este torneo aún no tiene rondas"
                descripcion="Registra una ronda y selecciona este torneo, o asígnale una ronda ya guardada desde su detalle."
                accion={{ a: `/rondas/nueva?torneo=${torneo.id}`, texto: 'Registrar ronda' }}
              />
            </div>
          ) : (
            <div className="tabla-envoltorio">
              <table className="tabla tabla-clicable">
                <thead>
                  <tr>
                    <th scope="col" className="alinear-izquierda">
                      Campo
                    </th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Hoyos</th>
                    <th scope="col">Par</th>
                    <th scope="col">Golpes</th>
                    <th scope="col">+/−</th>
                  </tr>
                </thead>
                <tbody>
                  {rondas.map((ronda) => (
                    <tr
                      key={ronda.id}
                      tabIndex={0}
                      onClick={() => navegar(`/rondas/${ronda.id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navegar(`/rondas/${ronda.id}`)}
                    >
                      <td className="alinear-izquierda texto-fuerte">{ronda.course.name}</td>
                      <td className="texto-tenue">{formatearFecha(ronda.played_on)}</td>
                      <td className="texto-tenue">{ronda.holes_played}</td>
                      <td className="texto-tenue">{ronda.total_par}</td>
                      <td className="texto-fuerte">{ronda.total_strokes}</td>
                      <td className={claseDiferencia(ronda.diferencia_par)}>
                        {formatearDiferencia(ronda.diferencia_par)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {torneo.notes && (
          <section className="tarjeta seccion">
            <h2 className="seccion-titulo">Notas</h2>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{torneo.notes}</p>
          </section>
        )}
      </div>
    </div>
  )
}
