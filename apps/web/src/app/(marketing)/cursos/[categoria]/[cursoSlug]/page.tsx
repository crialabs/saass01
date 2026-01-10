import { notFound } from 'next/navigation';

type Props = {
  params: {
    categoria: string;
    cursoSlug: string;
  };
};

export default async function CoursePage({ params }: Props) {
  const { categoria, cursoSlug } = params;

  // Mapear categoria da URL para nível interno
  const categoriaToNivel: Record<string, string> = {
    'curso-tecnico': 'tecnico',
    'curso-graduacao': 'graduacao',
    'pos-graduacao': 'pos_graduacao',
  };

  const nivel = categoriaToNivel[categoria];
  if (!nivel) {
    notFound();
  }

  // Buscar curso pelo slug + nível (via API )
  // const curso = await getCourseBySlugAndLevel(cursoSlug, nivel);

  // if (!curso) notFound();

  return (
    <div>
      <h1>{cursoSlug}</h1>
      <p>Categoria: {categoria}</p>
    </div>
  );
}
