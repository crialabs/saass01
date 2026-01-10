interface CursoFilterProps {
  selectedNivel?: string;
  onFilterChange?: (nivel: string) => void;
}

export function CursoFilter({
  selectedNivel,
  onFilterChange,
}: CursoFilterProps) {
  const levels = ['Ensino Médio', 'Técnico', 'Graduação', 'Pós-Graduação'];

  return (
    <div className="mb-6 flex gap-2">
      {levels.map((level) => (
        <button
          key={level}
          onClick={() => onFilterChange?.(level)}
          className={`rounded px-4 py-2 ${
            selectedNivel === level
              ? 'bg-blue-600 text-white'
              : 'border hover:bg-gray-100'
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
