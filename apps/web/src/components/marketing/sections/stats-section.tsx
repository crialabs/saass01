'use client';

import { motion } from 'framer-motion';

import { AnimatedCounter } from '../animations/animated-counter';
import { ScrollReveal } from '../animations/scroll-reveal';
import {
  StaggerContainer,
  staggerItemVariants,
} from '../animations/stagger-container';
import type { StatsData } from '../types';

interface StatsSectionProps {
  data: StatsData;
}

export function StatsSection({ data }: StatsSectionProps) {
  return (
    <section className="bg-muted/30 py-20 md:py-32">
      <div className="container mx-auto px-4">
        {(data.title || data.description) && (
          <div className="mb-16 text-center">
            {data.title && (
              <ScrollReveal variant="fade" delay={0.1}>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                  {data.title}
                </h2>
              </ScrollReveal>
            )}
            {data.description && (
              <ScrollReveal variant="fade" delay={0.2}>
                <p className="text-muted-foreground mt-4 text-xl">
                  {data.description}
                </p>
              </ScrollReveal>
            )}
          </div>
        )}

        <StaggerContainer staggerDelay={0.15} initialDelay={0.2}>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {data.stats.map((stat) => (
              <motion.div
                key={stat.id}
                variants={staggerItemVariants}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-card rounded-lg border p-8 text-center shadow-sm">
                  <div className="text-primary text-4xl font-bold md:text-5xl">
                    <AnimatedCounter
                      value={stat.value}
                      duration={2.5}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      decimals={stat.decimals}
                    />
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm font-medium md:text-base">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </StaggerContainer>
      </div>
    </section>
  );
}
