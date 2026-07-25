export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Elite';
export type LanguageCode = 'en' | 'or' | 'hi' | 'es' | 'fr' | 'de' | 'bn' | 'te' | 'ta' | 'mr';
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
  totalRevenueGeneratedUSD?: number;
  pendingRevenueShareUSD?: number;
}

export interface AppSettings {
  maintenanceMode: boolean;
  reviewMode: boolean;
  autoWithdrawalEnabled: boolean;
  razorpayAutoPayout: boolean;
  userRevenueSharePercent: number;
  cpaUserSharePercent?: number;
  videoUserSharePercent?: number;
  broadcastMessage?: string;
  broadcastActive?: boolean;
  minAppVersion?: string;
  adminUpiId?: string;
  automaticGatewayEnabled?: boolean;
  bookApiUrl?: string;
  bookApiKey?: string;
  bookApiCategory?: string;
  node_book_api_active?: boolean;
  node_book_download?: boolean;
  currentThemeId?: string;
  customLogoUrl?: string;
  festivalModeActive?: boolean;
  globalRewardSoundUrl?: string;
  globalNotifSoundUrl?: string;
  coinsPerINR: number;
  coinsPerUSD: number;
  cpaRewardMultiplier: number;
  videoRewardRateCoins: number;
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

export interface Movie {
  id: string;
  title: string;
  poster: string;
  videoUrl: string;
  category: string;
  createdAt: string;
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

export interface MarketAsset {
  id: string;
  title: string;
  category: string;
  price: number;
  authorId: string;
  authorName: string;
  downloads: number;
  timestamp: string;
}