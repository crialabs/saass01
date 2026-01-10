export interface HeroData {
  title: string;
  subtitle: string;
  description: string;
  ctaPrimary: {
    text: string;
    href: string;
  };
  ctaSecondary?: {
    text: string;
    href: string;
  };
  image?: string;
  badge?: string;
}

export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  link?: {
    text: string;
    href: string;
  };
}

export interface FeaturesData {
  title: string;
  subtitle?: string;
  description?: string;
  features: Array<Feature>;
}

export interface Stat {
  id: string;
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export interface StatsData {
  title?: string;
  description?: string;
  stats: Array<Stat>;
}

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  period: string;
  currency: string;
  features: Array<string>;
  highlighted?: boolean;
  ctaText: string;
  ctaHref: string;
}

export interface PricingData {
  title: string;
  subtitle?: string;
  description?: string;
  tiers: Array<PricingTier>;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating?: number;
}

export interface TestimonialsData {
  title: string;
  subtitle?: string;
  testimonials: Array<Testimonial>;
}

export interface CtaData {
  title: string;
  description: string;
  ctaPrimary: {
    text: string;
    href: string;
  };
  ctaSecondary?: {
    text: string;
    href: string;
  };
  backgroundImage?: string;
}
