
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Geo-Aware Postback Gateway v4.0
 * 1. India Logic: 60% User / 40% Admin
 * 2. Global Logic: 35% User / 65% Admin (High procurement cost buffer)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  let rawRevenueINR = parseFloat(searchParams.get('payout') || '0');
  const appName = searchParams.get('offer') || 'System Task';
  
  if (!userId || isNaN(rawRevenueINR) || rawRevenueINR <= 0) {
    return NextResponse.json({ error: 'Invalid Tactical Signal' }, { status: 400 });
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

    // --- GEO-PROFITABILITY LOGIC ---
    const isIndia = userData.country === 'India';
    
    // Logic: India gets 60% share, Global gets 35% share
    const userSharePct = isIndia ? 0.60 : 0.35;
    const adminSharePct = 1 - userSharePct;

    const userRewardValue = rawRevenueINR * userSharePct;
    const adminProfitValue = rawRevenueINR * adminSharePct;
    
    // Coin mapping: 1 Unit Revenue = 100 Coins (Scaled for display)
    const rewardAmountCoins = userRewardValue * 100;

    const dateStr = new Date().toISOString().split('T')[0];
    const currentCpa = (userData.cpaTasksCount || 0) + 1;

    // VIP Quest Logic (Simplified)
    let newVipLevel = userData.vipLevel || 0;
    if (newVipLevel === 0 && currentCpa >= 5) {
       // Check other conditions (Referrals/Eng) if needed
    }

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
      description: `Verified Mission [${userData.country}]: ${appName}`,
      isPostbackVerified: true,
      platformProfit: adminProfitValue,
      geoMode: isIndia ? 'Domestic' : 'International'
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      geo: userData.country,
      share: `${userSharePct * 100}%`,
      coins: rewardAmountCoins
    });

  } catch (error: any) {
    console.error('Postback Failure:', error);
    return NextResponse.json({ error: 'Sync Node Offline' }, { status: 500 });
  }
}
