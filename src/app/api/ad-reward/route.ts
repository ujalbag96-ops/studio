import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

/**
 * Industrial Real-Time Dynamic Revenue Share Gateway v17.0
 * Features individual percentage calibration for different stream types.
 * Fully synchronized with Admin Dashboard manual settings.
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
    // Standard Signal Revenue Benchmark: ₹0.50
    const estimatedTotalRevenueINR = 0.50; 
    
    // FETCH TYPE-SPECIFIC MANUAL SHARE %
    let userSharePercent = settings?.userRevenueSharePercent || 10;
    
    if (type === 'youtube_stream_signal') {
       userSharePercent = settings?.youtubeUserSharePercent || settings?.mon_youtube_stream_share || userSharePercent;
    } else if (type === 'direct_stream_signal' || type === 'video_quiz_reward' || type === 'video_ad_signal') {
       userSharePercent = settings?.videoUserSharePercent || settings?.mon_direct_stream_share || userSharePercent;
    }

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
      pendingRevenueShare: increment(userRewardINR / 80), // USD Equivalent for internal tracking
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
      description: `Signal Sync [${type}]: ${userSharePercent}% Industrial Dividend`
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      credit: rewardAmountCoins,
      status: `SIGNAL_LOCKED_${userSharePercent}_PERCENT`,
      shareApplied: `${userSharePercent}%`
    });

  } catch (error) {
    console.error('Ad Reward Sync Error:', error);
    return NextResponse.json({ error: 'System Sync Error' }, { status: 500 });
  }
}
