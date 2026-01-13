'use client';

import { Button } from '@repo/packages-ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Parallax } from '../animations/parallax';
import { ScrollReveal } from '../animations/scroll-reveal';
import type { HeroData } from '../types';

interface HeroSectionProps {
  data: HeroData;
}

export function HeroSection({ data }: HeroSectionProps) {
  return (
    <section className="from-background to-muted/20 relative overflow-hidden bg-gradient-to-b py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            {data.badge && (
              <ScrollReveal variant="fade" delay={0.1}>
                <motion.div
                  className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="h-4 w-4" />
                  {data.badge}
                </motion.div>
              </ScrollReveal>
            )}

            <ScrollReveal variant="slide-up" delay={0.2}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                {data.title}
              </h1>
            </ScrollReveal>

            <ScrollReveal variant="slide-up" delay={0.3}>
              <p className="text-muted-foreground text-xl md:text-2xl">
                {data.subtitle}
              </p>
            </ScrollReveal>

            <ScrollReveal variant="slide-up" delay={0.4}>
              <p className="text-muted-foreground text-base md:text-lg">
                {data.description}
              </p>
            </ScrollReveal>

            <ScrollReveal variant="slide-up" delay={0.5}>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <a href={data.ctaPrimary.href}>
                    {data.ctaPrimary.text}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                {data.ctaSecondary && (
                  <Button size="lg" variant="outline" asChild>
                    <a href={data.ctaSecondary.href}>
                      {data.ctaSecondary.text}
                    </a>
                  </Button>
                )}
              </div>
            </ScrollReveal>
          </div>

          {data.image && (
            <div className="relative lg:order-last">
              <Parallax speed={0.3}>
                <ScrollReveal variant="zoom" delay={0.3}>
                  <motion.div
                    className="from-primary/20 to-primary/5 relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br shadow-2xl"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={data.image}
                      alt="Hero"
                      className="h-full w-full object-cover"
                    />
                  </motion.div>
                </ScrollReveal>
              </Parallax>
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Parallax speed={0.2} direction="down">
          <div className="bg-primary/10 absolute -top-1/2 right-0 h-96 w-96 rounded-full blur-3xl" />
        </Parallax>
        <Parallax speed={0.15}>
          <div className="bg-primary/5 absolute bottom-0 left-0 h-96 w-96 rounded-full blur-3xl" />
        </Parallax>
      </div>
    </section>
  );
}
