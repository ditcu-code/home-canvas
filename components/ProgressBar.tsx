import React from 'react'

interface ProgressBarProps {
  value: number // 0 - 100
  label?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, label }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className="w-full h-4 rounded-full overflow-hidden shadow-inner progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-label={label || 'Progress'}
      >
        <div
          className="h-full transition-[width] duration-200 ease-out progress-fill"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm text-[hsl(var(--text-muted))]">
        <span>{label || 'Working...'}</span>
        <span>{clamped}%</span>
      </div>
    </div>
  )
}

export default ProgressBar
