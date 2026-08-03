
export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Elite';
export type LanguageCode = 'en' | 'or' | 'hi' | 'bn' | 'te' | 'ta' | 'mr' | 'es' | 'fr' | 'de';
export type UserIntent = 'student' | 'earner';

export interface UserProfile {
  id: string;
  email?: string;
  coins: number;
  depositBalance: number;
  winningBalance: number;
  bonusBalance: number;
  taskBalance: number;
  walletBalanceINR: number;
  pendingRevenueShare: number;
  totalRevenueGenerated: number;
  referralCode: string;
  referredBy?: string;
  referredByL2?: string;
  vipLevel: number;
  vipStatus?: {
    isActive: boolean;
    tier: 'monthly' | 'yearly';
    expiryDate: string;
  };
  country?: string;
  geo_region?: string;
  rank: UserRank;
  primaryIntent?: UserIntent;
  agreementAccepted?: boolean;
  isSuspended?: boolean;
  riskNoticeAccepted?: boolean;
  cpaTasksCount: number;
  generalTasksCount: number;
  totalReferrals: number;
  scholarPoints: number;
  preferredLanguage?: LanguageCode;
  joinedAt?: string;
  dailyStreak?: number;
  lastCheckInDate?: string;
  matchLossCount?: number;
  puzzleLevel?: number;
  physicsLevel?: number;
  runnerLevel?: number;
  marketSalesCount?: number;
  teacherPoints?: number;
  tasksCompletedCount?: number;
  deviceId?: string;
  lastIp?: string;
  emailVerified?: boolean;
  referralCommissionBalance?: number;
  mlmLevel?: number;
  lastSpinTimestamp?: string;
  totalPagesShared?: number;
  unlockedMilestones?: string[];
  networkTaskCompletions?: number;
  totalNetworkRevenue?: number;
}

export interface AppSettings {
  maintenanceMode: boolean;
  reviewMode: boolean;
  autoWithdrawalEnabled: boolean;
  razorpayAutoPayout: boolean;
  userRevenueSharePercent: number;
  maxDailyVideosPerUser?: number;
  
  // --- Global API Signals ---
  admobAppId?: string;
  admobRewardedUnitId?: string;
  vastAdTagUrl?: string;
  youtubeApiKey?: string;
  pushNotificationKey?: string;
  cpaLeadApiKey?: string;
  broadcastActive?: boolean;
  broadcastMessage?: string;

  // --- Sound Engine ---
  sfxEnabled?: boolean;
  notifSoundUrl?: string;
  rewardSoundUrl?: string;
  payoutSoundUrl?: string;

  // --- Dynamic Branding ---
  currentThemeId?: string;
  customLogoUrl?: string;
  customAppName?: string;
  
  // --- Monetization Settings ---
  coinsPerINR: number;
  coinsPerUSD: number;
  
  // Dynamic Module Toggles (Visibility Keys are in Module Registry)
  [key: string]: any;
}

export interface PlatformRevenue {
  totalDailyRevenueUSD: number;
  totalAdminProfitUSD: number;
  totalUserDividendUSD: number;
  lastUpdated: string;
  totalOperationalRevenueUSD?: number;
}

export interface UserLedgerEntry {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  currencySymbol?: string;
  usdValue?: number;
  profitSplit?: string;
  userShareUSD?: number;
}

export interface BookMetadata {
  id: string;
  title: string;
  class: string;
  subject: string;
  source: string;
  lang: string;
  chapters: number;
  coverUrl: string | null;
}

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'system' | 'payout' | 'promotion';
  imageUrl?: string;
  voucherCode?: string;
  localizedBody?: string;
}

export interface Tournament {
  id: string;
  name: string;
  status: 'active' | 'upcoming' | 'completed' | 'cancelled';
  gameType: 'BGMI' | 'Free Fire' | 'Ludo King' | 'Other';
  prizePool: string;
  entryFee: number;
  startDate: string;
  banner: string;
  streamUrl?: string;
  roomCredentials?: {
    roomId?: string;
    roomPassword?: string;
  };
}

export interface PayoutRequest {
  id: string;
  userId: string;
  userEmail?: string;
  amount: number;
  method: string;
  destination: string;
  status: 'pending' | 'completed' | 'rejected';
  timestamp: string;
  geo?: string;
  localAmount?: number;
}
