import React from 'react'

interface ProgressStepsProps {
  currentStep: number // 0-based index
  steps?: string[]
}

const defaultSteps = [
  "Upload Jewelry",
  "Upload Scene",
  "Place Jewelry",
  "Generate",
  "Review & Download",
]

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep, steps = defaultSteps }) => {
  const clampedCurrent = Math.max(0, Math.min(steps.length - 1, Math.round(currentStep)))

  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-center gap-4 md:gap-6 flex-wrap">
        {steps.map((label, idx) => {
          const state =
            idx < clampedCurrent ? 'complete' : idx === clampedCurrent ? 'current' : 'upcoming'
          const isComplete = state === 'complete'
          const isCurrent = state === 'current'
          return (
            <li key={label} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={[
                    'h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ring-1 ring-inset',
                    isComplete
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] ring-[hsl(var(--primary))]'
                      : isCurrent
                      ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] ring-[hsl(var(--accent))]'
                      : 'bg-[hsl(var(--surface))] text-[hsl(var(--text-muted))] ring-[hsl(var(--border))]',
                  ].join(' ')}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {idx + 1}
                </div>
                <span
                  className={[
                    'text-sm md:text-base font-medium',
                    isComplete ? 'text-[hsl(var(--text))]' : isCurrent ? 'text-[hsl(var(--text))]' : 'text-[hsl(var(--text-muted))]',
                  ].join(' ')}
                >
                  {label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <span className="mx-2 md:mx-3 h-px w-6 md:w-10 bg-[hsl(var(--border))]" aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default ProgressSteps
