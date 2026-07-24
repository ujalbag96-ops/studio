
'use client';

import { AppSettings } from '@/app/lib/types';

export interface CurrencyData {
  symbol: string;
  code: string;
  rateToCoins: number; // How many coins = 1 unit of this currency
  minWithdrawal: number;
}

/**
 * Industrial Currency & Geo-Calibration Engine v9.0
 * 
 * Supports Dynamic Admin Rates.
 * Default Fallbacks:
 * India Node: 100 Coins = 1 INR
 * Global Node: 1000 Coins = 1 USD
 */
export const DEFAULT_CURRENCY_MAP: Record<string, CurrencyData> = {
  'India': { symbol: '₹', code: 'INR', rateToCoins: 100, minWithdrawal: 500 },
  'Global': { symbol: '$', code: 'USD', rateToCoins: 1000, minWithdrawal: 50 }
};

export const ADMIN_PROFIT_MARGIN = 0.70;
export const USER_REWARD_SHARE = 0.30;

export function getCurrencyData(country?: string, settings?: AppSettings): CurrencyData {
  const baseData = country === 'India' ? { ...DEFAULT_CURRENCY_MAP['India'] } : { ...DEFAULT_CURRENCY_MAP['Global'] };
  
  if (settings) {
    if (country === 'India' && settings.coinsPerINR) {
      baseData.rateToCoins = settings.coinsPerINR;
    } else if (country !== 'India' && settings.coinsPerUSD) {
      baseData.rateToCoins = settings.coinsPerUSD;
    }
  }

  return baseData;
}

export function formatCurrency(amountCoins: number, country?: string, settings?: AppSettings): string {
  const data = getCurrencyData(country, settings);
  const value = amountCoins / data.rateToCoins;
  
  const locale = data.code === 'INR' ? 'en-IN' : 'en-US';
  
  return `${data.symbol}${value.toLocaleString(locale, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}
