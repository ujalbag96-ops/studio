import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Industrial Revenue Share Gateway v6.0
 * Real-time dynamic calculation based on Admin Global Settings.
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
    
    // --- REAL-TIME INDUSTRIAL CALCULATION (Dynamic) ---
    const estimatedTotalRevenueINR = 0.50; 
    const userSharePercent = settings?.userRevenueSharePercent || 10; 
    const adminSharePercent = 100 - userSharePercent;

    const userRewardINR = estimatedTotalRevenueINR * (userSharePercent / 100); 
    const coinsPerINR = settings?.coinsPerINR || 100;
    const rewardAmountCoins = Math.floor(userRewardINR * coinsPerINR); 

    const adminProfitINR = estimatedTotalRevenueINR * (adminSharePercent / 100);

    // 1. User Wallet Sync (Real-time credit)
    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      generalTasksCount: increment(1),
      pendingRevenueShare: increment(userRewardINR / 80), 
      totalRevenueGenerated: increment(estimatedTotalRevenueINR / 80)
    });

    // 2. Global Platform Analytics
    batch.set(statsRef, {
      totalDailyRevenueINR: increment(estimatedTotalRevenueINR),
      totalAdminProfitINR: increment(adminProfitINR),
      totalUserDividendINR: increment(userRewardINR),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 3. Industrial Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'realtime_ad_reward',
      amount: rewardAmountCoins,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Video Node: ${userSharePercent}% Revenue Share Locked (+${rewardAmountCoins} 🪙)`,
      calculation: `Rev: ₹${estimatedTotalRevenueINR.toFixed(2)} | Share: ${userSharePercent}% | Net: ₹${userRewardINR.toFixed(2)}`
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      credit: rewardAmountCoins,
      rewardINR: userRewardINR,
      status: `SIGNAL_LOCKED_${userSharePercent}_PERCENT`
    });

  } catch (error) {
    return NextResponse.json({ error: 'Revenue Engine Error' }, { status: 500 });
  }
}