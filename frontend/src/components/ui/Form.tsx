interface FlatInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const FlatInput = ({ label, ...props }: FlatInputProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      {...props}
      className={`w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#002d55] bg-gray-50 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors ${props.className || ''}`}
    />
  </div>
);

interface FlatSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string | number; label: string }[];
}

export const FlatSelect = ({ label, options, ...props }: FlatSelectProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      {...props}
      className={`w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#002d55] bg-gray-50 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors ${props.className || ''}`}
    >
      <option value="" disabled>Seleccione una opción...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);