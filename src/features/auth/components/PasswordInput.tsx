'use client';

import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

interface PasswordStrength {
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  width: string;
}

function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
  if (score === 2) return { label: 'Fair', color: 'bg-orange-400', width: 'w-2/4' };
  if (score === 3) return { label: 'Good', color: 'bg-yellow-400', width: 'w-3/4' };
  return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
}

interface PasswordInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  showStrength?: boolean;
  label?: string;
  required?: boolean;
  autoComplete?: string;
}

export function PasswordInput({
  id = 'password',
  name = 'password',
  value,
  onChange,
  placeholder = 'Enter password',
  showStrength = true,
  label = 'Password',
  required = false,
  autoComplete = 'current-password',
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength ? getPasswordStrength(value) : null;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      </div>
      {showStrength && strength && (
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div className={`h-1.5 rounded-full transition-all ${strength.color} ${strength.width}`} />
          </div>
          <p className="text-xs text-gray-500">
            Strength: <span className="font-medium">{strength.label}</span>
          </p>
        </div>
      )}
    </div>
  );
}
