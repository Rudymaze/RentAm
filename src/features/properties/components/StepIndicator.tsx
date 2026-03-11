'use client';

const STEP_LABELS = ['Basic Info', 'Location', 'Amenities', 'Pricing', 'Photos', 'Review'];

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ currentStep, totalSteps = 6, onStepClick }: StepIndicatorProps) {
  const labels = STEP_LABELS.slice(0, totalSteps);
  const progressPct = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-gray-200">
        <div
          className="h-1.5 rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step dots + labels */}
      <div className="flex justify-between">
        {labels.map((label, idx) => {
          const step = idx + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isClickable = !!onStepClick && step <= currentStep;

          return (
            <button
              key={step}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step)}
              className={`flex flex-col items-center gap-1 disabled:cursor-default ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-indigo-600 text-white'
                    : isCurrent
                    ? 'border-2 border-indigo-600 bg-white text-indigo-600'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? '✓' : step}
              </span>
              <span
                className={`hidden text-xs sm:block ${
                  isCurrent ? 'font-semibold text-indigo-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
