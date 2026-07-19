
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Verified Video Ad Reward Gateway
 * Credits coins upon verified simulation completion.
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

    const dateStr = new Date().toISOString().split('T')[0];

    // 1. Unified Wallet Credit
    batch.update(userRef, {
      bonusBalance: increment(reward),
      coins: increment(reward),
      generalTasksCount: increment(1) // Counts as General Task for validation
    });

    // 2. Encrypted Ledger Log
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'video_reward',
      amount: reward,
      date: dateStr,
      status: 'completed',
      description: `Short Video Reward: +${reward} 🪙`,
      isPostbackVerified: true
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: 'Ad Liquidity Synced',
      credit: reward 
    });

  } catch (error) {
    console.error('Ad Reward Runtime Failure:', error);
    return NextResponse.json({ error: 'Operational Node Offline' }, { status: 500 });
  }
}
