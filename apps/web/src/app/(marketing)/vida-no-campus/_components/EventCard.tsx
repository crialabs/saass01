interface EventCardProps {
  title: string;
  date: string;
  location: string;
  description: string;
}

export function EventCard({
  title,
  date,
  location,
  description,
}: EventCardProps) {
  return (
    <div className="rounded-lg border p-4 transition-shadow hover:shadow-lg">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">📅 {date}</p>
      <p className="text-sm text-gray-500">📍 {location}</p>
      <p className="mt-2 text-gray-700">{description}</p>
    </div>
  );
}
