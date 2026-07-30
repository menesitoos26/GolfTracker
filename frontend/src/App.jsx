import { Outlet, Route, Routes } from 'react-router-dom'
import Encabezado from './componentes/Encabezado'
import { RutaProtegida, RutaSoloInvitados } from './componentes/RutaProtegida'
import DetalleRonda from './paginas/DetalleRonda'
import DetalleTorneo from './paginas/DetalleTorneo'
import Estadisticas from './paginas/Estadisticas'
import Landing from './paginas/Landing'
import Login from './paginas/Login'
import MisRondas from './paginas/MisRondas'
import NoEncontrada from './paginas/NoEncontrada'
import NuevaRonda from './paginas/NuevaRonda'
import Panel from './paginas/Panel'
import Perfil from './paginas/Perfil'
import Registro from './paginas/Registro'
import Torneos from './paginas/Torneos'

/** Estructura común de las pantallas internas: encabezado + contenido. */
function Layout() {
  return (
    <>
      <Encabezado />
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />

        <Route element={<RutaSoloInvitados />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
        </Route>

        <Route element={<RutaProtegida />}>
          <Route path="/panel" element={<Panel />} />
          <Route path="/rondas" element={<MisRondas />} />
          <Route path="/rondas/nueva" element={<NuevaRonda />} />
          <Route path="/rondas/:id" element={<DetalleRonda />} />
          <Route path="/torneos" element={<Torneos />} />
          <Route path="/torneos/:id" element={<DetalleTorneo />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>

        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
