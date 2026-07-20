
'use client';

export interface CurrencyData {
  symbol: string;
  code: string;
  rateToCoins: number; // How many coins = 1 unit of this currency
  minWithdrawal: number;
}

/**
 * Industrial Currency & Geo-Calibration Engine v8.0
 * PROFIT LOCK LOGIC (STRICT ENFORCEMENT):
 * - Admin Profit Lock: 70%
 * - User Reward Pool: 30%
 * 
 * India Node: 100 Coins = 1 INR
 * Global Node: 1000 Coins = 1 USD
 */
export const CURRENCY_MAP: Record<string, CurrencyData> = {
  'India': { symbol: '₹', code: 'INR', rateToCoins: 100, minWithdrawal: 500 },
  'Global': { symbol: '$', code: 'USD', rateToCoins: 1000, minWithdrawal: 50 }
};

export const ADMIN_PROFIT_MARGIN = 0.70;
export const USER_REWARD_SHARE = 0.30;

export function getCurrencyData(country?: string): CurrencyData {
  if (country === 'India') return CURRENCY_MAP['India'];
  return CURRENCY_MAP['Global'];
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
