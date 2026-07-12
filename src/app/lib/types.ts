
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
  coins: number;
  referralCode: string;
  referredBy?: string;
  lastIp?: string;
  rank: UserRank;
  isAdmin?: boolean;
  isBanned?: boolean;
  lastSpinTimestamp?: string;
  vipStatus?: VIPStatus;
  taskBalance?: number;
  weeklyWinnings?: number;
  totalReferrals?: number;
  videosWatchedToday?: number;
  lastVideoWatchDate?: string;
}

export interface UserLedgerEntry {
  id: string;
  userId?: string;
  type: 'deposit' | 'withdrawal' | 'income' | 'entry_fee' | 'referral' | 'conversion' | 'vip_purchase' | 'prediction_fee' | 'prediction_win' | 'video_reward';
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  currencySymbol?: string;
}

export interface Tournament {
  id: string;
  name: string;
  gameType: GameType;
  bracketType: string;
  entryFee: number;
  prizePool: string;
  status: TournamentStatus;
  startDate: string;
  banner: string;
  roomCredentials?: {
    roomId?: string;
    roomPassword?: string;
  };
}

export interface PredictionPoll {
  id: string;
  question: string;
  category: string;
  optionA: string;
  optionB: string;
  entryFee: number;
  totalPool: number;
  status: 'active' | 'closed';
  expiry: string;
  winner?: 'A' | 'B';
}

export interface Registration {
  id: string;
  userId: string;
  tournamentId: string;
  gameId: string;
  joinedAt: string;
  feePaid: number;
}

export interface AppSettings {
  maintenanceMode: boolean;
  offerWallEnabled: boolean;
  videoWallEnabled: boolean;
  referralRewardCoins: number;
  cpaLeadUrl: string;
  coinValuePerDollar: number;
  adminProfitPercentage: number;
  withdrawalFeePercent: number;
  conversionFeePercent: number;
  telegramUrl: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  imageUrl?: string;
}

export interface SupportMessage {
  id: string;
  userId: string;
  message: string;
  aiResponse?: string;
  isFlagged?: boolean;
  status: 'open' | 'resolved';
  timestamp: string;
}
