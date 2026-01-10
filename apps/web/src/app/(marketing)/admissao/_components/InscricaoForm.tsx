interface InscricaoFormProps {
  onSubmit?: (data: unknown) => void;
}

export function InscricaoForm({ onSubmit }: InscricaoFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.({});
      }}
      className="max-w-2xl space-y-4"
    >
      <input
        type="text"
        placeholder="Nome completo"
        className="w-full rounded border px-3 py-2"
        required
      />
      <input
        type="email"
        placeholder="E-mail"
        className="w-full rounded border px-3 py-2"
        required
      />
      <input
        type="tel"
        placeholder="Telefone"
        className="w-full rounded border px-3 py-2"
      />
      <select className="w-full rounded border px-3 py-2" required>
        <option value="">Selecione o curso</option>
        <option value="curso1">Curso 1</option>
        <option value="curso2">Curso 2</option>
      </select>
      <button
        type="submit"
        className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
      >
        Enviar Inscrição
      </button>
    </form>
  );
}
