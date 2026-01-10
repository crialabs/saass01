interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function BlogPagination({
  currentPage,
  totalPages,
  onPageChange,
}: BlogPaginationProps) {
  return (
    <div className="mt-8 flex gap-2">
      {currentPage > 1 && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded border px-4 py-2 hover:bg-gray-100"
        >
          ← Anterior
        </button>
      )}

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i + 1}
            onClick={() => onPageChange(i + 1)}
            className={`rounded px-3 py-2 ${
              currentPage === i + 1
                ? 'bg-blue-600 text-white'
                : 'border hover:bg-gray-100'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {currentPage < totalPages && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded border px-4 py-2 hover:bg-gray-100"
        >
          Próxima →
        </button>
      )}
    </div>
  );
}
