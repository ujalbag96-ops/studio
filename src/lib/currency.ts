
'use client';

export interface CurrencyData {
  symbol: string;
  code: string;
  rateToCoins: number; // How many coins = 1 unit of this currency
}

/**
 * Industrial Currency & Exchange Calibration
 * Multi-Currency Sync Logic for Distributed Engine:
 * - India: 100 Coins = 1 INR (Reward 300 = 3 INR)
 * - Global: 1000 Coins = 1 USD (Reward 300 = 0.30 USD)
 */
export const CURRENCY_MAP: Record<string, CurrencyData> = {
  'India': { symbol: '₹', code: 'INR', rateToCoins: 100 },
  'United States': { symbol: '$', code: 'USD', rateToCoins: 1000 },
  'Global': { symbol: '$', code: 'USD', rateToCoins: 1000 }
};

export function getCurrencyData(country?: string): CurrencyData {
  // Always default to India for this specific project context
  return CURRENCY_MAP['India'];
}

export function formatCurrency(amountCoins: number): string {
  const data = getCurrencyData();
  const value = amountCoins / data.rateToCoins;
  return `${data.symbol}${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateCashValue(coins: number): number {
  const data = getCurrencyData();
  return coins / data.rateToCoins;
}
