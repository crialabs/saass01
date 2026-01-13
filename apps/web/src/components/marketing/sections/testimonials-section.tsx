'use client';

import { Card, CardContent } from '@repo/packages-ui/card';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

import { ScrollReveal } from '../animations/scroll-reveal';
import {
  StaggerContainer,
  staggerItemVariants,
} from '../animations/stagger-container';
import type { TestimonialsData } from '../types';

interface TestimonialsSectionProps {
  data: TestimonialsData;
}

export function TestimonialsSection({ data }: TestimonialsSectionProps) {
  return (
    <section className="bg-muted/30 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <ScrollReveal variant="fade" delay={0.1}>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {data.title}
            </h2>
          </ScrollReveal>
          {data.subtitle && (
            <ScrollReveal variant="fade" delay={0.2}>
              <p className="text-muted-foreground mt-4 text-xl">
                {data.subtitle}
              </p>
            </ScrollReveal>
          )}
        </div>

        <StaggerContainer staggerDelay={0.1} initialDelay={0.2}>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {data.testimonials.map((testimonial) => (
              <motion.div key={testimonial.id} variants={staggerItemVariants}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:border-primary/30 h-full border-2 transition-all hover:shadow-lg">
                    <CardContent className="p-6">
                      {testimonial.rating && (
                        <div className="mb-4 flex gap-1">
                          {Array.from({ length: testimonial.rating }).map(
                            (_, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                              >
                                <Star className="fill-primary text-primary h-5 w-5" />
                              </motion.div>
                            )
                          )}
                        </div>
                      )}
                      <blockquote className="text-muted-foreground mb-6 text-base">
                        "{testimonial.content}"
                      </blockquote>
                      <div className="flex items-center gap-3">
                        {testimonial.avatar ? (
                          <motion.img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="h-12 w-12 rounded-full object-cover"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ duration: 0.3 }}
                          />
                        ) : (
                          <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full font-semibold">
                            {testimonial.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {testimonial.role} at {testimonial.company}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </StaggerContainer>
      </div>
    </section>
  );
}
