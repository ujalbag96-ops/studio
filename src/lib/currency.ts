
'use client';

export interface CurrencyData {
  symbol: string;
  code: string;
  rateToCoins: number; // How many coins = 1 unit of this currency
  minWithdrawal: number;
}

/**
 * Industrial Currency & Geo-Calibration Engine v6.0
 * Multi-Currency Sync Logic:
 * - India Node: 100 Coins = 1 INR (Profit Share: 30%)
 * - US Node: 1000 Coins = 1 USD (Profit Share: 32%)
 * - UK Node: 1200 Coins = 1 GBP (Profit Share: 32%)
 */
export const CURRENCY_MAP: Record<string, CurrencyData> = {
  'India': { symbol: '₹', code: 'INR', rateToCoins: 100, minWithdrawal: 100 },
  'United States': { symbol: '$', code: 'USD', rateToCoins: 1000, minWithdrawal: 10 },
  'United Kingdom': { symbol: '£', code: 'GBP', rateToCoins: 1200, minWithdrawal: 10 },
  'Global': { symbol: '$', code: 'USD', rateToCoins: 1000, minWithdrawal: 10 }
};

export function getCurrencyData(country?: string): CurrencyData {
  if (country === 'India') return CURRENCY_MAP['India'];
  if (country === 'United States') return CURRENCY_MAP['United States'];
  if (country === 'United Kingdom') return CURRENCY_MAP['United Kingdom'];
  return CURRENCY_MAP['Global'];
}

/**
 * Payout Percentage Logic:
 * - India: 30%
 * - US/UK: 32%
 * - Default: 30%
 */
export function getPayoutPercentage(country?: string): number {
  if (country === 'India') return 0.30;
  if (country === 'United States' || country === 'United Kingdom') return 0.32;
  return 0.30;
}

export function formatCurrency(amountCoins: number, country?: string): string {
  const data = getCurrencyData(country);
  const value = amountCoins / data.rateToCoins;
  
  const locale = data.code === 'INR' ? 'en-IN' : data.code === 'GBP' ? 'en-GB' : 'en-US';
  
  return `${data.symbol}${value.toLocaleString(locale, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

export function calculateCashValue(coins: number, country?: string): number {
  const data = getCurrencyData(country);
  return coins / data.rateToCoins;
}
