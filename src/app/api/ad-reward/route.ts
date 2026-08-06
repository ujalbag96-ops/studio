export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

/**
 * Industrial Real-Time Dynamic Revenue Share Gateway v17.0
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
    
    const estimatedTotalRevenueINR = 0.50; 
    let userSharePercent = settings?.userRevenueSharePercent || 10;
    
    if (type === 'youtube_stream_signal') {
       userSharePercent = settings?.youtubeUserSharePercent || 10;
    } else if (type === 'direct_stream_signal' || type === 'video_quiz_reward' || type === 'video_ad_signal') {
       userSharePercent = settings?.videoUserSharePercent || 10;
    }

    const userRewardINR = estimatedTotalRevenueINR * (userSharePercent / 100); 
    const adminProfitINR = estimatedTotalRevenueINR - userRewardINR;

    const coinsPerINR = settings?.coinsPerINR || 100;
    const rewardAmountCoins = Math.floor(userRewardINR * coinsPerINR); 

    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      generalTasksCount: increment(1),
      lastActiveAt: serverTimestamp(),
      pendingRevenueShare: increment(userRewardINR / 80),
      totalRevenueGenerated: increment(estimatedTotalRevenueINR / 80)
    });

    batch.set(statsRef, {
      totalGrossRevenueINR: increment(estimatedTotalRevenueINR),
      totalUserPayoutsINR: increment(userRewardINR),
      totalAdminProfitINR: increment(adminProfitINR),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

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
      status: `SIGNAL_LOCKED_${userSharePercent}_PERCENT`
    });

  } catch (error) {
    return NextResponse.json({ error: 'System Sync Error' }, { status: 500 });
  }
}
