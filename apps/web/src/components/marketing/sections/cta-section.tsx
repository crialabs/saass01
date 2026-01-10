'use client';

import { Button } from '@repo/packages-ui/button';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Parallax } from '../animations/parallax';
import { ScrollReveal } from '../animations/scroll-reveal';
import type { CtaData } from '../types';

interface CtaSectionProps {
  data: CtaData;
}

export function CtaSection({ data }: CtaSectionProps) {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container relative z-10 mx-auto px-4">
        <div className="from-primary to-primary/80 relative overflow-hidden rounded-3xl bg-gradient-to-r p-12 shadow-2xl md:p-16 lg:p-20">
          {data.backgroundImage && (
            <div className="absolute inset-0 opacity-20">
              <Parallax speed={0.2}>
                <img
                  src={data.backgroundImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </Parallax>
            </div>
          )}

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <ScrollReveal variant="zoom" delay={0.1}>
              <h2 className="text-primary-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {data.title}
              </h2>
            </ScrollReveal>

            <ScrollReveal variant="fade" delay={0.2}>
              <p className="text-primary-foreground/90 mt-6 text-lg md:text-xl">
                {data.description}
              </p>
            </ScrollReveal>

            <ScrollReveal variant="slide-up" delay={0.3}>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    asChild
                  >
                    <a href={data.ctaPrimary.href}>
                      {data.ctaPrimary.text}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </motion.div>
                {data.ctaSecondary && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto"
                      asChild
                    >
                      <a href={data.ctaSecondary.href}>
                        {data.ctaSecondary.text}
                      </a>
                    </Button>
                  </motion.div>
                )}
              </div>
            </ScrollReveal>
          </div>

          <div className="bg-primary-foreground/10 absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl" />
          <div className="bg-primary-foreground/10 absolute -bottom-10 -left-10 h-40 w-40 rounded-full blur-3xl" />
        </div>
      </div>
    </section>
  );
}
