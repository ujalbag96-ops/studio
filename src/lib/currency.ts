
'use client';

export interface CurrencyData {
  symbol: string;
  code: string;
  rateToCoins: number; // How many coins = 1 unit of this currency
}

/**
 * Industrial Currency & Geo-Calibration Engine
 * Multi-Currency Sync Logic for Distributed Platform:
 * - India Node: 100 Coins = 1 INR (Profit: 60/40 Split)
 * - Global Node: 1000 Coins = 1 USD (Profit: 35/65 Split)
 */
export const CURRENCY_MAP: Record<string, CurrencyData> = {
  'India': { symbol: '₹', code: 'INR', rateToCoins: 100 },
  'Global': { symbol: '$', code: 'USD', rateToCoins: 1000 }
};

export function getCurrencyData(country?: string): CurrencyData {
  if (country === 'India') {
    return CURRENCY_MAP['India'];
  }
  return CURRENCY_MAP['Global'];
}

export function formatCurrency(amountCoins: number, country?: string): string {
  const data = getCurrencyData(country);
  const value = amountCoins / data.rateToCoins;
  
  if (data.code === 'INR') {
    return `${data.symbol}${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${data.symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateCashValue(coins: number, country?: string): number {
  const data = getCurrencyData(country);
  return coins / data.rateToCoins;
}
