'use client';

export interface CurrencyData {
  symbol: string;
  code: string;
  rateToCoins: number; // How many coins = 1 unit of this currency
  minWithdrawal: number;
}

/**
 * Industrial Currency & Geo-Calibration Engine v7.0
 * PROFIT LOCK LOGIC:
 * - India Node: 100 Coins = 1 INR (User Share: 30%)
 * - Global Node: 1000 Coins = 1 USD (User Share: 32%)
 * - Minimum Withdrawal: 50,000 Coins (₹500 / $50)
 */
export const CURRENCY_MAP: Record<string, CurrencyData> = {
  'India': { symbol: '₹', code: 'INR', rateToCoins: 100, minWithdrawal: 500 },
  'Global': { symbol: '$', code: 'USD', rateToCoins: 1000, minWithdrawal: 50 }
};

export function getCurrencyData(country?: string): CurrencyData {
  if (country === 'India') return CURRENCY_MAP['India'];
  return CURRENCY_MAP['Global'];
}

/**
 * STRICT INDUSTRIAL PROFIT LOCK:
 * - India: 30% User Share (70% Admin Net Profit)
 * - Global: 32% User Share (68% Admin Net Profit)
 */
export function getPayoutPercentage(country?: string): number {
  if (country === 'India') return 0.30;
  if (country === 'United States' || country === 'United Kingdom') return 0.32;
  return 0.30;
}

export function formatCurrency(amountCoins: number, country?: string): string {
  const data = getCurrencyData(country);
  const value = amountCoins / data.rateToCoins;
  
  const locale = data.code === 'INR' ? 'en-IN' : 'en-US';
  
  return `${data.symbol}${value.toLocaleString(locale, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}
