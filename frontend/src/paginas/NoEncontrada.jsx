import { Link } from 'react-router-dom'

export default function NoEncontrada() {
  return (
    <div className="pagina">
      <div className="contenedor">
        <div className="estado-vacio" style={{ paddingTop: '90px' }}>
          <span className="estado-vacio-icono" aria-hidden="true">
            🏌️
          </span>
          <h3>Bola fuera de límites</h3>
          <p>La página que buscas no existe o se ha movido de sitio.</p>
          <Link to="/" className="btn btn-primario">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
