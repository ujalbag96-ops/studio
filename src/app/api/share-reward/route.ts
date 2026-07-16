
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Viral Sharing Reward Gateway
 * Credits exactly 2 coins for verified social shares.
 * Limit: 5 rewards per 24-hour cycle.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Identity Missing' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Record Missing' }, { status: 404 });
    }

    const userData = userSnap.data();
    const today = new Date().toISOString().split('T')[0];
    
    // Check Daily Limit
    const dailyCount = userData.lastShareDate === today ? (userData.dailyShareCount || 0) : 0;
    
    if (dailyCount >= 5) {
       return NextResponse.json({ error: 'Daily Share Reward Limit Reached' }, { status: 429 });
    }

    const reward = 2;

    // 1. Update Profile Stats
    batch.update(userRef, {
      coins: increment(reward),
      bonusBalance: increment(reward),
      totalPagesShared: increment(1),
      shareRewardsEarned: increment(reward),
      dailyShareCount: dailyCount + 1,
      lastShareDate: today
    });

    // 2. Ledger Receipt
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'share_reward',
      amount: reward,
      date: today,
      status: 'completed',
      description: 'Viral Sharing Reward: Page Broadcast (+2 🪙)',
      isPostbackVerified: true
    });

    await batch.commit();

    return NextResponse.json({ success: true, reward, currentDaily: dailyCount + 1 });

  } catch (error) {
    return NextResponse.json({ error: 'Sync Failed' }, { status: 500 });
  }
}
