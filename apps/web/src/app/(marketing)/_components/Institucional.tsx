export function Institucional() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-8 text-center text-4xl font-bold">
          Sobre a Instituição
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <h3 className="mb-4 text-2xl font-semibold">Missão</h3>
            <p className="text-gray-700">
              Proporcionando educação de qualidade que transforma comunidades
            </p>
          </div>
          <div className="text-center">
            <h3 className="mb-4 text-2xl font-semibold">Visão</h3>
            <p className="text-gray-700">
              Ser referência em excelência educacional na região
            </p>
          </div>
          <div className="text-center">
            <h3 className="mb-4 text-2xl font-semibold">Valores</h3>
            <p className="text-gray-700">
              Ética, qualidade, inovação e compromisso social
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
