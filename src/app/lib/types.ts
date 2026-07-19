
export type TournamentStatus = 'active' | 'upcoming' | 'completed' | 'cancelled';
export type GameType = 'BGMI' | 'Free Fire' | 'Ludo King' | 'Other';
export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Elite';
export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';

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
  referralCode: string;
  referredBy?: string; 
  referredByL2?: string; 
  mlmLevel?: number;
  vipLevel: number; 
  deviceId?: string;
  lastIp?: string;
  country?: string;
  region?: string;
  city?: string;
  rank: UserRank;
  isSuspended?: boolean;
  
  // Validation Tracking
  cpaTasksCount: number;
  generalTasksCount: number; // For Video Ads
  engagementCount: number;
  totalReferrals: number; 
  
  // Arcade Progress (50 Levels each)
  puzzleLevel: number;
  physicsLevel: number;
  runnerLevel: number;
  
  // Retention Features
  dailyStreak: number;
  lastCheckInDate?: string;
  quizLives: number;
  
  tasksCompletedCount?: number;
  networkTaskCompletions?: number;
  totalNetworkRevenue?: number;
  totalNetworkReferrals?: number; 
  riskNoticeAccepted?: boolean;
  matchLossCount?: number; 
  preferredLanguage?: 'en' | 'or';
  kycStatus: KycStatus;
  kycDocumentUrl?: string;
  kycSubmittedAt?: string;
  totalPagesShared?: number;
  shareRewardsEarned?: number;
  lastShareDate?: string;
  dailyShareCount?: number;
  unlockedMilestones?: string[];
  isEliteAffiliate?: boolean;
  megaMilestoneClaimed?: boolean;
  lastSpinTimestamp?: string;
  isAccountActivated?: boolean;
  questCelebrationPending?: boolean;
}

export interface AppSettings {
  maintenanceMode: boolean;
  reviewMode: boolean; 
  autoWithdrawalEnabled: boolean; // Master Toggle for Automated Payouts
  autoWithdrawalMaxAmount: number; // Max amount for auto-processing
  adminUpiId: string;
  automaticGatewayEnabled: boolean;
  conversionFeePercent: number;
  minWithdrawalAmount: number;
  coinToInrRate: number; // e.g. 100
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

export interface PayoutRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: string;
  destination: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  vipLevel: number;
  processedBy: 'manual' | 'automatic'; // Tracks how the payout was executed
  gatewayTransactionId?: string; // ID from RazorpayX/PayPal etc.
  geo?: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  geo: string;
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

export interface PredictionPoll {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  totalPool: number;
  entryFee: number;
  category: string;
  expiry: string;
  timestamp: string;
}
