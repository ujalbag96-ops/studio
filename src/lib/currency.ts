
'use client';

export interface CurrencyData {
  symbol: string;
  code: string;
  rateToCoins: number; // How many coins = 1 unit of this currency
}

/**
 * Industrial Currency & Geo-Calibration Engine v5.0
 * Multi-Currency Sync Logic for Distributed Platform:
 * - India Node: 100 Coins = 1 INR (Profit: 60/40 Split)
 * - US Node: 1000 Coins = 1 USD (Profit: 35/65 Split)
 * - UK Node: 1200 Coins = 1 GBP (Profit: 35/65 Split)
 */
export const CURRENCY_MAP: Record<string, CurrencyData> = {
  'India': { symbol: '₹', code: 'INR', rateToCoins: 100 },
  'United States': { symbol: '$', code: 'USD', rateToCoins: 1000 },
  'United Kingdom': { symbol: '£', code: 'GBP', rateToCoins: 1200 },
  'Global': { symbol: '$', code: 'USD', rateToCoins: 1000 }
};

export function getCurrencyData(country?: string): CurrencyData {
  if (country === 'India') return CURRENCY_MAP['India'];
  if (country === 'United States') return CURRENCY_MAP['United States'];
  if (country === 'United Kingdom') return CURRENCY_MAP['United Kingdom'];
  return CURRENCY_MAP['Global'];
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
