'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Los layouts de cliente/admin hacen scroll dentro de `#main-content` (no en `window`),
 * y ese contenedor permanece montado al cambiar de pantalla. Next.js solo reinicia el scroll
 * de la ventana, así que sin esto la vista nueva abre en la posición de scroll de la anterior
 * y el header sticky tapa el inicio del contenido.
 *
 * Se reinicia solo cuando cambia el `pathname` (no con query params como `?clientId=`),
 * antes del primer pintado para evitar un parpadeo.
 */
export function useScrollResetOnNavigate(containerId = 'main-content') {
  const pathname = usePathname()

  useLayoutEffect(() => {
    const el = document.getElementById(containerId)
    if (el) el.scrollTop = 0
  }, [pathname, containerId])
}
