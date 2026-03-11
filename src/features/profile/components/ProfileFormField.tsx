'use client';

interface ProfileFormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maxLength?: number;
  placeholder?: string;
}

export function ProfileFormField({
  label,
  value,
  onChange,
  error,
  maxLength,
  placeholder,
}: ProfileFormFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {maxLength !== undefined && (
          <span
            className={`text-xs ${
              value.length > maxLength ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 ${
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300 focus:border-indigo-400'
        }`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
