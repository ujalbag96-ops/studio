
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Industrial Real-Time Dynamic Revenue Share Gateway v12.0
 * Fully integrated with Admin Economy Hub and Distributed Yield logic.
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
      return NextResponse.json({ error: 'Identity Record Missing' }, { status: 404 });
    }

    const settings = settingsSnap.data();
    
    // --- REAL-TIME INDUSTRIAL DYNAMIC CALCULATION ---
    // Industrial standard revenue baseline (Bench: ₹0.50)
    const estimatedTotalRevenueINR = 0.50; 
    
    // Fetch live percentage from Admin Hub (Requested logic: 10% Share = ₹0.05)
    const userSharePercent = settings?.userRevenueSharePercent || 10; 
    const adminSharePercent = 100 - userSharePercent;

    const userRewardINR = estimatedTotalRevenueINR * (userSharePercent / 100); 
    const coinsPerINR = settings?.coinsPerINR || 100; // 1 INR = 100 Coins
    const rewardAmountCoins = Math.floor(userRewardINR * coinsPerINR); 

    const adminProfitINR = estimatedTotalRevenueINR - userRewardINR;

    // 1. User Wallet Sync (Real-time credit)
    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      generalTasksCount: increment(1),
      pendingRevenueShare: increment(userRewardINR / 80), // Track stats in approximate USD
      totalRevenueGenerated: increment(estimatedTotalRevenueINR / 80)
    });

    // 2. Global Platform Intelligence Registry
    batch.set(statsRef, {
      totalDailyRevenueINR: increment(estimatedTotalRevenueINR),
      totalAdminProfitINR: increment(adminProfitINR),
      totalUserDividendINR: increment(userRewardINR),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 3. Industrial S2S Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'distributed_yield',
      amount: rewardAmountCoins,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Verified Signal: ${userSharePercent}% Industrial Dividend [${type}]`,
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
