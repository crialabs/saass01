interface CursoSlugErrorProps {
  error: Error;
  reset: () => void;
}

export default function CursoSlugError({ error, reset }: CursoSlugErrorProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <h2 className="text-lg font-semibold text-red-800">
        Erro ao carregar curso
      </h2>
      <p className="mt-2 text-red-600">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Tentar novamente
      </button>
    </div>
  );
}
