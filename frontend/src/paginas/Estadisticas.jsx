import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/cliente'
import Cargando from '../componentes/Cargando'
import EstadoVacio from '../componentes/EstadoVacio'
import { claseDiferencia, formatearDiferencia, formatearNumero } from '../utils/formato'
import { COLORES, COLORES_REPARTO, ESTILO_TOOLTIP } from '../utils/graficas'
import './estadisticas.css'

const ETIQUETAS_REPARTO = [
  { clave: 'eagles', nombre: 'Eagle o mejor' },
  { clave: 'birdies', nombre: 'Birdie' },
  { clave: 'pares', nombre: 'Par' },
  { clave: 'bogeys', nombre: 'Bogey' },
  { clave: 'dobles', nombre: 'Doble bogey' },
  { clave: 'triples_o_mas', nombre: 'Triple o peor' },
]

export default function Estadisticas() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false

    api
      .estadisticas()
      .then((respuesta) => !cancelado && setDatos(respuesta))
      .catch((fallo) => !cancelado && setError(fallo.message))
      .finally(() => !cancelado && setCargando(false))

    return () => {
      cancelado = true
    }
  }, [])

  if (cargando) return <Cargando texto="Calculando tus estadísticas…" />

  if (error) {
    return (
      <div className="pagina">
        <div className="contenedor">
          <p className="mensaje-error" role="alert">
            {error}
          </p>
        </div>
      </div>
    )
  }

  const { resumen, reparto, por_par: porPar, evolucion, por_campo: porCampo } = datos

  if (resumen.total_rondas === 0) {
    return (
      <div className="pagina">
        <div className="contenedor">
          <div className="pagina-cabecera">
            <h1>Estadísticas</h1>
          </div>
          <div className="tarjeta">
            <EstadoVacio
              icono="📊"
              titulo="Todavía no hay nada que analizar"
              descripcion="En cuanto registres tu primera ronda empezaremos a calcular tus medias, tu reparto de resultados y tu evolución."
              accion={{ a: '/rondas/nueva', texto: 'Registrar mi primera ronda' }}
            />
          </div>
        </div>
      </div>
    )
  }

  const datosReparto = ETIQUETAS_REPARTO.map((etiqueta, indice) => ({
    nombre: etiqueta.nombre,
    hoyos: reparto[etiqueta.clave],
    porcentaje: reparto.total_hoyos
      ? Number(((reparto[etiqueta.clave] / reparto.total_hoyos) * 100).toFixed(1))
      : 0,
    color: COLORES_REPARTO[indice],
  }))

  const datosEvolucion = evolucion.map((punto, indice) => ({
    etiqueta: `#${indice + 1}`,
    'Sobre par (18h)': punto.diferencia_par_18,
    campo: punto.campo,
    fecha: punto.played_on,
  }))

  const datosPorPar = porPar.map((fila) => ({
    nombre: `Par ${fila.par}`,
    'Media de golpes': fila.media_golpes,
    sobrePar: fila.media_sobre_par,
    hoyos: fila.hoyos_jugados,
  }))

  return (
    <div className="pagina">
      <div className="contenedor">
        <div className="pagina-cabecera">
          <div>
            <h1>Estadísticas</h1>
            <p>
              {resumen.total_rondas} rondas · {resumen.total_hoyos} hoyos analizados
            </p>
          </div>
        </div>

        <section className="rejilla-metricas seccion">
          <article className="metrica">
            <span className="metrica-etiqueta">Hándicap</span>
            <span className="metrica-valor">{resumen.handicap ?? '—'}</span>
            <span className="metrica-nota">
              {resumen.handicap === null ? 'Hacen falta 3 rondas' : 'World Handicap System'}
            </span>
          </article>
          <article className="metrica">
            <span className="metrica-etiqueta">Media a 18 hoyos</span>
            <span className="metrica-valor">{formatearNumero(resumen.media_golpes_18)}</span>
            <span className="metrica-nota">
              {formatearDiferencia(
                resumen.media_sobre_par_18 === null
                  ? null
                  : Math.round(resumen.media_sobre_par_18),
              )}{' '}
              sobre el par
            </span>
          </article>
          <article className="metrica">
            <span className="metrica-etiqueta">Mejor ronda</span>
            <span className={`metrica-valor ${claseDiferencia(resumen.mejor_ronda_sobre_par)}`}>
              {formatearDiferencia(resumen.mejor_ronda_sobre_par)}
            </span>
            <span className="metrica-nota">
              Peor: {formatearDiferencia(resumen.peor_ronda_sobre_par)}
            </span>
          </article>
          <article className="metrica">
            <span className="metrica-etiqueta">Putts por vuelta</span>
            <span className="metrica-valor">{formatearNumero(resumen.media_putts_18)}</span>
            <span className="metrica-nota">Media a 18 hoyos</span>
          </article>
          <article className="metrica">
            <span className="metrica-etiqueta">Calles acertadas</span>
            <span className="metrica-valor">
              {resumen.porcentaje_calles === null ? '—' : `${resumen.porcentaje_calles}%`}
            </span>
            <span className="metrica-nota">Sólo hoyos de par 4 y 5</span>
          </article>
          <article className="metrica">
            <span className="metrica-etiqueta">Greenes en regulación</span>
            <span className="metrica-valor">
              {resumen.porcentaje_greenes === null ? '—' : `${resumen.porcentaje_greenes}%`}
            </span>
            <span className="metrica-nota">
              {resumen.rondas_en_torneo} rondas en torneo
            </span>
          </article>
        </section>

        <div className="rejilla-graficas">
          <section className="tarjeta">
            <h2 className="seccion-titulo">Evolución de tus resultados</h2>
            <p className="texto-tenue estadisticas-nota">
              Golpes sobre el par de cada ronda, normalizados a 18 hoyos. Cuanto más baja la
              línea, mejor.
            </p>
            <div className="grafica-mediana">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={datosEvolucion}
                  margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORES.rejilla} />
                  <XAxis dataKey="etiqueta" stroke={COLORES.ejes} tickLine={false} fontSize={12} />
                  <YAxis stroke={COLORES.ejes} tickLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={ESTILO_TOOLTIP}
                    labelFormatter={(_, carga) => carga?.[0]?.payload?.campo ?? ''}
                  />
                  <Line
                    type="monotone"
                    dataKey="Sobre par (18h)"
                    stroke={COLORES.acento}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="tarjeta">
            <h2 className="seccion-titulo">Reparto de resultados</h2>
            <p className="texto-tenue estadisticas-nota">
              Cómo se reparten tus {reparto.total_hoyos} hoyos jugados.
            </p>
            <div className="grafica-mediana">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={datosReparto}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 34, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke={COLORES.rejilla}
                  />
                  <XAxis type="number" stroke={COLORES.ejes} fontSize={12} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    stroke={COLORES.ejes}
                    fontSize={11}
                    tickLine={false}
                    width={92}
                  />
                  <Tooltip
                    contentStyle={ESTILO_TOOLTIP}
                    cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                    formatter={(valor, _, elemento) => [
                      `${valor} hoyos (${elemento.payload.porcentaje}%)`,
                      'Total',
                    ]}
                  />
                  <Bar dataKey="hoyos" radius={[0, 5, 5, 0]}>
                    {datosReparto.map((fila) => (
                      <Cell key={fila.nombre} fill={fila.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="tarjeta">
            <h2 className="seccion-titulo">Rendimiento por tipo de hoyo</h2>
            <p className="texto-tenue estadisticas-nota">
              Media de golpes según el par del hoyo: aquí se ve dónde pierdes más.
            </p>
            <div className="grafica-mediana">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosPorPar} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORES.rejilla} />
                  <XAxis dataKey="nombre" stroke={COLORES.ejes} fontSize={12} tickLine={false} />
                  <YAxis stroke={COLORES.ejes} fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={ESTILO_TOOLTIP}
                    cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                    formatter={(valor, nombre, elemento) => [
                      `${valor} (${formatearDiferencia(
                        Math.round(elemento.payload.sobrePar * 10) / 10,
                      )} de media)`,
                      nombre,
                    ]}
                  />
                  <Bar dataKey="Media de golpes" fill={COLORES.par} radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="tarjeta">
            <h2 className="seccion-titulo">Tus campos</h2>
            <p className="texto-tenue estadisticas-nota">
              Dónde juegas mejor, ordenado por número de rondas.
            </p>
            <div className="tabla-envoltorio">
              <table className="tabla">
                <thead>
                  <tr>
                    <th scope="col" className="alinear-izquierda">
                      Campo
                    </th>
                    <th scope="col">Rondas</th>
                    <th scope="col">Media</th>
                    <th scope="col">Mejor</th>
                  </tr>
                </thead>
                <tbody>
                  {porCampo.map((campo) => (
                    <tr key={campo.campo}>
                      <td className="alinear-izquierda texto-fuerte">{campo.campo}</td>
                      <td className="texto-tenue">{campo.rondas}</td>
                      <td className={claseDiferencia(campo.media_sobre_par)}>
                        {formatearDiferencia(campo.media_sobre_par)}
                      </td>
                      <td className={claseDiferencia(campo.mejor_sobre_par)}>
                        {formatearDiferencia(campo.mejor_sobre_par)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
