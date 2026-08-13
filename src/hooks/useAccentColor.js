import { useEffect } from 'react'
import { hexToRgbTriple } from '../lib/utils'

/**
 * Publishes a project's accent on the document root rather than on a wrapper
 * element, because modals and toasts render through portals into <body> —
 * anything scoped to a subtree inside the page would leave them on the
 * fallback indigo.
 */
export function useAccentColor(color) {
  useEffect(() => {
    if (!color) return
    const root = document.documentElement
    root.style.setProperty('--accent-rgb', hexToRgbTriple(color))
    return () => root.style.removeProperty('--accent-rgb')
  }, [color])
}
