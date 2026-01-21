interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
}

export function Toggle({ options, value, onChange }: ToggleProps) {
  return (
    <div className="flex rounded-lg bg-gray-800 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
            value === option.value
              ? 'bg-orange-500 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
