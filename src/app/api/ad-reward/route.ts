
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

/**
 * Industrial Real-Time Dynamic Revenue Share & Analytics Gateway v13.0
 * Updated with auto-calculated profit engine.
 */
export async function POST(request: Request) {
  try {
    const { userId, type = 'video_ad_signal', watchTimeSec = 0, completed = false, country = 'Unknown', ip = 'Unknown' } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Identity Missing' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const statsRef = doc(firestore, 'platform_stats', 'revenue');
    const settingsRef = doc(firestore, 'app_settings', 'global_config');
    const analyticsRef = doc(collection(firestore, 'video_analytics'));

    const [userSnap, settingsSnap] = await Promise.all([
      getDoc(userRef),
      getDoc(settingsRef)
    ]);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Identity Record Missing' }, { status: 404 });
    }

    const settings = settingsSnap.data();
    
    // --- REAL-TIME INDUSTRIAL CALCULATION ---
    // Standard revenue baseline (Bench: ₹0.50)
    const estimatedTotalRevenueINR = 0.50; 
    
    // Fetch live percentage from Admin Hub
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
      pendingRevenueShare: increment(userRewardINR / 80), 
      totalRevenueGenerated: increment(estimatedTotalRevenueINR / 80)
    });

    // 2. Global Platform Intelligence & Profit Calculator
    batch.set(statsRef, {
      totalGrossRevenueINR: increment(estimatedTotalRevenueINR),
      totalUserPayoutsINR: increment(userRewardINR),
      totalAdminProfitINR: increment(adminProfitINR),
      totalViews: increment(1),
      totalWatchTimeSec: increment(watchTimeSec),
      [`countryBreakdown.${country.replace(/\./g, '_')}`]: increment(1),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 3. Analytics Event Logging
    batch.set(analyticsRef, {
      userId,
      streamType: type.includes('youtube') ? 'youtube' : 'direct',
      watchTimeSec,
      completed,
      country,
      ip,
      timestamp: new Date().toISOString()
    });

    // 4. Industrial S2S Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'distributed_yield',
      amount: rewardAmountCoins,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Verified Signal: ${userSharePercent}% Industrial Dividend`,
      calculation: `Signal: ₹${estimatedTotalRevenueINR.toFixed(2)} | Share: ${userSharePercent}%`
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      credit: rewardAmountCoins,
      rewardINR: userRewardINR,
      status: `SIGNAL_LOCKED_${userSharePercent}_PERCENT`,
      shareEnforced: userSharePercent
    });

  } catch (error) {
    console.error("Economy Node Malfunction:", error);
    return NextResponse.json({ error: 'System Sync Critical Error' }, { status: 500 });
  }
}
