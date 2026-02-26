import { calculatePrice } from '../utils/pricing.ts';
import type { PricingTier } from '../types/supabase.ts';

interface PricingCalculatorProps {
  runCount: number;
  tiers: PricingTier[];
}

export default function PricingCalculator({ runCount, tiers }: PricingCalculatorProps) {
  if (!tiers.length) return null;
  const price = calculatePrice(runCount, tiers);
  const matchedTier = tiers.find((t) => t.runs === runCount);

  return (
    <div
      className="flex items-center justify-between"
      style={{
        background: 'rgba(255,107,44,0.08)',
        border: '1px solid rgba(255,107,44,0.25)',
        borderRadius: '8px',
        padding: '10px 14px',
      }}
    >
      <span className="text-[13px]" style={{ color: '#8b90a5' }}>
        {matchedTier ? matchedTier.label : `${runCount} run${runCount !== 1 ? 's' : ''}`}
      </span>
      <span className="font-display text-[18px]" style={{ color: '#ff6b2c' }}>
        ฿{price.toLocaleString()}
      </span>
    </div>
  );
}
