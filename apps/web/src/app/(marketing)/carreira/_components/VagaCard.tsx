interface VagaCardProps {
  title: string;
  company: string;
  location: string;
  type: string;
}

export function VagaCard({ title, company, location, type }: VagaCardProps) {
  return (
    <div className="rounded-lg border p-4 transition-shadow hover:shadow-lg">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{company}</p>
      <p className="text-sm text-gray-500">📍 {location}</p>
      <span className="mt-2 inline-block rounded bg-blue-100 px-3 py-1 text-sm text-blue-800">
        {type}
      </span>
    </div>
  );
}
