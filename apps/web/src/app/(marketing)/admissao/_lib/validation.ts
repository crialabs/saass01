export const inscricaoValidationSchemas = {
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value: string) => /^\d{10,11}$/.test(value),
  required: (value: string) => value.trim().length > 0,
  cpf: (value: string) => /^\d{11}$/.test(value),
};
