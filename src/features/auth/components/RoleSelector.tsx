'use client';

import type { UserRole } from '@/features/auth/types';

const ROLES: { value: Extract<UserRole, 'tenant' | 'landlord'>; label: string; description: string }[] = [
  {
    value: 'tenant',
    label: 'Tenant',
    description: 'I am looking for a home to rent or buy.',
  },
  {
    value: 'landlord',
    label: 'Landlord / Agent',
    description: 'I want to list properties for rent or sale.',
  },
];

interface RoleSelectorProps {
  value: UserRole | '';
  onChange: (role: UserRole) => void;
  required?: boolean;
}

export function RoleSelector({ value, onChange, required = false }: RoleSelectorProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="block text-sm font-medium text-gray-700">
        I am a
        {required && <span className="text-red-500 ml-1">*</span>}
      </legend>
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map((role) => (
          <label
            key={role.value}
            className={`flex flex-col gap-1 cursor-pointer rounded-xl border-2 p-4 transition-all ${
              value === role.value
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-indigo-300'
            }`}
          >
            <input
              type="radio"
              name="role"
              value={role.value}
              checked={value === role.value}
              onChange={() => onChange(role.value)}
              required={required}
              className="sr-only"
            />
            <span className="text-sm font-semibold text-gray-900">{role.label}</span>
            <span className="text-xs text-gray-500">{role.description}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
