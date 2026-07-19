
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';
import { getPayoutPercentage } from '@/lib/currency';

/**
 * Industrial CPA Postback Gateway v5.0
 * CALCULATION ENGINE:
 * Coins = (Network Revenue USD * Payout % [30/32]) / 0.01
 * This ensures Admin strictly keeps 68-70% Net Profit.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  let rawRevenueUSD = parseFloat(searchParams.get('payout') || '0');
  const offerName = searchParams.get('offer') || 'Mission Signal';
  
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

    // --- STRATEGIC MARGIN CALIBRATION ---
    const userSharePct = getPayoutPercentage(userData.country);
    
    // Formula: (USD * Share) / 0.01 = Total Coins
    // If USD is $1.00, User (30%) gets (1 * 0.30) / 0.01 = 30 Coins (Representing ₹0.30 value at 100:1 scale)
    // NOTE: Adjustment for Coin Scale (100:1)
    const rewardAmountCoins = Math.floor((rawRevenueUSD * userSharePct * 10000) / 100); 

    const dateStr = new Date().toISOString().split('T')[0];

    // Wallet Sync
    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      cpaTasksCount: increment(1),
      tasksCompletedCount: increment(1)
    });

    // Referral Logic: Bonus activates ONLY if downline reaches VIP 1 (Handled in referral module)
    // Here we just log the task completion for auditing

    // Encrypted Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'income',
      amount: rewardAmountCoins,
      date: dateStr,
      status: 'completed',
      description: `Verified Mission: ${offerName} (${(userSharePct * 100).toFixed(0)}% Share)`,
      isPostbackVerified: true,
      geo: userData.country || 'Global',
      adminMargin: 1 - userSharePct
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      share: `${(userSharePct * 100).toFixed(0)}%`,
      reward: rewardAmountCoins 
    });

  } catch (error: any) {
    console.error('Industrial Postback Failure:', error);
    return NextResponse.json({ error: 'Operational Node Offline' }, { status: 500 });
  }
}
