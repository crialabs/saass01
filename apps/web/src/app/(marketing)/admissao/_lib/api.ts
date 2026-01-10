export async function submitInscription(data: unknown) {
  const response = await fetch('/api/admissao/inscricao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Erro ao enviar inscrição');
  }

  return response.json();
}
