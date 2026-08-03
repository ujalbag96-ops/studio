
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Industrial Revenue Share Gateway v4.0
 * Calibrated for "10% Distributed Reward" logic.
 * Default: Ad Revenue = ₹0.50 | User Reward (10%) = ₹0.05 (5 Coins)
 */
export async function POST(request: Request) {
  try {
    const { userId, type = 'video_ad_signal' } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Identity Missing' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const statsRef = doc(firestore, 'platform_stats', 'revenue');
    const settingsRef = doc(firestore, 'app_settings', 'global_config');

    const [userSnap, settingsSnap] = await Promise.all([
      getDoc(userRef),
      getDoc(settingsRef)
    ]);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Identity Missing' }, { status: 404 });
    }

    const settings = settingsSnap.data();
    
    // --- INDUSTRIAL 10% DISTRIBUTED LOGIC ---
    // Standard Ad Revenue: ₹0.50 (50 Coins value at 100:1)
    const estimatedTotalRevenueINR = 0.50; 
    const userSharePercent = 10; // Explicit 10% request
    const adminSharePercent = 90;

    const userRewardINR = estimatedTotalRevenueINR * (userSharePercent / 100); // ₹0.05
    const coinsPerINR = settings?.coinsPerINR || 100;
    const rewardAmountCoins = Math.floor(userRewardINR * coinsPerINR); // 5 Coins

    const adminProfitINR = estimatedTotalRevenueINR * (adminSharePercent / 100);

    // 1. User Wallet Sync
    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      generalTasksCount: increment(1),
      pendingRevenueShare: increment(userRewardINR / 80), // Store USD equivalent approx
      totalRevenueGenerated: increment(estimatedTotalRevenueINR / 80)
    });

    // 2. Global Platform Analytics
    batch.set(statsRef, {
      totalDailyRevenueINR: increment(estimatedTotalRevenueINR),
      totalAdminProfitINR: increment(adminProfitINR),
      totalUserDividendINR: increment(userRewardINR),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 3. Encrypted Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'distributed_ad_reward',
      amount: rewardAmountCoins,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Video Ad Node: 10% Share Credited (+${rewardAmountCoins} 🪙)`,
      margin: '10/90 Industrial Lock'
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      credit: rewardAmountCoins,
      status: `SIGNAL_LOCKED_10_PERCENT`
    });

  } catch (error) {
    return NextResponse.json({ error: 'Revenue Engine Error' }, { status: 500 });
  }
}
