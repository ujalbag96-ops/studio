
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
}

export interface AppSettings {
  maintenanceMode: boolean;
  reviewMode: boolean;
  autoWithdrawalEnabled: boolean;
  razorpayAutoPayout: boolean;
  userRevenueSharePercent: number;
  api_razorpay_active: boolean;
  api_admob_active: boolean;
  api_cpalead_active: boolean;
  api_adgate_active: boolean;
  api_s2s_active: boolean;
  node_scholar_dividend: boolean;
  node_quiz_arena: boolean;
  node_global_cpa: boolean;
  node_referral_engine: boolean;
  node_ad_stream: boolean;
  adminUpiId?: string;
  automaticGatewayEnabled?: boolean;
}

export interface PlatformRevenue {
  totalDailyRevenueUSD: number;
  totalAdminProfitUSD: number;
  totalDistributedToUsersUSD: number;
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

export interface CricketMatch {
  id: string;
  teamA: string;
  teamB: string;
  teamALogo: string;
  teamBLogo: string;
  startTime: string;
  status: 'live' | 'upcoming' | 'completed';
  series: string;
  liveScore?: any;
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

export interface BookMetadata {
  id: string;
  title: string;
  subject: string;
  class: string;
  source: string;
  lang: string;
  coverUrl?: string;
  author?: string;
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

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userEmail: string;
  score: number;
}
