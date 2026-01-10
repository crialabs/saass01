'use client';

import { motion, useInView } from 'framer-motion';
import { type ReactNode, useRef } from 'react';

interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  once?: boolean;
  className?: string;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  initialDelay = 0,
  once = true,
  className,
}: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};
