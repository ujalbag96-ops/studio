import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';

/**
 * Industrial Real-Time Dynamic Revenue Share & Analytics Gateway v14.0
 * Deep Analytics Tracking Node: Watch Time, Geo, Device, UID.
 */
export async function POST(request: Request) {
  try {
    const { 
      userId, 
      type = 'video_ad_signal', 
      watchTimeSec = 0, 
      completed = false, 
      country = 'Unknown', 
      ip = 'Unknown',
      deviceId = 'Unknown_Node' 
    } = await request.json();

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
    
    // --- REAL-TIME INDUSTRIAL PROFIT CALCULATION ---
    // Standard revenue baseline (Industrial CPM Bench: ₹0.50 per signal)
    const estimatedTotalRevenueINR = 0.50; 
    
    // Fetch dynamic percentage from Admin Hub
    const userSharePercent = settings?.userRevenueSharePercent || 10; 
    const userRewardINR = estimatedTotalRevenueINR * (userSharePercent / 100); 
    const adminProfitINR = estimatedTotalRevenueINR - userRewardINR;

    const coinsPerINR = settings?.coinsPerINR || 100;
    const rewardAmountCoins = Math.floor(userRewardINR * coinsPerINR); 

    // 1. User Wallet & Task Count Synchronization
    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      generalTasksCount: increment(1),
      lastActiveAt: serverTimestamp(),
      pendingRevenueShare: increment(userRewardINR / 80), // Store USD equivalent for stats
      totalRevenueGenerated: increment(estimatedTotalRevenueINR / 80)
    });

    // 2. Global Platform Intelligence & Auto-Calculated Profit Ledger
    batch.set(statsRef, {
      totalGrossRevenueINR: increment(estimatedTotalRevenueINR),
      totalUserPayoutsINR: increment(userRewardINR),
      totalAdminProfitINR: increment(adminProfitINR),
      totalViews: increment(1),
      totalWatchTimeSec: increment(watchTimeSec),
      [`countryBreakdown.${country.replace(/\./g, '_')}`]: increment(1),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 3. Deep Session Analytics Logging
    batch.set(analyticsRef, {
      userId,
      type,
      watchTimeSec,
      completed,
      country,
      ip,
      deviceId,
      timestamp: new Date().toISOString()
    });

    // 4. Industrial S2S Verification Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'distributed_yield',
      amount: rewardAmountCoins,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Signal Sync: ${userSharePercent}% Industrial Dividend`,
      metadata: {
        watchTime: `${watchTimeSec}s`,
        region: country,
        source: type
      }
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      credit: rewardAmountCoins,
      rewardINR: userRewardINR,
      status: `SIGNAL_LOCKED_${userSharePercent}_PERCENT`,
      profitNode: 'ACTIVE'
    });

  } catch (error) {
    console.error("Economy Node Malfunction:", error);
    return NextResponse.json({ error: 'System Sync Critical Error' }, { status: 500 });
  }
}
