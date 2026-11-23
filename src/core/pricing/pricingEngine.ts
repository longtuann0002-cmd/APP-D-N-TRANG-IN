import { LaminationType, PaperFinishType, PriceTier } from '../../types';

export interface SizePricingRule {
  id: string;
  name: string;
  dimensionsText: string;
  widthMm: number;
  heightMm: number;
  category: 'small_polaroid' | 'large_print' | 'photoscript';
  tiers: { minQty: number; maxQty?: number; unitPrice: number }[];
}

export const STUDIO_PRICING_RULES: SizePricingRule[] = [
  // Nhóm 1: Khổ nhỏ & vừa
  {
    id: '5x7',
    name: 'Khổ 5×7',
    dimensionsText: '50×70 mm',
    widthMm: 50,
    heightMm: 70,
    category: 'small_polaroid',
    tiers: [
      { minQty: 1, maxQty: 10, unitPrice: 2500 },
      { minQty: 11, maxQty: 40, unitPrice: 2000 },
      { minQty: 41, maxQty: 140, unitPrice: 1500 },
      { minQty: 141, unitPrice: 1300 },
    ]
  },
  {
    id: '6x9',
    name: 'Khổ 6×9 / 5.5×8.5 (Polaroid mini)',
    dimensionsText: '60×90 / 55×85 mm',
    widthMm: 60,
    heightMm: 90,
    category: 'small_polaroid',
    tiers: [
      { minQty: 1, maxQty: 10, unitPrice: 3000 },
      { minQty: 11, maxQty: 40, unitPrice: 2500 },
      { minQty: 41, maxQty: 140, unitPrice: 2000 },
      { minQty: 141, unitPrice: 1800 },
    ]
  },
  {
    id: '7.5x10',
    name: 'Khổ 7.5×10',
    dimensionsText: '75×100 mm',
    widthMm: 75,
    heightMm: 100,
    category: 'small_polaroid',
    tiers: [
      { minQty: 1, maxQty: 10, unitPrice: 3500 },
      { minQty: 11, maxQty: 40, unitPrice: 3000 },
      { minQty: 41, maxQty: 140, unitPrice: 2500 },
      { minQty: 141, unitPrice: 2800 },
    ]
  },
  {
    id: '8.6x10.8',
    name: 'Khổ 8.6×10.8 (Polaroid Square)',
    dimensionsText: '86×108 mm',
    widthMm: 86,
    heightMm: 108,
    category: 'small_polaroid',
    tiers: [
      { minQty: 1, maxQty: 10, unitPrice: 4000 },
      { minQty: 11, maxQty: 40, unitPrice: 3500 },
      { minQty: 41, maxQty: 140, unitPrice: 3000 },
      { minQty: 141, unitPrice: 2800 },
    ]
  },

  // Nhóm 2: Khổ lớn
  {
    id: '10x15',
    name: 'Khổ 10×15 (Polaroid / Tràn viền)',
    dimensionsText: '100×150 mm',
    widthMm: 100,
    heightMm: 150,
    category: 'large_print',
    tiers: [
      { minQty: 1, maxQty: 30, unitPrice: 5000 },
      { minQty: 31, maxQty: 100, unitPrice: 4500 },
      { minQty: 101, unitPrice: 4000 },
    ]
  },
  {
    id: '13x18',
    name: 'Khổ 13×18 (Polaroid / Tràn viền)',
    dimensionsText: '130×180 mm',
    widthMm: 130,
    heightMm: 180,
    category: 'large_print',
    tiers: [
      { minQty: 1, maxQty: 30, unitPrice: 10000 },
      { minQty: 31, maxQty: 100, unitPrice: 9500 },
      { minQty: 101, unitPrice: 9000 },
    ]
  },
  {
    id: '15x21',
    name: 'Khổ 15×21 (Khổ A5)',
    dimensionsText: '150×210 mm',
    widthMm: 150,
    heightMm: 210,
    category: 'large_print',
    tiers: [
      { minQty: 1, maxQty: 30, unitPrice: 12000 },
      { minQty: 31, maxQty: 100, unitPrice: 11500 },
      { minQty: 101, unitPrice: 11000 },
    ]
  },

  // Nhóm 3: Dải ảnh Photoscript / Photobooth
  {
    id: 'photoscript-5x15',
    name: 'Photoscript 5×15 (3-4 ảnh)',
    dimensionsText: '50×150 mm',
    widthMm: 50,
    heightMm: 150,
    category: 'photoscript',
    tiers: [
      { minQty: 1, maxQty: 10, unitPrice: 3500 },
      { minQty: 11, maxQty: 40, unitPrice: 3000 },
      { minQty: 41, maxQty: 140, unitPrice: 2500 },
      { minQty: 141, unitPrice: 2000 },
    ]
  },
  {
    id: 'photoscript-10x15',
    name: 'Photoscript 10×15 (4-6 ảnh)',
    dimensionsText: '100×150 mm',
    widthMm: 100,
    heightMm: 150,
    category: 'photoscript',
    tiers: [
      { minQty: 1, maxQty: 10, unitPrice: 6000 },
      { minQty: 11, maxQty: 40, unitPrice: 5500 },
      { minQty: 41, maxQty: 140, unitPrice: 5000 },
      { minQty: 141, unitPrice: 4500 },
    ]
  }
];

export function getActivePricingRules(customRules?: SizePricingRule[]): SizePricingRule[] {
  if (customRules && customRules.length > 0) return customRules;
  try {
    const data = localStorage.getItem('photodesk_tiered_prices_v1');
    if (data) return JSON.parse(data);
  } catch {}
  return STUDIO_PRICING_RULES;
}

/**
 * Calculates lamination extra fee per unit based on quantity
 */
export function getLaminationSurcharge(lamination: LaminationType = 'none', qty: number = 1): number {
  if (lamination === 'none') return 0;
  let s = { plasticMatteUnder50: 500, plasticMatte50Plus: 300, glitterUnder50: 1000, glitter50Plus: 800 };
  try {
    const data = localStorage.getItem('photodesk_lamination_prices_v1');
    if (data) s = { ...s, ...JSON.parse(data) };
  } catch {}

  if (lamination === 'plastic_matte') {
    return qty < 50 ? s.plasticMatteUnder50 : s.plasticMatte50Plus;
  }
  if (lamination === 'glitter') {
    return qty < 50 ? s.glitterUnder50 : s.glitter50Plus;
  }
  return 0;
}

/**
 * Matches width & height (or name/id) to the best pricing rule
 */
export function findMatchingPricingRule(
  wMm: number,
  hMm: number,
  nameOrId?: string,
  subSlotLayout?: string,
  customRules?: SizePricingRule[]
): SizePricingRule {
  const rules = getActivePricingRules(customRules);
  const normW = Math.min(wMm, hMm);
  const normH = Math.max(wMm, hMm);
  const text = (nameOrId || '').toLowerCase();
  const isPhotoscript = subSlotLayout?.startsWith('strip') || subSlotLayout === 'grid-2x2' || text.includes('photobooth') || text.includes('photoscript');

  // Check photoscript first if applicable
  if (isPhotoscript) {
    if (Math.abs(normW - 100) < 15 && Math.abs(normH - 150) < 15) {
      return rules.find(r => r.id === 'photoscript-10x15') || STUDIO_PRICING_RULES.find(r => r.id === 'photoscript-10x15')!;
    }
    return rules.find(r => r.id === 'photoscript-5x15') || STUDIO_PRICING_RULES.find(r => r.id === 'photoscript-5x15')!;
  }

  // Exact ID / Name match
  if (text.includes('15x21') || text.includes('15×21') || (Math.abs(normW - 150) < 8 && Math.abs(normH - 210) < 8)) {
    return rules.find(r => r.id === '15x21') || STUDIO_PRICING_RULES.find(r => r.id === '15x21')!;
  }
  if (text.includes('13x18') || text.includes('13×18') || (Math.abs(normW - 130) < 8 && Math.abs(normH - 180) < 8)) {
    return rules.find(r => r.id === '13x18') || STUDIO_PRICING_RULES.find(r => r.id === '13x18')!;
  }
  if (text.includes('10x15') || text.includes('10×15') || (Math.abs(normW - 100) < 8 && Math.abs(normH - 150) < 8)) {
    return rules.find(r => r.id === '10x15') || STUDIO_PRICING_RULES.find(r => r.id === '10x15')!;
  }
  if (text.includes('8.6x10.8') || text.includes('square') || (Math.abs(normW - 86) < 8 && Math.abs(normH - 108) < 8) || (Math.abs(normW - 72) < 8 && Math.abs(normH - 86) < 8)) {
    return rules.find(r => r.id === '8.6x10.8') || STUDIO_PRICING_RULES.find(r => r.id === '8.6x10.8')!;
  }
  if (text.includes('7.5x10') || text.includes('7.5×10') || (Math.abs(normW - 75) < 8 && Math.abs(normH - 100) < 8)) {
    return rules.find(r => r.id === '7.5x10') || STUDIO_PRICING_RULES.find(r => r.id === '7.5x10')!;
  }
  if (text.includes('5x7') || text.includes('5×7') || (Math.abs(normW - 50) < 8 && Math.abs(normH - 70) < 8)) {
    return rules.find(r => r.id === '5x7') || STUDIO_PRICING_RULES.find(r => r.id === '5x7')!;
  }

  // Default to 6x9 / 5.5x8.5 (Polaroid mini)
  return rules.find(r => r.id === '6x9') || STUDIO_PRICING_RULES.find(r => r.id === '6x9')!;
}

/**
 * Calculates the unit print price based on quantity tiers
 */
export function getTierUnitPrice(rule: SizePricingRule, qty: number): number {
  const count = Math.max(1, qty);
  for (const tier of rule.tiers) {
    if (count >= tier.minQty && (tier.maxQty === undefined || count <= tier.maxQty)) {
      return tier.unitPrice;
    }
  }
  return rule.tiers[rule.tiers.length - 1].unitPrice;
}

/**
 * Full calculation of an order item:
 * (Unit Tier Price + Lamination Surcharge) * Quantity
 */
export function calculateOrderPrice(params: {
  widthMm: number;
  heightMm: number;
  quantity: number;
  nameOrId?: string;
  subSlotLayout?: string;
  paperFinish?: PaperFinishType;
  lamination?: LaminationType;
  customOverridePrice?: number;
  priceTiers?: PriceTier[];
}): {
  unitBasePrice: number;
  baseUnitPrice: number;
  laminationSurcharge: number;
  totalUnitPrice: number;
  unitPrice: number;
  totalAmount: number;
  totalPrice: number;
  tierSummary: string;
  rule: SizePricingRule;
} {
  const qty = Math.max(1, params.quantity);
  const rule = findMatchingPricingRule(params.widthMm, params.heightMm, params.nameOrId, params.subSlotLayout);
  
  let unitBasePrice = 0;
  let tierSummary = `${qty} ảnh`;

  if (params.priceTiers && params.priceTiers.length > 0) {
    // Template has its own dedicated quantity tiers
    for (const tier of params.priceTiers) {
      if (qty >= tier.minQty && (tier.maxQty === undefined || qty <= tier.maxQty)) {
        unitBasePrice = tier.unitPrice;
        tierSummary = tier.maxQty ? `Mốc ${tier.minQty}–${tier.maxQty} ảnh` : `Mốc ${tier.minQty}+ ảnh (Sỉ)`;
        break;
      }
    }
    if (unitBasePrice === 0) {
      unitBasePrice = params.priceTiers[params.priceTiers.length - 1].unitPrice;
    }
  } else if (params.customOverridePrice && params.customOverridePrice > 0) {
    unitBasePrice = params.customOverridePrice;
    tierSummary = 'Đơn giá mẫu';
  } else {
    unitBasePrice = getTierUnitPrice(rule, qty);
    for (const tier of rule.tiers) {
      if (qty >= tier.minQty && (tier.maxQty === undefined || qty <= tier.maxQty)) {
        tierSummary = tier.maxQty ? `Mốc ${tier.minQty}–${tier.maxQty} ảnh` : `Mốc ${tier.minQty}+ ảnh`;
        break;
      }
    }
  }

  const laminationSurcharge = getLaminationSurcharge(params.lamination, qty);
  const totalUnitPrice = unitBasePrice + laminationSurcharge;
  const totalAmount = totalUnitPrice * qty;

  return {
    unitBasePrice,
    baseUnitPrice: unitBasePrice,
    laminationSurcharge,
    totalUnitPrice,
    unitPrice: totalUnitPrice,
    totalAmount,
    totalPrice: totalAmount,
    tierSummary,
    rule
  };
}
