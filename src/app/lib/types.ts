
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
  vipLevel: number; // 0 to 7
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
  // Sharing Stats
  totalPagesShared?: number;
  shareRewardsEarned?: number;
  lastShareDate?: string;
  dailyShareCount?: number;
  unlockedMilestones?: string[];
  // Analytics
  lastSpinTimestamp?: string;
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

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
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

export interface AppSettings {
  maintenanceMode: boolean;
  adminUpiId: string;
  automaticGatewayEnabled: boolean;
  conversionFeePercent: number;
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
  category: string;
  totalPool: number;
  entryFee: number;
  expiry: string;
  timestamp: string;
}
