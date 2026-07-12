
'use client';

import { CricketMatch } from '@/app/lib/types';

/**
 * Industrial Cricket Data Service
 * Mock fetch logic for real-time match data.
 * This can be swapped with a real API (like RapidAPI or CricketData) easily.
 */
export async function fetchLiveCricketMatches(): Promise<CricketMatch[]> {
  // Simulate high-performance API latency
  await new Promise(resolve => setTimeout(resolve, 800));

  return [
    {
      id: 'mock_1',
      teamA: 'India',
      teamB: 'Australia',
      teamALogo: 'https://picsum.photos/seed/ind/100/100',
      teamBLogo: 'https://picsum.photos/seed/aus/100/100',
      startTime: new Date().toISOString(),
      status: 'live',
      series: 'Border-Gavaskar Trophy',
      liveScore: {
        runsA: '184/4',
        runsB: '72/1',
        overs: '12.4',
        target: '240'
      }
    },
    {
      id: 'mock_2',
      teamA: 'South Africa',
      teamB: 'Pakistan',
      teamALogo: 'https://picsum.photos/seed/sa/100/100',
      teamBLogo: 'https://picsum.photos/seed/pak/100/100',
      startTime: new Date().toISOString(),
      status: 'upcoming',
      series: 'Champions Trophy'
    },
    {
      id: 'mock_3',
      teamA: 'England',
      teamB: 'New Zealand',
      teamALogo: 'https://picsum.photos/seed/eng/100/100',
      teamBLogo: 'https://picsum.photos/seed/nz/100/100',
      startTime: new Date().toISOString(),
      status: 'completed',
      series: 'Test Series',
      liveScore: {
        runsA: '450 & 200',
        runsB: '320 & 180',
        overs: 'Finished'
      },
      winner: 'England'
    }
  ];
}
