interface BlogSlugPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogSlugPage({ params }: BlogSlugPageProps) {
  const { slug } = await params;

  return (
    <div>
      <h1 className="text-4xl font-bold">{slug}</h1>
      <p className="mt-4 text-lg">Artigo: {slug}</p>
    </div>
  );
}
