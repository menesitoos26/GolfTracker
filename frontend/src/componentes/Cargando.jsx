export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="cargando" role="status">
      <div className="cargando-rueda" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  )
}
