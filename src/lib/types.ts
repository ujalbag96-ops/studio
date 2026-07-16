
export type TournamentStatus = 'active' | 'upcoming' | 'completed' | 'cancelled';
export type GameType = 'BGMI' | 'Free Fire' | 'Ludo King' | 'Other';
export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Elite';

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
  rank: UserRank;
  isSuspended?: boolean;
  tasksCompletedCount?: number;
  networkTaskCompletions?: number;
  totalNetworkRevenue?: number;
  riskNoticeAccepted?: boolean;
  matchLossCount?: number;
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  videoUrl: string;
  category: string;
  createdAt: string;
}

export interface UserLedgerEntry {
  id: string;
  userId?: string;
  type: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
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
}
