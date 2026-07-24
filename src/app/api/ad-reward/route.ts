
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Industrial Revenue Share Gateway v3.0
 * Uses dynamic Admin-set rates & margins.
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
    const settingsRef = doc(firestore, 'app_settings', 'global_config');

    const [userSnap, settingsSnap] = await Promise.all([
      getDoc(userRef),
      getDoc(settingsRef)
    ]);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Identity Missing' }, { status: 404 });
    }

    const settings = settingsSnap.data();
    const userSharePercent = settings?.userRevenueSharePercent || 20; 
    const adminSharePercent = 100 - userSharePercent;
    const coinsPerUSD = settings?.coinsPerUSD || 1000;

    // --- REVENUE CALCULATION ENGINE ---
    // Mapping reward (coins) to USD based on dynamic coinsPerUSD setting
    const estimatedTotalValueUSD = (reward / coinsPerUSD) / (userSharePercent / 100);
    const userShareUSD = estimatedTotalValueUSD * (userSharePercent / 100);
    const adminProfitUSD = estimatedTotalValueUSD * (adminSharePercent / 100);

    // 1. User Wallet Sync
    batch.update(userRef, {
      taskBalance: increment(reward),
      coins: increment(reward),
      generalTasksCount: increment(1),
      pendingRevenueShare: increment(userShareUSD),
      totalRevenueGenerated: increment(estimatedTotalValueUSD)
    });

    // 2. Global Platform Analytics
    batch.set(statsRef, {
      totalOperationalRevenueUSD: increment(estimatedTotalValueUSD),
      totalAdminProfitUSD: increment(adminProfitUSD),
      totalUserDividendUSD: increment(userShareUSD),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 3. Encrypted Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'revenue_share_credit',
      amount: reward,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Video Ad Signal: ${userSharePercent}% Share Credited`,
      usdValue: userShareUSD
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      credit: reward,
      userShareUSD,
      status: `REVENUE_LOCKED_${adminSharePercent}_${userSharePercent}`
    });

  } catch (error) {
    return NextResponse.json({ error: 'Revenue Engine Error' }, { status: 500 });
  }
}
