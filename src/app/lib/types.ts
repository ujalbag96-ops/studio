
export type TournamentStatus = 'active' | 'upcoming' | 'completed' | 'cancelled';
export type GameType = 'BGMI' | 'Free Fire' | 'Ludo King' | 'Other';
export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Elite';
export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type EduSource = 'NCERT' | 'OpenStax' | 'OdiaMedium' | 'CBSE' | 'ICSE' | 'UKNational' | 'CommonCore' | 'IB' | 'Cambridge' | 'OpenLibrary';
export type LanguageCode = 'en' | 'or' | 'hi' | 'es' | 'fr' | 'de' | 'bn' | 'te' | 'ta' | 'mr';

export interface UserProfile {
  id: string;
  email?: string;
  phoneNumber?: string;
  depositBalance: number;
  winningBalance: number;
  bonusBalance: number;
  referralCommissionBalance?: number;
  taskBalance: number;
  coins: number;
  walletBalanceINR: number;
  pendingRevenueShare: number;
  referralCode: string;
  referredBy?: string; 
  referredByL2?: string; 
  mlmLevel?: number;
  vipLevel: number; 
  country?: string;
  geo_region?: string;
  rank: UserRank;
  isSuspended?: boolean;
  
  cpaTasksCount: number;
  generalTasksCount: number; 
  engagementCount: number;
  totalReferrals: number; 
  tasksCompletedCount?: number;
  
  scholarPoints: number;
  teacherPoints: number; 
  marketSalesCount: number;
  
  dailyStudyMinutes: number;
  lastStudyDate?: string;
  
  puzzleLevel: number;
  physicsLevel: number;
  runnerLevel: number;
  
  dailyStreak: number;
  lastCheckInDate?: string;
  quizLives: number;
  
  riskNoticeAccepted?: boolean;
  matchLossCount?: number; 
  preferredLanguage?: LanguageCode;
  kycStatus: KycStatus;
  isEliteAffiliate?: boolean;
  questCelebrationPending?: boolean;
  weeklyPointsEarned?: number;
  preferredEduSource?: EduSource;
  lastIp?: string;
  lastSpinTimestamp?: string;

  // Viral Sharing Props
  totalPagesShared?: number;
  shareRewardsEarned?: number;
  lastShareDate?: string;
  dailyShareCount?: number;
  unlockedMilestones?: string[];
}

export interface BookMetadata {
  id: string;
  title: string;
  subject: string;
  class: string;
  source: EduSource;
  lang: string;
  chapters?: number;
  author?: string;
  coverUrl?: string;
  publishYear?: string;
}

export interface PlatformRevenue {
  totalDailyRevenueUSD: number;
  totalDistributedToUsersUSD: number;
  lastUpdated: string;
}

export interface AppSettings {
  maintenanceMode: boolean;
  reviewMode: boolean; 
  autoWithdrawalEnabled: boolean; 
  razorpayAutoPayout: boolean;
  userRevenueSharePercent: number;
  adminUpiId: string;
  coinToInrRate: number; 
  automaticGatewayEnabled: boolean;
  
  node_scholar_dividend: boolean;
  node_quiz_arena: boolean;
  node_global_cpa: boolean;
  node_micro_tasks: boolean;
  node_surveys: boolean;
  node_ad_stream: boolean;
  node_content_analysis: boolean;
  node_referral_engine: boolean;
  node_arcade_rewards: boolean;
  node_daily_checkin: boolean;

  api_admob_active: boolean;
  api_cpalead_active: boolean;
  api_adgate_active: boolean;
  api_s2s_active: boolean;
  api_razorpay_active: boolean;
}

export interface UserLedgerEntry {
  id: string;
  userId?: string;
  type: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  currencySymbol?: string;
}

export interface SystemNotification {
  id: string;
  userId?: string;
  title: string;
  body: string;
  localizedBody?: string;
  timestamp: string;
  type: 'broadcast' | 'personal' | 'payout';
  imageUrl?: string;
  voucherCode?: string;
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
}

export interface StudyBuddySession {
  id: string;
  topic: string;
  studentId: string;
  studentEmail?: string;
  teacherId: string | null;
  status: 'searching' | 'active' | 'completed';
  timestamp: string;
}

export interface Registration {
  id: string;
  userId: string;
  tournamentId: string;
  gameId: string;
  joinedAt: string;
  feePaid: number;
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
  roomCredentials?: {
    roomId: string;
    roomPassword?: string;
  };
  streamUrl?: string;
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

export interface ESportsMatch {
  id: string;
  title: string;
  game: string;
  status: 'live' | 'scheduled' | 'finished';
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
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userEmail?: string;
  score: number;
  lastUpdated: string;
}
