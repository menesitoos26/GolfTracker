import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/cliente'
import Cargando from '../componentes/Cargando'
import EstadoVacio from '../componentes/EstadoVacio'
import { useAuth } from '../hooks/useAuth'
import {
  claseDiferencia,
  formatearDiferencia,
  formatearFecha,
  formatearNumero,
} from '../utils/formato'
import { ESTILO_TOOLTIP } from '../utils/graficas'
import './panel.css'

export default function Panel() {
  const { usuario } = useAuth()
  const [ultima, setUltima] = useState(null)
  const [estadisticas, setEstadisticas] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false

    Promise.all([api.ultimaRonda(), api.estadisticas()])
      .then(([ronda, stats]) => {
        if (cancelado) return
        setUltima(ronda)
        setEstadisticas(stats)
      })
      .catch((fallo) => !cancelado && setError(fallo.message))
      .finally(() => !cancelado && setCargando(false))

    return () => {
      cancelado = true
    }
  }, [])

  if (cargando) return <Cargando texto="Cargando tu panel…" />

  const resumen = estadisticas?.resumen

  const datosGrafica =
    ultima?.holes.map((hoyo) => ({
      hoyo: hoyo.hole_number,
      Par: hoyo.par,
      Golpes: hoyo.strokes,
    })) ?? []

  return (
    <div className="pagina">
      <div className="contenedor">
        <div className="pagina-cabecera">
          <div>
            <h1>Hola, {usuario?.name?.split(' ')[0]} 👋</h1>
            <p>Este es el resumen de tu juego.</p>
          </div>
          <Link to="/rondas/nueva" className="btn btn-primario">
            + Registrar ronda
          </Link>
        </div>

        {error && (
          <p className="mensaje-error" role="alert">
            {error}
          </p>
        )}

        <section className="rejilla-metricas seccion">
          <article className="metrica">
            <span className="metrica-etiqueta">Hándicap</span>
            <span className="metrica-valor">{usuario?.handicap ?? '—'}</span>
            <span className="metrica-nota">
              {usuario?.handicap === null || usuario?.handicap === undefined
                ? 'Necesitas 3 rondas para calcularlo'
                : 'Según el World Handicap System'}
            </span>
          </article>

          <article className="metrica">
            <span className="metrica-etiqueta">Rondas jugadas</span>
            <span className="metrica-valor">{resumen?.total_rondas ?? 0}</span>
            <span className="metrica-nota">{resumen?.total_hoyos ?? 0} hoyos en total</span>
          </article>

          <article className="metrica">
            <span className="metrica-etiqueta">Mejor ronda</span>
            <span className={`metrica-valor ${claseDiferencia(resumen?.mejor_ronda_sobre_par)}`}>
              {formatearDiferencia(resumen?.mejor_ronda_sobre_par)}
            </span>
            <span className="metrica-nota">Respecto al par</span>
          </article>

          <article className="metrica">
            <span className="metrica-etiqueta">Media (18 hoyos)</span>
            <span className="metrica-valor">
              {formatearNumero(resumen?.media_golpes_18, 1)}
            </span>
            <span className="metrica-nota">
              {formatearDiferencia(
                resumen?.media_sobre_par_18 === null || resumen?.media_sobre_par_18 === undefined
                  ? null
                  : Math.round(resumen.media_sobre_par_18),
              )}{' '}
              sobre el par
            </span>
          </article>
        </section>

        <section className="tarjeta seccion">
          <div className="panel-grafica-cabecera">
            <div>
              <h2 className="seccion-titulo" style={{ marginBottom: 4 }}>
                Última ronda
              </h2>
              {ultima && (
                <p className="texto-tenue" style={{ margin: 0, fontSize: 14 }}>
                  {ultima.course.name} · {formatearFecha(ultima.played_on)} ·{' '}
                  <span className={claseDiferencia(ultima.diferencia_par)}>
                    {formatearDiferencia(ultima.diferencia_par)}
                  </span>
                </p>
              )}
            </div>
            {ultima && (
              <Link to={`/rondas/${ultima.id}`} className="btn-texto">
                Ver tarjeta completa →
              </Link>
            )}
          </div>

          {!ultima ? (
            <EstadoVacio
              titulo="Aún no has registrado ninguna ronda"
              descripcion="Registra tu primera vuelta y empezarás a ver aquí tu progreso hoyo a hoyo."
              accion={{ a: '/rondas/nueva', texto: 'Registrar mi primera ronda' }}
            />
          ) : (
            <div className="panel-grafica">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafica} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3b5c40" />
                  <XAxis dataKey="hoyo" stroke="#aab8ac" tickLine={false} fontSize={12} />
                  <YAxis stroke="#aab8ac" tickLine={false} fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={ESTILO_TOOLTIP}
                    labelFormatter={(valor) => `Hoyo ${valor}`}
                    cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                  <Bar dataKey="Par" fill="#60a667" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Golpes" fill="#c1e9b6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="panel-accesos">
          <Link to="/rondas" className="panel-acceso">
            <span aria-hidden="true">📋</span>
            <strong>Mis rondas</strong>
            <span className="texto-tenue">Historial completo de vueltas</span>
          </Link>
          <Link to="/torneos" className="panel-acceso">
            <span aria-hidden="true">🏆</span>
            <strong>Torneos</strong>
            <span className="texto-tenue">
              {resumen?.total_torneos ?? 0} competiciones registradas
            </span>
          </Link>
          <Link to="/estadisticas" className="panel-acceso">
            <span aria-hidden="true">📊</span>
            <strong>Estadísticas</strong>
            <span className="texto-tenue">Dónde ganas y pierdes golpes</span>
          </Link>
        </section>
      </div>
    </div>
  )
}
