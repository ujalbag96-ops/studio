
export type TournamentStatus = 'active' | 'upcoming' | 'completed' | 'cancelled';
export type GameType = 'BGMI' | 'Free Fire' | 'Ludo King' | 'Other';
export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Elite';

export interface VIPStatus {
  isActive: boolean;
  tier: 'none' | 'weekly' | 'monthly';
  expiryDate: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  depositBalance: number;
  winningBalance: number;
  bonusBalance: number;
  referralCommissionBalance?: number;
  coins: number;
  walletBalanceINR: number; 
  referralCode: string;
  referredBy?: string; 
  referredByL2?: string; 
  mlmLevel?: number; 
  vipLevel?: 'VIP 0' | 'VIP 1' | 'VIP 2'; 
  deviceId?: string; 
  lastIp?: string;
  country?: string;
  region?: string; 
  city?: string; 
  preferredLanguage?: 'en' | 'or'; 
  rank: UserRank;
  isAdmin?: boolean;
  isSuspended?: boolean; 
  isVpnDetected?: boolean; 
  isEmulator?: boolean; 
  adLoadFailCount?: number; 
  status?: 'active' | 'suspended';
  lastSpinTimestamp?: string;
  tasksCompletedCount?: number;
  riskNoticeAccepted?: boolean; 
  matchLossCount?: number; 
  weeklyPointsEarned?: number;
  // Sharing Stats
  totalPagesShared?: number;
  shareRewardsEarned?: number;
  lastShareDate?: string;
  dailyShareCount?: number;
}

export interface StudyMaterial {
  id: string;
  title: string;
  department: string;
  semester: number;
  type: 'Notes' | 'PYQ' | 'Syllabus';
  url: string;
  isPremium?: boolean;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  userId?: string;
  title: string;
  body: string;
  localizedBody?: string; 
  timestamp: string;
  type: 'broadcast' | 'payout' | 'mission' | 'system';
  imageUrl?: string;
  voucherCode?: string;
}

export interface UserLedgerEntry {
  id: string;
  userId?: string;
  type: 'deposit' | 'withdrawal' | 'income' | 'entry_fee' | 'referral' | 'conversion' | 'prediction_fee' | 'prediction_win' | 'video_reward' | 'share_reward' | 'quiz_reward';
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  userEmail?: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: string;
  destination: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  tasksCompleted?: number;
  isExpress?: boolean; 
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  videoUrl: string;
  category: string;
  createdAt: string;
}

export interface AppSettings {
  adminUpiId: string;
  maintenanceMode: boolean;
  automaticGatewayEnabled: boolean;
  conversionFeePercent: number;
}
