
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';
import { getPayoutPercentage } from '@/lib/currency';

/**
 * Global CPA Postback Gateway v7.0
 * DYNAMIC REVENUE LOGIC:
 * 1. Domestic (India): 30% User Share
 * 2. US/UK: 32% User Share
 * 3. Validation Required: 5 CPA + 10 General to unlock withdrawal
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  let rawRevenueUSD = parseFloat(searchParams.get('payout') || '0');
  const offerName = searchParams.get('offer') || 'Industrial Mission';
  
  if (!userId || isNaN(rawRevenueUSD) || rawRevenueUSD <= 0) {
    return NextResponse.json({ error: 'Invalid Signal' }, { status: 400 });
  }

  try {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Identity Missing' }, { status: 404 });
    }

    const userData = userSnap.data();
    if (userData.isSuspended) {
       return NextResponse.json({ error: 'Identity Locked' }, { status: 403 });
    }

    // --- REGIONAL PAYOUT CALIBRATION ---
    const userSharePct = getPayoutPercentage(userData.country);
    
    // Base: 1 USD = 10,000 Coins (Adjusted for finer precision)
    // If USD payout is $1.00, Total Pool = 10,000 Coins
    // India User (30%) gets 3,000 Coins
    // US User (32%) gets 3,200 Coins
    const totalCoinsInOfferPool = rawRevenueUSD * 10000;
    const rewardAmountCoins = Math.floor(totalCoinsInOfferPool * userSharePct);

    const dateStr = new Date().toISOString().split('T')[0];

    // Wallet Sync
    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      cpaTasksCount: increment(1), // Important for Validation
      tasksCompletedCount: increment(1)
    });

    // Encrypted Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'income',
      amount: rewardAmountCoins,
      date: dateStr,
      status: 'completed',
      description: `CPA Mission: ${offerName} (${(userSharePct * 100).toFixed(0)}% Share)`,
      isPostbackVerified: true,
      geo: userData.country || 'Global',
      payoutPct: userSharePct
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      share: `${(userSharePct * 100).toFixed(0)}%`,
      reward: rewardAmountCoins 
    });

  } catch (error: any) {
    console.error('Global Postback Failure:', error);
    return NextResponse.json({ error: 'Operational Node Offline' }, { status: 500 });
  }
}
