'use client';

import { Button } from '@repo/packages-ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/packages-ui/card';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { ScrollReveal } from '../animations/scroll-reveal';
import {
  StaggerContainer,
  staggerItemVariants,
} from '../animations/stagger-container';
import type { FeaturesData } from '../types';

interface FeaturesSectionProps {
  data: FeaturesData;
}

export function FeaturesSection({ data }: FeaturesSectionProps) {
  return (
    <section className="py-20 md:py-32">
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
          {data.description && (
            <ScrollReveal variant="fade" delay={0.3}>
              <p className="text-muted-foreground mt-2 text-base">
                {data.description}
              </p>
            </ScrollReveal>
          )}
        </div>

        <StaggerContainer staggerDelay={0.1} initialDelay={0.2}>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {data.features.map((feature) => (
              <motion.div key={feature.id} variants={staggerItemVariants}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <Card className="hover:border-primary/50 h-full border-2 transition-all hover:shadow-lg">
                    <CardHeader>
                      <motion.div
                        className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg"
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <span className="text-2xl">{feature.icon}</span>
                      </motion.div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    {feature.link && (
                      <CardContent>
                        <Button variant="link" className="p-0" asChild>
                          <a href={feature.link.href} className="group">
                            {feature.link.text}
                            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </a>
                        </Button>
                      </CardContent>
                    )}
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
