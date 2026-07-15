
export type TournamentStatus = 'active' | 'upcoming' | 'completed' | 'cancelled';
export type GameType = 'BGMI' | 'Free Fire' | 'Ludo King' | 'Other';
export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Elite';

export interface VIPStatus {
  isActive: boolean;
  tier: 'none' | 'weekly' | 'monthly';
  expiryDate: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  depositBalance: number;
  winningBalance: number;
  bonusBalance: number;
  referralCommissionBalance?: number;
  coins: number;
  referralCode: string;
  referredBy?: string; // L1 Upline
  referredByL2?: string; // L2 Upline
  mlmLevel?: number; // 0, 1000, 3000, 5000, 10000
  lastIp?: string;
  country?: string;
  rank: UserRank;
  isAdmin?: boolean;
  isBanned?: boolean;
  lastSpinTimestamp?: string;
  vipStatus?: VIPStatus;
  taskBalance?: number;
  weeklyWinnings?: number;
  totalReferrals?: number;
  videosWatchedToday?: number;
  lastVideoWatchDate?: string;
  isVpnActive?: boolean;
  isAccountActivated?: boolean;
  tasksCompletedCount?: number;
}

export interface UserLedgerEntry {
  id: string;
  userId?: string;
  type: 'deposit' | 'withdrawal' | 'income' | 'entry_fee' | 'referral' | 'conversion' | 'vip_purchase' | 'prediction_fee' | 'prediction_win' | 'video_reward' | 'shop_redemption' | 'cricket_stake' | 'esports_stake' | 'referral_comm' | 'mlm_joining';
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  currencySymbol?: string;
  utrId?: string;
  isAutoVerified?: boolean;
}

export interface AppSettings {
  maintenanceMode: boolean;
  offerWallEnabled: boolean;
  videoWallEnabled: boolean;
  referralRewardCoins: number;
  cpaLeadUrl: string;
  coinValuePerDollar: number;
  adminProfitPercentage: number;
  withdrawalFeePercent: number;
  conversionFeePercent: number;
  telegramUrl: string;
  heroBannerUrl?: string;
  cricketApiKey?: string;
  adminUpiId?: string;
  depositTelegramUrl?: string;
  automaticGatewayEnabled?: boolean;
  adMobAppId?: string;
  adMobBannerId?: string;
  adMobInterstitialId?: string;
  appLovinSdkKey?: string;
  appLovinZoneId?: string;
  earningBannerUrl?: string;
  earningBannerLink?: string;
  earningBannerReward?: number;
  mlmCommissionL1?: number; // e.g. 0.20 for 20%
  mlmCommissionL2?: number; // e.g. 0.10 for 10%
}
