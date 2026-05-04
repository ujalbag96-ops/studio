
export type TournamentStatus = 'active' | 'upcoming' | 'completed';
export type GameType = 'BGMI' | 'Free Fire' | 'Ludo King' | 'Other';

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
}

export interface SupportMessage {
  id: string;
  userId: string;
  message: string;
  aiResponse?: string;
  isFlagged?: boolean;
  timestamp: string;
}

export interface UserLedgerEntry {
  id: string;
  type: 'deposit' | 'withdrawal' | 'income' | 'entry_fee';
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
}

export interface UserProfile {
  id: string;
  mobile: string;
  deviceId: string;
  coins: number;
  withdrawableCoins: number;
  referralCode: string;
  referredBy?: string;
  isAdmin?: boolean;
  upiId?: string;
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
  withdrawalGateways?: string[];
}
