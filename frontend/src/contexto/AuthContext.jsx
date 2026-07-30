import { useCallback, useEffect, useMemo, useState } from 'react'
import { alCaducarSesion, almacenToken, api } from '../api/cliente'
import { AuthContext } from './contextos'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  // `cargando` evita el parpadeo de "no autenticado" mientras validamos el token.
  const [cargando, setCargando] = useState(true)

  const cerrarSesion = useCallback(() => {
    almacenToken.borrar()
    setUsuario(null)
  }, [])

  // Al arrancar validamos el token contra el servidor: así detectamos tokens
  // caducados o de un usuario ya borrado, cosa que mirar el localStorage no hace.
  useEffect(() => {
    let cancelado = false

    async function recuperarSesion() {
      if (!almacenToken.leer()) {
        setCargando(false)
        return
      }
      try {
        const perfil = await api.perfil()
        if (!cancelado) setUsuario(perfil)
      } catch {
        if (!cancelado) cerrarSesion()
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    recuperarSesion()
    return () => {
      cancelado = true
    }
  }, [cerrarSesion])

  // Si cualquier petición recibe un 401, cerramos sesión en toda la aplicación.
  useEffect(() => alCaducarSesion(cerrarSesion), [cerrarSesion])

  const iniciarSesion = useCallback(async (credenciales) => {
    const datos = await api.login(credenciales)
    almacenToken.guardar(datos.access_token)
    setUsuario(datos.user)
    return datos.user
  }, [])

  const registrarse = useCallback(async (datos) => {
    const respuesta = await api.registro(datos)
    almacenToken.guardar(respuesta.access_token)
    setUsuario(respuesta.user)
    return respuesta.user
  }, [])

  const actualizarUsuario = useCallback((datosNuevos) => {
    setUsuario((anterior) => (anterior ? { ...anterior, ...datosNuevos } : anterior))
  }, [])

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      autenticado: usuario !== null,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      actualizarUsuario,
    }),
    [usuario, cargando, iniciarSesion, registrarse, cerrarSesion, actualizarUsuario],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
