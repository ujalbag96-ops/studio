
export type TournamentStatus = 'active' | 'upcoming' | 'completed' | 'cancelled';
export type GameType = 'BGMI' | 'Free Fire' | 'Ludo King' | 'Other';
export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Elite';

export interface Team {
  id: string;
  name: string;
  logo: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  status: 'live' | 'scheduled' | 'finished';
  startTime: string;
  description: string;
  votesA: number;
  votesB: number;
}

export interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  game: string;
  gameType: GameType;
  prizePool: string;
  entryFee: number;
  startDate: string;
  banner: string;
  participantsCount?: number;
  maxParticipants?: number;
  roomCredentials?: {
    roomId?: string;
    roomPassword?: string;
    isDeployed?: boolean;
  };
  winnerId?: string;
}

export interface Registration {
  id: string;
  userId: string;
  tournamentId: string;
  gameId: string;
  joinedAt: string;
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

export interface SystemNotification {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  timestamp: string;
  audience: 'all' | 'paid' | 'inactive';
}

export interface UserLedgerEntry {
  id: string;
  userId?: string;
  type: 'deposit' | 'withdrawal' | 'income' | 'entry_fee' | 'referral' | 'conversion' | 'passive_referral' | 'refund';
  amount: number;
  currencySymbol?: string;
  date: string;
  status: 'pending' | 'completed' | 'failed' | 'review_required';
  description?: string;
  isFlagged?: boolean;
}

export interface UserProfile {
  id: string;
  email?: string;
  mobile?: string;
  deviceId?: string;
  country?: string;
  countryCode?: string;
  depositBalance: number;
  winningBalance: number;
  taskBalance: number;
  coins: number;
  withdrawableCoins: number;
  referralCode: string;
  referredBy?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  isVpnActive?: boolean;
  rank: UserRank;
  xp: number;
  tasksCompletedToday: number;
  lastTaskDate?: string;
  upiId?: string;
  lastActive?: string;
  joinedAt?: string;
}

export interface AppSettings {
  id: string;
  maintenanceMode: boolean;
  cpaLeadUrl: string;
  videoWallEnabled?: boolean;
  offerWallEnabled?: boolean;
  cpaLeadEnabled?: boolean;
  telegramUrl?: string;
  coinValuePerDollar?: number;
  adminProfitPercentage?: number;
  referralRewardCoins?: number;
  passiveReferralPercent?: number;
  conversionFeePercent?: number;
  withdrawalFeePercent?: number;
  welcomeAlertEnabled?: boolean;
  winningAlertEnabled?: boolean;
  lowBalanceAlertEnabled?: boolean;
  inactivityNudgeEnabled?: boolean;
}
