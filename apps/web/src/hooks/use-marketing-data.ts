import { useQuery } from '@tanstack/react-query';

import type {
  CtaData,
  FeaturesData,
  HeroData,
  PricingData,
  StatsData,
  TestimonialsData,
} from '@/components/marketing/types';

export function useMarketingData<T>(section: string) {
  return useQuery({
    queryKey: ['marketing', section],
    queryFn: async () => {
      const response = await fetch(`/api/marketing/${section}`);
      if (!response.ok) {
        throw new Error('Failed to fetch marketing data');
      }
      return response.json() as Promise<T>;
    },
  });
}

export function useHeroData() {
  return useMarketingData<HeroData>('hero');
}

export function useFeaturesData() {
  return useMarketingData<FeaturesData>('features');
}

export function useStatsData() {
  return useMarketingData<StatsData>('stats');
}

export function usePricingData() {
  return useMarketingData<PricingData>('pricing');
}

export function useTestimonialsData() {
  return useMarketingData<TestimonialsData>('testimonials');
}

export function useCtaData() {
  return useMarketingData<CtaData>('cta');
}
