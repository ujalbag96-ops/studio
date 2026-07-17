
export type TournamentStatus = 'active' | 'upcoming' | 'completed' | 'cancelled';
export type GameType = 'BGMI' | 'Free Fire' | 'Ludo King' | 'Other';
export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Elite';
export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  email?: string;
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
  tasksCompletedCount?: number;
  networkTaskCompletions?: number;
  totalNetworkRevenue?: number;
  totalReferrals?: number; 
  totalNetworkReferrals?: number; 
  riskNoticeAccepted?: boolean;
  matchLossCount?: number;
  preferredLanguage?: 'en' | 'or';
  // KYC Tracking
  kycStatus: KycStatus;
  kycDocumentUrl?: string;
  kycSubmittedAt?: string;
  // Sharing Stats
  totalPagesShared?: number;
  shareRewardsEarned?: number;
  lastShareDate?: string;
  dailyShareCount?: number;
  unlockedMilestones?: string[];
  // Elite Affiliate System
  isEliteAffiliate?: boolean;
  megaMilestoneClaimed?: boolean;
  // Analytics
  lastSpinTimestamp?: string;
  isAccountActivated?: boolean;
}

export interface AppSettings {
  maintenanceMode: boolean;
  reviewMode: boolean; // KILL SWITCH
  adminUpiId: string;
  automaticGatewayEnabled: boolean;
  conversionFeePercent: number;
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

export interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  gameType: GameType;
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

export interface Registration {
  id: string;
  userId: string;
  tournamentId: string;
  gameId: string;
  joinedAt: string;
  feePaid: number;
}

export interface SystemNotification {
  id: string;
  userId?: string;
  title: string;
  body: string;
  localizedBody?: string;
  timestamp: string;
  type: 'broadcast' | 'payout' | 'mission' | 'milestone';
  imageUrl?: string;
  voucherCode?: string;
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  videoUrl: string;
  category: string;
  createdAt: string;
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
}
