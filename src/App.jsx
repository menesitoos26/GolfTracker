import { useState } from 'react'
import PaginaLR from './secciones/paginaConLoginRegistrarse/paginaConLoginRegistrarse'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=golf_course" />
      <PaginaLR />
    </>
  )
}

export default App
