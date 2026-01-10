interface Bolsa {
  id: string;
  nome: string;
  descricao: string;
  percentual: number;
}

interface BolsasTableProps {
  bolsas?: Bolsa[];
}

export function BolsasTable({ bolsas = [] }: BolsasTableProps) {
  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="border border-gray-300 px-4 py-2">Bolsa</th>
          <th className="border border-gray-300 px-4 py-2">Descrição</th>
          <th className="border border-gray-300 px-4 py-2">Percentual</th>
        </tr>
      </thead>
      <tbody>
        {bolsas.map((bolsa) => (
          <tr key={bolsa.id}>
            <td className="border border-gray-300 px-4 py-2">{bolsa.nome}</td>
            <td className="border border-gray-300 px-4 py-2">
              {bolsa.descricao}
            </td>
            <td className="border border-gray-300 px-4 py-2">
              {bolsa.percentual}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
