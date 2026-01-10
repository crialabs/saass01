interface VagaFilterProps {
  selectedType?: string;
  onFilterChange?: (type: string) => void;
}

export function VagaFilter({ selectedType, onFilterChange }: VagaFilterProps) {
  const types = ['Estágio', 'Trainee', 'Júnior', 'Pleno', 'Sênior'];

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => onFilterChange?.(type)}
          className={`rounded px-4 py-2 ${
            selectedType === type
              ? 'bg-blue-600 text-white'
              : 'border hover:bg-gray-100'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
