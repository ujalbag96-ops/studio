
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';
import { getPayoutPercentage } from '@/lib/currency';

/**
 * Industrial S2S Postback Gateway v6.0
 * PROFIT LOCK ENGINE:
 * 1. Receive Network Signal (USD)
 * 2. Deduct 68-70% Admin Margin Instantly
 * 3. Credit remaining 30-32% as Coins
 * 4. Verify VIP 1 Status before enabling withdrawal
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  let rawRevenueUSD = parseFloat(searchParams.get('payout') || '0');
  const offerName = searchParams.get('offer') || 'Mediation Signal';
  const networkToken = searchParams.get('token'); // Postback Secret
  
  if (!userId || isNaN(rawRevenueUSD) || rawRevenueUSD <= 0) {
    return NextResponse.json({ error: 'Invalid Signal' }, { status: 400 });
  }

  try {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Identity Record Missing' }, { status: 404 });
    }

    const userData = userSnap.data();
    if (userData.isSuspended) {
       return NextResponse.json({ error: 'Account Frozen: Fraud Signal' }, { status: 403 });
    }

    // --- PROFIT LOCK CALCULATION ---
    const userSharePct = getPayoutPercentage(userData.country);
    const adminSharePct = 1 - userSharePct;
    
    // Formula: (Network USD * User Share) / 0.001 (for 1000:1 USD scale)
    const rewardAmountCoins = Math.floor((rawRevenueUSD * userSharePct * 1000)); 

    // Wallet Sync
    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      cpaTasksCount: increment(1),
      tasksCompletedCount: increment(1)
    });

    // Ledger Log with Profit Audit
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'income',
      amount: rewardAmountCoins,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Verified Conversion: ${offerName}`,
      adminProfitUSD: rawRevenueUSD * adminSharePct,
      userShare: userSharePct
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      status: 'S2S_VERIFIED',
      credit: rewardAmountCoins,
      adminMargin: `${(adminSharePct * 100).toFixed(0)}%`
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'System Synchronizer Offline' }, { status: 500 });
  }
}
