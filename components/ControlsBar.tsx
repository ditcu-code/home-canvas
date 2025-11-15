import Button from "@/components/Button"
import React from "react"

interface ControlsBarProps {
  canAdjust: boolean
  onAdjustScale: (delta: number) => void
  canChangeScene: boolean
  onChangeScene: () => void
  canReset: boolean
  onReset: () => void
}

const ControlsBar: React.FC<ControlsBarProps> = ({
  canAdjust,
  onAdjustScale,
  canChangeScene,
  onChangeScene,
  canReset,
  onReset,
}) => {
  return (
    <div className="text-center mt-4">
      <div className="min-h-[2rem] flex items-center justify-center gap-4 flex-wrap">
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
        {canChangeScene && (
          <Button variant="link" size="sm" onClick={onChangeScene}>
            Change Scene
          </Button>
        )}
        {canReset && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Start Over
          </Button>
        )}
      </div>
    </div>
  )
}

export default ControlsBar
