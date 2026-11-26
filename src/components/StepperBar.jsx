import { Check } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Select Lists' },
  { id: 2, label: 'Choose Fields' },
  { id: 3, label: 'Options' },
  { id: 4, label: 'Preview' },
]

export default function StepperBar({ currentStep, onStepClick }) {
  return (
    <nav aria-label="Export progress" className="grid grid-cols-4 gap-1.5 px-6 pt-4 pb-2">
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id
        const isActive = currentStep === step.id
        const isFirst = index === 0
        const isLast = index === STEPS.length - 1

        // Chevron polygon clip paths so segments interlock cleanly like the design
        const clipPath = isFirst
          ? 'polygon(0% 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 0% 100%)'
          : isLast
            ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 10px 50%)'
            : 'polygon(0% 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 0% 100%, 10px 50%)'

        const roundClass = isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : ''

        return (
          <button
            key={step.id}
            type="button"
            disabled={!isCompleted}
            onClick={() => isCompleted && onStepClick?.(step.id)}
            style={{ clipPath }}
            className={`flex h-9 items-center justify-center gap-2 px-3 text-xs font-medium transition-colors ${roundClass} ${
              isActive
                ? 'bg-[#1f6336] text-white'
                : isCompleted
                  ? 'cursor-pointer bg-[#e6f0e7] text-[#173623] hover:bg-[#dae9dc]'
                  : 'cursor-default bg-[#ebf2ec] text-[#354c3d]'
            } ${!isFirst ? 'pl-4' : ''}`}
          >
            {isCompleted ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1f6336] text-white">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
            ) : (
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  isActive
                    ? 'bg-white text-[#1f6336]'
                    : 'bg-white text-[#1f442d] shadow-xs'
                }`}
              >
                {step.id}
              </span>
            )}
            <span className="truncate">{step.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
