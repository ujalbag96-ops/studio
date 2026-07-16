
'use client';

export interface CurrencyData {
  symbol: string;
  code: string;
  rateToCoins: number; // How many coins = 1 unit of this currency
}

/**
 * Industrial Currency Calibration
 * India: 100 Coins = 1 INR (User request: 300 coins = 3 INR)
 * Global/US: 1000 Coins = 1 USD (User request: 300 coins = 0.30 USD)
 */
export const CURRENCY_MAP: Record<string, CurrencyData> = {
  'India': { symbol: '₹', code: 'INR', rateToCoins: 100 },
  'United States': { symbol: '$', code: 'USD', rateToCoins: 1000 },
  'United Kingdom': { symbol: '£', code: 'GBP', rateToCoins: 1200 },
  'United Arab Emirates': { symbol: 'د.إ', code: 'AED', rateToCoins: 250 },
  'Canada': { symbol: 'CA$', code: 'CAD', rateToCoins: 750 },
  'Australia': { symbol: 'A$', code: 'AUD', rateToCoins: 700 },
  'Germany': { symbol: '€', code: 'EUR', rateToCoins: 1050 },
  'France': { symbol: '€', code: 'EUR', rateToCoins: 1050 },
  'Global': { symbol: '$', code: 'USD', rateToCoins: 1000 }
};

export function getCurrencyData(country?: string): CurrencyData {
  if (!country) return CURRENCY_MAP['Global'];
  return CURRENCY_MAP[country] || CURRENCY_MAP['Global'];
}

export function formatCurrency(amount: number, country?: string): string {
  const data = getCurrencyData(country);
  return `${data.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
