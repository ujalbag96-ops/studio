
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, updateDoc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Quiz Prize Pool Synchronizer
 * Maps rewarded ad signals to the dynamic Prize Pool.
 * 50% Revenue Share logic: For every ad viewed, pool increases by ₹1.2 (Subsidized).
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    const { firestore } = initializeFirebase();

    const poolRef = doc(firestore, 'quiz_pool', 'current');
    const poolSnap = await getDoc(poolRef);

    if (!poolSnap.exists()) {
       await setDoc(poolRef, {
          currentPrizeINR: 50, // Starting floor
          totalParticipants: 0,
          nextDrawTime: new Date(Date.now() + 86400000).toISOString()
       });
    }

    // Increment pool by 50% shared margin (₹1.2 per ad)
    await updateDoc(poolRef, {
       currentPrizeINR: increment(1.2),
       totalParticipants: increment(1)
    });

    return NextResponse.json({ success: true, status: 'POOL_SYNCED' });

  } catch (error) {
    console.error('Quiz Pool Sync Error:', error);
    return NextResponse.json({ error: 'Signal Jammed' }, { status: 500 });
  }
}
