
'use client';

import { CricketMatch } from '@/app/lib/types';

/**
 * Industrial Cricket Data Service
 * Fetch logic for real-time match data with API Key support.
 */
export async function fetchLiveCricketMatches(apiKey?: string): Promise<CricketMatch[]> {
  // If API Key is provided, we could fetch from a real provider like CricketData.org
  // For this prototype, we simulate the API call structure
  
  if (apiKey) {
    try {
      // Example implementation for RapidAPI or CricketData
      /*
      const response = await fetch('https://api.cricketdata.org/v1/currentMatches?apikey=' + apiKey);
      const json = await response.json();
      return json.data.map((m: any) => ({ ...mapping logic ... }));
      */
    } catch (err) {
      console.error("API Intelligence Failed, using fallback signals.");
    }
  }

  // Simulate high-performance API latency
  await new Promise(resolve => setTimeout(resolve, 800));

  return [
    {
      id: 'live_intel_1',
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
        target: '240',
        lastBalls: ['1', '4', '0', 'W', '6', '1']
      }
    },
    {
      id: 'live_intel_2',
      teamA: 'South Africa',
      teamB: 'Pakistan',
      teamALogo: 'https://picsum.photos/seed/sa/100/100',
      teamBLogo: 'https://picsum.photos/seed/pak/100/100',
      startTime: new Date().toISOString(),
      status: 'upcoming',
      series: 'Champions Trophy'
    },
    {
      id: 'live_intel_3',
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
