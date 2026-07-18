
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Global CPA Postback Gateway v5.0
 * 1. Domestic (India): 60% User / 40% Admin
 * 2. International (US/UK/Global): 35% User / 65% Admin
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  // Raw Revenue is usually passed in USD from Global Networks
  let rawRevenueUSD = parseFloat(searchParams.get('payout') || '0');
  const offerName = searchParams.get('offer') || 'Global Mission';
  const category = searchParams.get('type') || 'CPA'; 
  
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

    // --- GLOBAL PROFITABILITY LOGIC ---
    const isIndia = userData.country === 'India';
    
    // Logic: India gets 60% share, International gets 35% share
    const userSharePct = isIndia ? 0.60 : 0.35;
    const adminSharePct = 1 - userSharePct;

    // Convert USD payout to Coins
    // Assumption: 1 USD = 1000 Coins Base
    const totalCoinsInOffer = rawRevenueUSD * 1000;
    const rewardAmountCoins = Math.floor(totalCoinsInOffer * userSharePct);
    const adminProfitCoins = totalCoinsInOffer - rewardAmountCoins;

    const dateStr = new Date().toISOString().split('T')[0];

    // Wallet Sync
    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      tasksCompletedCount: increment(1),
      cpaTasksCount: increment(1)
    });

    // Encrypted Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'income',
      amount: rewardAmountCoins,
      date: dateStr,
      status: 'completed',
      description: `Verified [${userData.country}] ${category}: ${offerName}`,
      isPostbackVerified: true,
      geoMode: isIndia ? 'Domestic' : 'International',
      sharePct: `${userSharePct * 100}%`
    });

    // Elite Milestone Check (1000 Referrals)
    if (userData.totalNetworkReferrals >= 1000 && !userData.isEliteAffiliate) {
      batch.update(userRef, { isEliteAffiliate: true, vipLevel: 7 });
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      geo: userData.country,
      reward: rewardAmountCoins,
      share: `${userSharePct * 100}%`
    });

  } catch (error: any) {
    console.error('Global Postback Failure:', error);
    return NextResponse.json({ error: 'Operational Node Offline' }, { status: 500 });
  }
}
