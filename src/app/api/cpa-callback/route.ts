
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Industrial CPA S2S Postback Node v5.0
 * Uses MANUAL Admin-set rates from Economy Control Hub.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  let rawRevenueUSD = parseFloat(searchParams.get('payout') || '0');
  const offerName = searchParams.get('offer') || 'CPA Conversion';
  
  if (!userId || isNaN(rawRevenueUSD) || rawRevenueUSD <= 0) {
    return NextResponse.json({ error: 'Invalid Signal' }, { status: 400 });
  }

  try {
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

    // --- REAL-TIME MANUAL REVENUE SHARE ENGINE ---
    const userSharePercent = settings?.cpaUserSharePercent || settings?.userRevenueSharePercent || 30;
    const adminSharePercent = 100 - userSharePercent;
    
    const userShareUSD = rawRevenueUSD * (userSharePercent / 100); 
    const adminProfitUSD = rawRevenueUSD * (adminSharePercent / 100); 
    
    const coinsPerUSD = settings?.coinsPerUSD || 1000;
    const rewardAmountCoins = Math.floor(userShareUSD * coinsPerUSD);

    // 1. User Wallet Sync
    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      cpaTasksCount: increment(1),
      pendingRevenueShare: increment(userShareUSD),
      totalRevenueGenerated: increment(rawRevenueUSD)
    });

    // 2. Global Analytics Ledger (INR for Master Stats)
    const inrValue = rawRevenueUSD * 80;
    batch.set(statsRef, {
      totalGrossRevenueINR: increment(inrValue),
      totalUserPayoutsINR: increment(userShareUSD * 80),
      totalAdminProfitINR: increment(adminProfitUSD * 80),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 3. Encrypted Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'income',
      amount: rewardAmountCoins,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Verified CPA: ${offerName} (${userSharePercent}% Share)`,
      profitSplit: `${adminSharePercent}/${userSharePercent} Lock`
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      status: 'S2S_MANUAL_CALIBRATED',
      userCredit: rewardAmountCoins,
      shareApplied: `${userSharePercent}%`
    });

  } catch (error: any) {
    console.error('CPA Postback Sync Error:', error);
    return NextResponse.json({ error: 'Sync Error' }, { status: 500 });
  }
}
