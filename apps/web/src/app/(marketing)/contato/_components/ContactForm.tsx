interface ContactFormProps {
  onSubmit?: (data: unknown) => void;
}

export function ContactForm({ onSubmit }: ContactFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.({});
      }}
      className="max-w-md space-y-4"
    >
      <input
        type="text"
        placeholder="Nome"
        className="w-full rounded border px-3 py-2"
        required
      />
      <input
        type="email"
        placeholder="E-mail"
        className="w-full rounded border px-3 py-2"
        required
      />
      <textarea
        placeholder="Mensagem"
        rows={5}
        className="w-full rounded border px-3 py-2"
        required
      />
      <button
        type="submit"
        className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
      >
        Enviar
      </button>
    </form>
  );
}
