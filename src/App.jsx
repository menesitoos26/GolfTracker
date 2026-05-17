import { useState } from 'react'
import PaginaLR from './componentes/paginaConLoginRegistrarse/paginaConLoginRegistrarse'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <PaginaLR />
    </>
  )
}

export default App
