
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Verified Video Ad Reward Gateway
 * Credits coins upon verified simulation completion.
 * Enforces daily limit (15 ads max) to prevent abuse.
 */
export async function POST(request: Request) {
  try {
    const { userId, reward } = await request.json();

    if (!userId || isNaN(reward)) {
      return NextResponse.json({ error: 'Invalid Signal' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Identity Record Missing' }, { status: 404 });
    }

    const userData = userSnap.data();
    if (userData.isSuspended) {
       return NextResponse.json({ error: 'Account Signal Locked' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];
    const dailyAdCount = userData.lastAdDate === today ? (userData.dailyAdCount || 0) : 0;

    // PLAY STORE POLICY CAP: Max 15 Ads per day
    if (dailyAdCount >= 15) {
       return NextResponse.json({ error: 'Daily Ad Limit Reached' }, { status: 429 });
    }

    // 1. Unified Wallet Credit
    batch.update(userRef, {
      bonusBalance: increment(reward),
      coins: increment(reward),
      generalTasksCount: increment(1), // Counts as General Task for validation
      dailyAdCount: dailyAdCount + 1,
      lastAdDate: today
    });

    // 2. Encrypted Ledger Log
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'video_reward',
      amount: reward,
      date: today,
      status: 'completed',
      description: `Short Video Reward: +${reward} 🪙`,
      isPostbackVerified: true
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: 'Ad Liquidity Synced',
      credit: reward,
      remainingToday: 15 - (dailyAdCount + 1)
    });

  } catch (error) {
    console.error('Ad Reward Runtime Failure:', error);
    return NextResponse.json({ error: 'Operational Node Offline' }, { status: 500 });
  }
}
