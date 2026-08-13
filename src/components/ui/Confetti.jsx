import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const COLORS = ['#6366f1', '#ec4899', '#f97316', '#eab308', '#22c55e', '#0ea5e9']
const PIECES = 70
const DURATION = 2.4

function burst() {
  return Array.from({ length: PIECES }, (_, i) => {
    // Fan the pieces upward and outward from the centre, then let gravity win.
    const angle = (-140 + Math.random() * 100) * (Math.PI / 180)
    const speed = 180 + Math.random() * 320
    return {
      id: `${Date.now()}-${i}`,
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
      drop: 420 + Math.random() * 340,
      rotate: (Math.random() - 0.5) * 900,
      delay: Math.random() * 0.18,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 6,
      round: Math.random() > 0.6,
    }
  })
}

/** Fires a one-shot burst whenever `trigger` changes to a new truthy value. */
export function Confetti({ trigger }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!trigger) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    setPieces(burst())
    const id = setTimeout(() => setPieces([]), DURATION * 1000)
    return () => clearTimeout(id)
  }, [trigger])

  if (!pieces.length) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      <div className="absolute left-1/2 top-1/3">
        {pieces.map((p) => (
          <motion.span
            key={p.id}
            className="absolute block"
            style={{
              width: p.size,
              height: p.round ? p.size : p.size * 0.5,
              backgroundColor: p.color,
              borderRadius: p.round ? '50%' : 2,
            }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: p.x,
              y: [0, p.y, p.y + p.drop],
              rotate: p.rotate,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: DURATION,
              delay: p.delay,
              ease: ['easeOut', 'easeIn'],
              times: [0, 0.35, 1],
            }}
          />
        ))}
      </div>
    </div>
  )
}
