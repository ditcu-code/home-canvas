import Button from "@/components/Button"
import React from "react"

interface ControlsBarProps {
  canAdjust: boolean
  onAdjustScale: (delta: number) => void
  canChangeScene: boolean
  onChangeScene: () => void
  canReset: boolean
  onReset: () => void
  showRetryButton?: boolean
  onRetryClick?: () => void
}

const ControlsBar: React.FC<ControlsBarProps> = ({
  canAdjust,
  onAdjustScale,
  canChangeScene,
  onChangeScene,
  canReset,
  onReset,
  showRetryButton,
  onRetryClick,
}) => {
  return (
    <div className="text-center mt-4">
      <div className="min-h-[2rem] flex items-center justify-center gap-4 flex-wrap">
        {canReset && (
          <Button variant="link" size="sm" onClick={onReset}>
            Start Over
          </Button>
        )}
        {canChangeScene && (
          <Button variant="link" size="sm" onClick={onChangeScene}>
            Change Scene
          </Button>
        )}
        {(showRetryButton ||
          canAdjust && (
            <span className="mx-2 text-[hsl(var(--border))] select-none" aria-hidden="true">
              |
            </span>
          ))}
        {showRetryButton && onRetryClick && (
          <Button variant="ghost" size="sm" onClick={onRetryClick}>
            Retry
          </Button>
        )}
        {canAdjust && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onAdjustScale(-0.1)}>
              Smaller
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAdjustScale(0.1)}>
              Bigger
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ControlsBar
