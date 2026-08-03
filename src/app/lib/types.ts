
export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Elite';
export type LanguageCode = 'en' | 'or' | 'hi' | 'bn' | 'te' | 'ta' | 'mr' | 'es' | 'fr' | 'de';
export type UserIntent = 'student' | 'earner' | 'professional';

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
  totalRevenueGeneratedINR?: number;
}

export interface AppSettings {
  maintenanceMode: boolean;
  reviewMode: boolean;
  autoWithdrawalEnabled: boolean;
  razorpayAutoPayout: boolean;
  userRevenueSharePercent: number; // Global default share
  cpaUserSharePercent?: number;    // Specific CPA share
  videoUserSharePercent?: number;  // Specific Video Ads share
  youtubeUserSharePercent?: number; // Specific YouTube share
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
  
  // --- Master URLs ---
  globalYoutubeStreamUrl?: string;
  globalDirectStreamUrl?: string;

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
  
  // Dynamic Module Toggles
  [key: string]: any;
}

export interface PlatformRevenue {
  totalGrossRevenueINR: number;
  totalUserPayoutsINR: number;
  totalAdminProfitINR: number;
  totalViews: number;
  totalWatchTimeSec: number;
  countryBreakdown: Record<string, number>;
  lastUpdated: string;
  totalDailyRevenueUSD?: number;
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
  coverUrl?: string;
  author?: string;
  publishYear?: string;
}

export interface Tournament {
  id: string;
  name: string;
  status: 'active' | 'upcoming' | 'completed' | 'cancelled';
  gameType: string;
  prizePool: string;
  entryFee: number;
  startDate: string;
  banner: string;
  roomCredentials?: {
    roomId: string;
    roomPassword?: string;
  };
  streamUrl?: string;
}

export interface Registration {
  id: string;
  userId: string;
  tournamentId: string;
  gameId: string;
  joinedAt: string;
  feePaid: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  teamA: { id: string; name: string; logo: string };
  teamB: { id: string; name: string; logo: string };
  scoreA: number;
  scoreB: number;
  status: 'live' | 'scheduled' | 'completed';
  startTime: string;
  description: string;
  votesA?: number;
  votesB?: number;
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  videoUrl: string;
  category: string;
  createdAt: string;
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

export interface ESportsMatch {
  id: string;
  title: string;
  game: string;
  status: 'live' | 'upcoming';
  timestamp: string;
}

export interface ESportsPoll {
  id: string;
  matchId: string;
  question: string;
  optionA: string;
  optionB: string;
  totalPool: number;
  entryFee: number;
  status: 'open' | 'closed';
}

export interface PredictionPoll {
  id: string;
  question: string;
  totalPool: number;
  entryFee: number;
  category: string;
  expiry: string;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'broadcast' | 'payout' | 'system';
  imageUrl?: string;
  voucherCode?: string;
  localizedBody?: string;
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

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userEmail: string;
  score: number;
}
