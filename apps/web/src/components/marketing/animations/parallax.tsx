'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { type ReactNode, useRef } from 'react';

interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  direction?: 'up' | 'down';
  className?: string;
}

export function Parallax({
  children,
  speed = 0.5,
  direction = 'up',
  className,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up'
      ? [100 * speed, -100 * speed]
      : [-100 * speed, 100 * speed]
  );

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
