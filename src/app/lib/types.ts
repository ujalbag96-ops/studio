
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
  userRevenueSharePercent: number;
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

export interface CpaConversion {
  id: string;
  userId: string;
  userEmail: string;
  offerName: string;
  payoutUSD: number;
  userShareCoins: number;
  timestamp: string;
  status: 'Completed' | 'Credited';
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
  isCustom?: boolean;
}

export interface SystemNotification {
  id: string;
  userId: string | null;
  title: string;
  body: string;
  localizedBody?: string;
  timestamp: string;
  type: 'broadcast' | 'payout' | 'system';
  imageUrl?: string;
  voucherCode?: string;
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

export interface PredictionPoll {
  id: string;
  question: string;
  category: string;
  totalPool: number;
  entryFee: number;
  expiry: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userEmail: string;
  score: number;
  lastUpdated: string;
}
