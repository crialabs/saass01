export default function HomePage() {
  return (
    <main className="space-y-12">
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-4 text-5xl font-bold">Bem-vindo à Instituição</h1>
          <p className="mb-8 text-xl">
            Transformando vidas através da educação de qualidade
          </p>
          <button className="rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 hover:bg-gray-100">
            Conheça mais
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">
          Sobre Nossa Instituição
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">Excelência Acadêmica</h3>
            <p className="text-gray-600">
              Cursos de qualidade reconhecida nacionalmente, com corpo docente
              qualificado
            </p>
          </div>

          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">
              Infraestrutura Moderna
            </h3>
            <p className="text-gray-600">
              Laboratórios equipados e tecnologia de ponta para ensino e
              pesquisa
            </p>
          </div>

          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">Formação Integral</h3>
            <p className="text-gray-600">
              Desenvolvemos pessoas preparadas para os desafios do mercado de
              trabalho
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
