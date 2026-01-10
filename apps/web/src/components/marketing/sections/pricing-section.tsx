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
import { Check } from 'lucide-react';

import { ScrollReveal } from '../animations/scroll-reveal';
import {
  StaggerContainer,
  staggerItemVariants,
} from '../animations/stagger-container';
import type { PricingData } from '../types';

interface PricingSectionProps {
  data: PricingData;
}

export function PricingSection({ data }: PricingSectionProps) {
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
          <div className="grid gap-8 lg:grid-cols-3">
            {data.tiers.map((tier) => (
              <motion.div key={tier.id} variants={staggerItemVariants}>
                <motion.div
                  whileHover={{ y: -12, scale: 1.03 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="h-full"
                >
                  <Card
                    className={`relative h-full ${
                      tier.highlighted
                        ? 'border-primary ring-primary/20 shadow-xl ring-2'
                        : 'hover:border-primary/30 border-2'
                    }`}
                  >
                    {tier.highlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground rounded-full px-4 py-1 text-sm font-medium">
                          Popular
                        </span>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl">{tier.name}</CardTitle>
                      <CardDescription className="text-base">
                        {tier.description}
                      </CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">
                          {tier.currency}
                          {tier.price}
                        </span>
                        <span className="text-muted-foreground">
                          /{tier.period}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ul className="space-y-3">
                        {tier.features.map((feature, idx) => (
                          <motion.li
                            key={idx}
                            className="flex items-start gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                          >
                            <Check className="text-primary h-5 w-5 flex-shrink-0" />
                            <span className="text-muted-foreground text-sm">
                              {feature}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={tier.highlighted ? 'default' : 'outline'}
                        size="lg"
                        asChild
                      >
                        <a href={tier.ctaHref}>{tier.ctaText}</a>
                      </Button>
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
