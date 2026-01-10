interface CursoCardProps {
  title: string;
  nivel: string;
  slug: string;
  description: string;
}

export function CursoCard({ title, nivel, slug, description }: CursoCardProps) {
  return (
    <div className="rounded-lg border p-4 transition-shadow hover:shadow-lg">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">Nível: {nivel}</p>
      <p className="mt-2 text-gray-700">{description}</p>
      <a
        href={`/cursos/${nivel}/${slug}`}
        className="mt-4 inline-block text-blue-600 hover:underline"
      >
        Ver detalhes →
      </a>
    </div>
  );
}
