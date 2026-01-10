interface CursosNivelPageProps {
  params: Promise<{ nivel: string }>;
}

export default async function CursosNivelPage({
  params,
}: CursosNivelPageProps) {
  const { nivel } = await params;

  return (
    <div>
      <h1 className="text-4xl font-bold">Cursos - Nível: {nivel}</h1>
      <p className="mt-4 text-lg">Cursos do nível: {nivel}</p>
    </div>
  );
}
