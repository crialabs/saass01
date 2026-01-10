interface BlogCardProps {
  title: string;
  excerpt: string;
  slug: string;
  date: string;
}

export function BlogCard({ title, excerpt, slug, date }: BlogCardProps) {
  return (
    <article className="rounded-lg border p-4 transition-shadow hover:shadow-lg">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{date}</p>
      <p className="mt-2 text-gray-700">{excerpt}</p>
      <a
        href={`/blog/${slug}`}
        className="mt-4 inline-block text-blue-600 hover:underline"
      >
        Ler mais →
      </a>
    </article>
  );
}
