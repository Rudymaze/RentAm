'use client';

import { FiArrowLeft, FiArrowRight, FiLoader } from 'react-icons/fi';
import { FiCheckCircle } from 'react-icons/fi';

interface StepNavigationProps {
  onBack: () => void;
  onNext: () => void;
  isLoading?: boolean;
  isLastStep?: boolean;
  backDisabled?: boolean;
}

export function StepNavigation({
  onBack,
  onNext,
  isLoading = false,
  isLastStep = false,
  backDisabled = false,
}: StepNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-4">
      <button
        type="button"
        onClick={onBack}
        disabled={backDisabled || isLoading}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FiArrowLeft size={16} />
        Back
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <FiLoader size={16} className="animate-spin" />
            {isLastStep ? 'Completing…' : 'Saving…'}
          </>
        ) : isLastStep ? (
          <>
            <FiCheckCircle size={16} />
            Complete
          </>
        ) : (
          <>
            Next
            <FiArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}
