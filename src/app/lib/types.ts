
export type TournamentStatus = 'active' | 'upcoming' | 'completed';

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
  prizePool: string;
  startDate: string;
  banner: string;
}

export interface UserLedgerEntry {
  id: string;
  type: 'deposit' | 'withdrawal' | 'income';
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface UserProfile {
  id: string;
  mobile: string;
  deviceId: string;
  coins: number;
  referralCode: string;
  referredBy?: string;
  isAdmin?: boolean;
}

export interface AppSettings {
  id: string;
  maintenanceMode: boolean;
  cpaLeadUrl: string;
  withdrawalGateways?: string[];
}
