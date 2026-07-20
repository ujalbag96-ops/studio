
export type TournamentStatus = 'active' | 'upcoming' | 'completed' | 'cancelled';
export type GameType = 'BGMI' | 'Free Fire' | 'Ludo King' | 'Other';
export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Elite';
export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type EduSource = 'NCERT' | 'OpenStax' | 'OdiaMedium';

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
  rank: UserRank;
  isSuspended?: boolean;
  
  cpaTasksCount: number;
  generalTasksCount: number; 
  engagementCount: number;
  totalReferrals: number; 
  tasksCompletedCount?: number;
  
  scholarPoints: number;
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
  preferredLanguage?: 'en' | 'or' | 'hi';
  kycStatus: KycStatus;
  isEliteAffiliate?: boolean;
  questCelebrationPending?: boolean;
  weeklyPointsEarned?: number;
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
  userRevenueSharePercent: number;
  adminUpiId: string;
  coinToInrRate: number; 
  
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
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userEmail: string;
  score: number;
  rank: number;
  lastUpdated: string;
}
