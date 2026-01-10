interface TestimonialCarouselProps {
  testimonials?: Array<{ name: string; text: string; role: string }>;
}

export function TestimonialCarousel({
  testimonials = [],
}: TestimonialCarouselProps) {
  if (testimonials.length === 0) {
    return <p className="text-gray-500">Nenhum depoimento disponível</p>;
  }

  return (
    <div className="space-y-4">
      {testimonials.map((testimonial, index) => (
        <div key={index} className="border-l-4 border-blue-600 py-2 pl-4">
          <p className="italic text-gray-700">"{testimonial.text}"</p>
          <p className="mt-2 font-semibold text-gray-600">{testimonial.name}</p>
          <p className="text-sm text-gray-500">{testimonial.role}</p>
        </div>
      ))}
    </div>
  );
}
