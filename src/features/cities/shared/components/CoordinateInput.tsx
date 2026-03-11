'use client';

interface CoordValue {
  lat: number | '';
  lon: number | '';
}

interface CoordinateInputProps {
  value: CoordValue;
  onChange: (value: CoordValue) => void;
  error?: string;
  onMapPickerOpen?: () => void;
}

export function CoordinateInput({ value, onChange, error, onMapPickerOpen }: CoordinateInputProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Latitude</label>
          <input
            type="number"
            step="0.0001"
            min={1.67}
            max={13.0}
            value={value.lat}
            onChange={(e) => onChange({ ...value, lat: e.target.value === '' ? '' : parseFloat(e.target.value) })}
            placeholder="e.g. 3.8480"
            className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${
              error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Longitude</label>
          <input
            type="number"
            step="0.0001"
            min={8.5}
            max={16.0}
            value={value.lon}
            onChange={(e) => onChange({ ...value, lon: e.target.value === '' ? '' : parseFloat(e.target.value) })}
            placeholder="e.g. 11.5021"
            className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${
              error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          />
        </div>
      </div>
      {onMapPickerOpen && (
        <button
          type="button"
          onClick={onMapPickerOpen}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
        >
          Use Map Picker
        </button>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
