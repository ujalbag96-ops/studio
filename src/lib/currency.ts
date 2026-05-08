
'use client';

export interface CurrencyData {
  symbol: string;
  code: string;
  rateToCoins: number; // How many coins = 1 unit of this currency
}

export const CURRENCY_MAP: Record<string, CurrencyData> = {
  'India': { symbol: '₹', code: 'INR', rateToCoins: 10 },
  'United States': { symbol: '$', code: 'USD', rateToCoins: 800 },
  'United Kingdom': { symbol: '£', code: 'GBP', rateToCoins: 1000 },
  'United Arab Emirates': { symbol: 'د.إ', code: 'AED', rateToCoins: 220 },
  'Canada': { symbol: 'CA$', code: 'CAD', rateToCoins: 600 },
  'Australia': { symbol: 'A$', code: 'AUD', rateToCoins: 550 },
  'Germany': { symbol: '€', code: 'EUR', rateToCoins: 850 },
  'France': { symbol: '€', code: 'EUR', rateToCoins: 850 },
  'Global': { symbol: '$', code: 'USD', rateToCoins: 800 }
};

export function getCurrencyData(country?: string): CurrencyData {
  if (!country) return CURRENCY_MAP['Global'];
  return CURRENCY_MAP[country] || CURRENCY_MAP['Global'];
}

export function formatCurrency(amount: number, country?: string): string {
  const data = getCurrencyData(country);
  return `${data.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
