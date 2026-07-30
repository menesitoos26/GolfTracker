/** Utilidades de formato compartidas por todas las pantallas. */

/** "+3", "-2" o "E" (par), que es como se lee un resultado en golf. */
export function formatearDiferencia(diferencia) {
  if (diferencia === null || diferencia === undefined) return '—'
  if (diferencia > 0) return `+${diferencia}`
  if (diferencia < 0) return `${diferencia}`
  return 'E'
}

/** Clase CSS según el resultado: verde bajo par, rojo sobre par. */
export function claseDiferencia(diferencia) {
  if (diferencia === null || diferencia === undefined) return ''
  if (diferencia > 0) return 'resultado-sobre-par'
  if (diferencia < 0) return 'resultado-bajo-par'
  return 'resultado-par'
}

/** Nombre del resultado de un hoyo respecto a su par. */
export function nombreResultadoHoyo(golpes, par) {
  const diferencia = golpes - par
  if (golpes === 1) return 'Hoyo en uno'
  if (diferencia <= -3) return 'Albatros'
  if (diferencia === -2) return 'Eagle'
  if (diferencia === -1) return 'Birdie'
  if (diferencia === 0) return 'Par'
  if (diferencia === 1) return 'Bogey'
  if (diferencia === 2) return 'Doble bogey'
  return `+${diferencia}`
}

const formateadorFecha = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/** Formatea una fecha ISO (YYYY-MM-DD) sin desfases de zona horaria. */
export function formatearFecha(fechaIso) {
  if (!fechaIso) return '—'
  const [anio, mes, dia] = fechaIso.split('-').map(Number)
  if (!anio || !mes || !dia) return fechaIso
  return formateadorFecha.format(new Date(anio, mes - 1, dia))
}

/** Fecha de hoy en formato YYYY-MM-DD según el calendario local. */
export function hoyIso() {
  const ahora = new Date()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${ahora.getFullYear()}-${mes}-${dia}`
}

export function formatearNumero(valor, decimales = 1) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toFixed(decimales)
}

export function obtenerIniciales(nombre) {
  if (!nombre || typeof nombre !== 'string') return '?'
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return '?'
  if (palabras.length === 1) return palabras[0].charAt(0).toUpperCase()
  return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase()
}
