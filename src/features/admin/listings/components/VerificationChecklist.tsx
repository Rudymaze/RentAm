import { FiCheck } from 'react-icons/fi';
import type { VerificationChecklist } from '../types';

const CHECKLIST_LABELS: Record<keyof VerificationChecklist, string> = {
  photos_authentic: 'Photos are authentic (not stock or fake)',
  location_valid: 'Location is valid and within Cameroon',
  pricing_reasonable: 'Pricing is reasonable for the area',
  description_detailed: 'Description is detailed and accurate',
  landlord_verified: 'Landlord identity is verified',
};

interface VerificationChecklistProps {
  checklist: VerificationChecklist;
  onChange: (key: keyof VerificationChecklist, value: boolean) => void;
  disabled?: boolean;
}

export function VerificationChecklist({
  checklist,
  onChange,
  disabled = false,
}: VerificationChecklistProps) {
  const keys = Object.keys(CHECKLIST_LABELS) as Array<keyof VerificationChecklist>;

  return (
    <div className="space-y-2">
      {keys.map((key) => {
        const checked = checklist[key] ?? false;
        return (
          <label
            key={key}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
              disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'
            } ${checked ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}
          >
            {/* Custom checkbox */}
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(key, e.target.checked)}
                className="sr-only"
              />
              <div
                className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                  checked
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {checked && <FiCheck className="h-3 w-3 text-white" strokeWidth={3} />}
              </div>
            </div>

            {/* Label */}
            <span
              className={`text-sm leading-snug ${
                checked ? 'font-medium text-green-800' : 'text-gray-700'
              }`}
            >
              {CHECKLIST_LABELS[key]}
            </span>
          </label>
        );
      })}
    </div>
  );
}
