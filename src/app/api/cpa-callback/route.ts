
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  let rawRevenueUSD = parseFloat(searchParams.get('payout') || '0');
  const offerName = searchParams.get('offer') || 'Mediation Signal';
  
  if (!userId || isNaN(rawRevenueUSD) || rawRevenueUSD <= 0) {
    return NextResponse.json({ error: 'Invalid Signal' }, { status: 400 });
  }

  try {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const settingsRef = doc(firestore, 'app_settings', 'global_config');
    const statsRef = doc(firestore, 'platform_stats', 'revenue');

    const [userSnap, settingsSnap] = await Promise.all([
      getDoc(userRef),
      getDoc(settingsRef)
    ]);

    if (!userSnap.exists() || !settingsSnap.exists()) {
      return NextResponse.json({ error: 'Identity Record Missing' }, { status: 404 });
    }

    const settingsData = settingsSnap.data();
    const sharePercent = settingsData.userRevenueSharePercent || 30;
    
    // Industrial Profit Calculation
    const userShareUSD = rawRevenueUSD * (sharePercent / 100);
    const rewardAmountCoins = Math.floor(userShareUSD * 1000); 

    // 1. Wallet Sync
    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      cpaTasksCount: increment(1),
      tasksCompletedCount: increment(1),
      pendingRevenueShare: increment(userShareUSD)
    });

    // 2. Update Global Platform Stats
    batch.set(statsRef, {
      totalDailyRevenueUSD: increment(rawRevenueUSD),
      totalDistributedToUsersUSD: increment(userShareUSD),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 3. Ledger Log
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'income',
      amount: rewardAmountCoins,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Verified Conversion: ${offerName} (${sharePercent}% Share)`,
      adminProfitUSD: rawRevenueUSD - userShareUSD,
      userShareUSD: userShareUSD
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      credit: rewardAmountCoins,
      status: 'S2S_VERIFIED'
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'System Synchronizer Offline' }, { status: 500 });
  }
}
