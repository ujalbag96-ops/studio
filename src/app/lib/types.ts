
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
  referralCommissionBalance?: number;
  mlmLevel?: number;
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
  
  // --- DYNAMIC CURRENCY & ECONOMY ---
  coinsPerINR: number;
  coinsPerUSD: number;
  cpaRewardMultiplier: number;
  videoRewardRateCoins: number;
  rateHistory?: {
    timestamp: string;
    type: string;
    oldValue: number;
    newValue: number;
  }[];
}

export interface PlatformRevenue {
  totalDailyRevenueUSD: number;
  totalAdminProfitUSD: number;
  totalUserDividendUSD: number;
  lastUpdated: string;
  totalOperationalRevenueUSD?: number;
  totalDistributedToUsersUSD?: number;
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
  vipLevel?: number | string;
}

export interface CricketMatch {
  id: string;
  teamA: string;
  teamB: string;
  teamALogo: string;
  teamBLogo: string;
  startTime: string;
  status: 'live' | 'upcoming' | 'completed';
  series: string;
  liveScore?: {
    runsA: string;
    runsB: string;
    overs: string;
    target?: string;
    lastBalls?: string[];
  };
  winner?: string;
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  videoUrl: string;
  category: string;
  createdAt: string;
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

export interface StudyBuddySession {
  id: string;
  topic: string;
  studentId: string;
  studentEmail: string;
  teacherId: string | null;
  status: 'searching' | 'active' | 'completed';
  timestamp: string;
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

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userEmail: string;
  score: number;
  lastUpdated: string;
}
