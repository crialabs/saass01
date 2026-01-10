interface BlogCategoriaPageProps {
  params: Promise<{ categoria: string }>;
}

export default async function BlogCategoriaPage({
  params,
}: BlogCategoriaPageProps) {
  const { categoria } = await params;

  return (
    <div>
      <h1 className="text-4xl font-bold">Categoria: {categoria}</h1>
      <p className="mt-4 text-lg">Artigos da categoria: {categoria}</p>
    </div>
  );
}
