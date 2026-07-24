
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
  pendingRevenueShare: number; // User's 20% cut in USD
  totalRevenueGenerated: number; // Total value generated for platform
  referralCode: string;
  referredBy?: string;
  referredByL2?: string;
  vipLevel: number;
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
}

export interface AppSettings {
  maintenanceMode: boolean;
  reviewMode: boolean;
  autoWithdrawalEnabled: boolean;
  razorpayAutoPayout: boolean;
  userRevenueSharePercent: number; // Dynamic percentage control
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
}

export interface PlatformRevenue {
  totalDailyRevenueUSD: number;
  totalAdminProfitUSD: number;
  totalUserDividendUSD: number;
  lastUpdated: string;
}

export interface UserLedgerEntry {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  currencySymbol?: string;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  userEmail: string;
  coinAmount: number;
  localAmount: number;
  method: string;
  destination: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  geo?: string;
}
