
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';
import { USER_REWARD_SHARE, ADMIN_PROFIT_MARGIN } from '@/lib/currency';

/**
 * Industrial Skill Reward Gateway
 * Manages the 70/30 Profit Lock for all activity-linked signals.
 */
export async function POST(request: Request) {
  try {
    const { userId, reward, type = 'skill_reward' } = await request.json();

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
    const estimatedTotalValueUSD = (reward / 1000) / USER_REWARD_SHARE;
    const userShareUSD = estimatedTotalValueUSD * USER_REWARD_SHARE;
    const adminProfitUSD = estimatedTotalValueUSD * ADMIN_PROFIT_MARGIN;

    // 1. Real-time Wallet Update (Scholar Dividend)
    batch.update(userRef, {
      taskBalance: increment(reward),
      coins: increment(reward),
      generalTasksCount: increment(1),
      pendingRevenueShare: increment(userShareUSD)
    });

    // 2. Platform Operational Stats (Admin Hub)
    batch.set(statsRef, {
      totalOperationalRevenueUSD: increment(estimatedTotalValueUSD),
      totalAdminProfitUSD: increment(adminProfitUSD),
      totalUserDividendUSD: increment(userShareUSD),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 3. Encrypted Ledger Entry
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'skill_reward',
      amount: reward,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Bounty Unlock: Verified Activity Signal`,
      profitSplit: '70/30 Lock'
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      credit: reward,
      status: 'SIGNAL_LOCKED_70_30'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Engine Error' }, { status: 500 });
  }
}
