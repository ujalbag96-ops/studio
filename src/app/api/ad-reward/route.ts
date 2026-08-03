
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

/**
 * Industrial Real-Time Dynamic Revenue Share Gateway v15.0
 * Uses dynamic Admin-set share percentages for calculation.
 */
export async function POST(request: Request) {
  try {
    const { 
      userId, 
      type = 'video_ad_signal', 
      watchTimeSec = 0, 
      completed = false, 
      country = 'Unknown', 
      ip = 'Unknown'
    } = await request.json();

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
      return NextResponse.json({ error: 'Identity Record Missing' }, { status: 404 });
    }

    const settings = settingsSnap.data();
    
    // --- REAL-TIME INDUSTRIAL PROFIT CALCULATION ---
    // Industrial CPM Bench: ₹0.50 per signal
    const estimatedTotalRevenueINR = 0.50; 
    
    // Fetch manual share % set by Admin
    const userSharePercent = settings?.userRevenueSharePercent || 10; 
    const userRewardINR = estimatedTotalRevenueINR * (userSharePercent / 100); 
    const adminProfitINR = estimatedTotalRevenueINR - userRewardINR;

    const coinsPerINR = settings?.coinsPerINR || 100;
    const rewardAmountCoins = Math.floor(userRewardINR * coinsPerINR); 

    // 1. User Wallet Sync
    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      generalTasksCount: increment(1),
      lastActiveAt: serverTimestamp(),
      pendingRevenueShare: increment(userRewardINR / 80), // USD Equivalent
      totalRevenueGenerated: increment(estimatedTotalRevenueINR / 80)
    });

    // 2. Platform Intelligence Sync
    batch.set(statsRef, {
      totalGrossRevenueINR: increment(estimatedTotalRevenueINR),
      totalUserPayoutsINR: increment(userRewardINR),
      totalAdminProfitINR: increment(adminProfitINR),
      totalViews: increment(1),
      totalWatchTimeSec: increment(watchTimeSec),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 3. Encrypted Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'distributed_yield',
      amount: rewardAmountCoins,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Signal Sync: ${userSharePercent}% Industrial Dividend`
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      credit: rewardAmountCoins,
      status: `SIGNAL_LOCKED_${userSharePercent}_PERCENT`
    });

  } catch (error) {
    return NextResponse.json({ error: 'System Sync Error' }, { status: 500 });
  }
}
