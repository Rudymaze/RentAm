'use client';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function ProgressIndicator({ currentStep, totalSteps, stepLabels }: ProgressIndicatorProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span className="font-medium">Step {currentStep} of {totalSteps}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {stepLabels && stepLabels.length > 0 && (
        <div className="flex justify-between">
          {stepLabels.map((label, i) => (
            <span
              key={label}
              className={`text-xs ${i + 1 <= currentStep ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
