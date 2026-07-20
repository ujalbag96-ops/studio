
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';
import { USER_REWARD_SHARE, ADMIN_PROFIT_MARGIN } from '@/lib/currency';

export async function POST(request: Request) {
  try {
    const { userId, reward } = await request.json();

    if (!userId || isNaN(reward)) {
      return NextResponse.json({ error: 'Invalid Signal' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const statsRef = doc(firestore, 'platform_stats', 'revenue');

    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Identity Missing' }, { status: 404 });
    }

    // --- PROFIT LOCK ENGINE (70/30) ---
    // If reward is 2 coins (~$0.002), it represents the 30% user share.
    // Total Value = reward / 0.30
    const estimatedTotalValueUSD = (reward / 1000) / USER_REWARD_SHARE;
    const userShareUSD = estimatedTotalValueUSD * USER_REWARD_SHARE;
    const adminProfitUSD = estimatedTotalValueUSD * ADMIN_PROFIT_MARGIN;

    // 1. Update User Balances
    batch.update(userRef, {
      bonusBalance: increment(reward),
      coins: increment(reward),
      generalTasksCount: increment(1),
      pendingRevenueShare: increment(userShareUSD)
    });

    // 2. Global Operational Stats (Profit Hub)
    batch.set(statsRef, {
      totalDailyRevenueUSD: increment(estimatedTotalValueUSD),
      totalAdminProfitUSD: increment(adminProfitUSD),
      totalDistributedToUsersUSD: increment(userShareUSD),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 3. Ledger Sync
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'skill_reward',
      amount: reward,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Bounty Unlock: Verified Signal`,
      profitSplit: '70/30'
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      credit: reward,
      status: '70_PROFIT_LOCK'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Engine Error' }, { status: 500 });
  }
}
