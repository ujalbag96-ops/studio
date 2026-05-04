
import { Tournament, Match, UserLedgerEntry } from './types';

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 't1',
    name: 'Cyber Strike Masters',
    status: 'active',
    game: 'Tactical Shooter',
    prizePool: '₹10,000',
    startDate: '2024-05-20',
    banner: 'https://picsum.photos/seed/cyberstrike/800/400'
  },
  {
    id: 't2',
    name: 'Nebula League Season 4',
    status: 'upcoming',
    game: 'MOBA Elite',
    prizePool: '₹5,000',
    startDate: '2024-06-15',
    banner: 'https://picsum.photos/seed/nebula/800/400'
  }
];

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    tournamentId: 't1',
    teamA: { id: 'team1', name: 'Alpha Wolves', logo: 'https://picsum.photos/seed/wolves/100/100' },
    teamB: { id: 'team2', name: 'Void Walkers', logo: 'https://picsum.photos/seed/void/100/100' },
    scoreA: 13,
    scoreB: 11,
    status: 'live',
    startTime: '2024-05-21T14:00:00Z',
    description: 'Quarter Finals - Map 3 of 3',
    votesA: 1450,
    votesB: 1200
  },
  {
    id: 'm2',
    tournamentId: 't1',
    teamA: { id: 'team3', name: 'Neon Knights', logo: 'https://picsum.photos/seed/neon/100/100' },
    teamB: { id: 'team4', name: 'Storm Chasers', logo: 'https://picsum.photos/seed/storm/100/100' },
    scoreA: 0,
    scoreB: 0,
    status: 'scheduled',
    startTime: '2024-05-21T18:00:00Z',
    description: 'Lower Bracket Round 2',
    votesA: 400,
    votesB: 650
  }
];

export const MOCK_LEDGER: UserLedgerEntry[] = [
  { id: 'l1', type: 'deposit', amount: 50.00, date: '2024-05-10', status: 'completed' },
  { id: 'l2', type: 'income', amount: 5.50, date: '2024-05-12', status: 'completed' },
  { id: 'l3', type: 'withdrawal', amount: 20.00, date: '2024-05-15', status: 'pending' }
];
