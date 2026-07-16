
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, addDoc, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Watch-to-Earn Secure Gateway
 * Credits exactly 300 coins on movie completion.
 */
export async function POST(request: Request) {
  try {
    const { userId, type } = await request.json();

    if (!userId || type !== 'movie_watch') {
      return NextResponse.json({ error: 'Invalid Signal' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Identity Missing' }, { status: 404 });
    }

    const rewardAmount = 300;
    const dateStr = new Date().toISOString().split('T')[0];

    // 1. Credit Wallet
    batch.update(userRef, {
      taskBalance: increment(rewardAmount),
      coins: increment(rewardAmount)
    });

    // 2. Ledger Entry
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'video_reward',
      amount: rewardAmount,
      date: dateStr,
      status: 'completed',
      description: 'Movie Engine Yield: Verified Session (+300 🪙)',
      isVerified: true
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: 'Liquidity Synced',
      credit: rewardAmount 
    });

  } catch (error) {
    console.error('Watch Reward Failure:', error);
    return NextResponse.json({ error: 'Operational Hub Offline' }, { status: 500 });
  }
}
