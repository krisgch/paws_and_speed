import type { PricingTier } from '../types/supabase.ts';

export function calculatePrice(runCount: number, tiers: PricingTier[]): number {
  const exact = tiers.find((t) => t.runs === runCount);
  if (exact) return exact.price;
  const perRun = tiers.find((t) => t.runs === 1)?.price ?? 0;
  return perRun * runCount;
}
