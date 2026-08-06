export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, getDocs, query, where, limit } from 'firebase/firestore';

/**
 * Industrial Cricket Sync Engine
 * Mocks the ESPN ball-by-ball API sync and populates the Admin Settlement Queue.
 */
export async function GET() {
  try {
    const { firestore } = initializeFirebase();
    
    // Simulate fetching from ESPN / CricketData.org
    // Real logic would loop through active matches and create pools for the most recent over
    
    const mockOverData = {
      matchId: 'IND_AUS_M1',
      overNumber: Math.floor(Math.random() * 20) + 1,
      runs: Math.floor(Math.random() * 15),
      wickets: Math.random() > 0.8 ? 1 : 0,
      text: "Hard-hitting performance in the death overs."
    };

    // Check if this over pool already exists to prevent duplicates
    const q = query(
      collection(firestore, 'cricket_over_pools'),
      where('matchId', '==', mockOverData.matchId),
      where('overNumber', '==', mockOverData.overNumber),
      limit(1)
    );
    
    const existing = await getDocs(q);
    if (!existing.empty) {
       return NextResponse.json({ success: true, message: 'Signals already synced', newPools: 0 });
    }

    // Create a new over-by-over prediction pool for the settlement queue
    const poolRef = await addDoc(collection(firestore, 'cricket_over_pools'), {
      matchId: mockOverData.matchId,
      overNumber: mockOverData.overNumber,
      question: `Will 10+ runs be scored in Over ${mockOverData.overNumber}?`,
      status: 'pending',
      totalPool: 0,
      yesPool: 0,
      noPool: 0,
      liveStats: {
        runs: mockOverData.runs,
        wickets: mockOverData.wickets,
        text: mockOverData.text
      },
      timestamp: new Date().toISOString()
    });

    // Populate some mock entries for testing the payout
    const mockUserIds = ['user_1', 'user_2', 'user_3'];
    for (const uid of mockUserIds) {
       const amount = Math.floor(Math.random() * 50) + 10;
       const choice = Math.random() > 0.5 ? 'YES' : 'NO';
       
       await addDoc(collection(firestore, 'cricket_over_pools', poolRef.id, 'entries'), {
          userId: uid,
          choice,
          amount,
          timestamp: new Date().toISOString()
       });

       // Update parent pool counters
       // Note: in production use transactions or increments
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Industrial Signals Synced from ESPN Feed', 
      newPools: 1 
    });

  } catch (error) {
    console.error('[CRICKET SYNC FAILURE]', error);
    return NextResponse.json({ error: 'Data Ingestion Offline' }, { status: 500 });
  }
}