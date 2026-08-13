import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { PROJECT_COLORS } from '../lib/utils'

export function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROJECT_COLORS.map((color) => {
        const selected = value?.toLowerCase() === color
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Accent color ${color}`}
            aria-pressed={selected}
            className="relative flex h-8 w-8 items-center justify-center rounded-full transition-transform
                       hover:scale-110 active:scale-95"
            style={{ backgroundColor: color }}
          >
            {selected && (
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              >
                <Check className="h-4 w-4 text-white" strokeWidth={3} />
              </motion.span>
            )}
          </button>
        )
      })}
    </div>
  )
}
