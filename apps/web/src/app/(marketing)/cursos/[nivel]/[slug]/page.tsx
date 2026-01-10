interface CursoSlugPageProps {
  params: Promise<{ nivel: string; slug: string }>;
}

export default async function CursoSlugPage({ params }: CursoSlugPageProps) {
  const { nivel, slug } = await params;

  return (
    <div>
      <h1 className="text-4xl font-bold">{slug}</h1>
      <p className="mt-2 text-lg">Nível: {nivel}</p>
      <p className="mt-4 text-lg">Detalhes do curso: {slug}</p>
    </div>
  );
}
