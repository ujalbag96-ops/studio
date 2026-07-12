
export type TournamentStatus = 'active' | 'upcoming' | 'completed' | 'cancelled';
export type GameType = 'BGMI' | 'Free Fire' | 'Ludo King' | 'Other';
export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Elite';

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
}

export interface UserLedgerEntry {
  id: string;
  userId?: string;
  type: 'deposit' | 'withdrawal' | 'income' | 'entry_fee' | 'referral' | 'conversion';
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
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

export interface Registration {
  id: string;
  userId: string;
  tournamentId: string;
  gameId: string;
  joinedAt: string;
  feePaid: number;
}
