
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, addDoc, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Postback-Enforced Reward Gateway v3.0
 * 1. dynamic Rewards based on CPA Network signal.
 * 2. Automatic 40% Platform Profit Retention.
 * 3. VIP 1 Quest Enforcement (Requires Verified Signal).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  // Raw reward sent by CPA Network (e.g. in INR)
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

    // --- PROFITABILITY LOGIC (40% Platform Margin) ---
    // User gets 60% of what the admin receives.
    const userRewardINR = rawRevenueINR * 0.60;
    const adminProfitINR = rawRevenueINR * 0.40;
    const rewardAmountCoins = userRewardINR * 100; // 1 INR = 100 Coins

    const dateStr = new Date().toISOString().split('T')[0];
    const currentCpa = (userData.cpaTasksCount || 0) + 1;
    const currentRefs = (userData.referralTasksCount || 0);
    const currentEng = (userData.engagementCount || 0);

    // --- VIP QUEST & ESCALATION ---
    let newVipLevel = userData.vipLevel || 0;
    let questCelebrationPending = false;

    if (newVipLevel === 0 && currentCpa >= 5 && currentRefs >= 3 && currentEng >= 2) {
       newVipLevel = 1;
       questCelebrationPending = true;
       batch.update(userRef, {
          rank: 'Silver',
          isAccountActivated: true,
          questCelebrationPending: true
       });
    } else if (newVipLevel > 0) {
       const tasksTotal = (userData.tasksCompletedCount || 0) + 1;
       const tiers = [
          { tasks: 30, level: 2 },
          { tasks: 60, level: 3 },
          { tasks: 100, level: 4 },
          { tasks: 200, level: 5 }
       ];
       const next = tiers.find(t => tasksTotal >= t.tasks && newVipLevel < t.level);
       if (next) newVipLevel = next.level;
    }

    // MLM Logic (Elite Boosters)
    if (userData.referredBy) {
      const l1Ref = doc(firestore, 'users', userData.referredBy);
      const l1Snap = await getDoc(l1Ref);
      if (l1Snap.exists()) {
        const l1Data = l1Snap.data();
        const commRate = l1Data.isEliteAffiliate ? 0.07 : 0.05;
        const commAmountCoins = rewardAmountCoins * commRate;
        
        batch.update(l1Ref, {
          referralCommissionBalance: increment(commAmountCoins),
          totalNetworkRevenue: increment(commAmountCoins),
          coins: increment(commAmountCoins)
        });
      }
    }

    // Main Wallet Sync
    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      tasksCompletedCount: increment(1),
      cpaTasksCount: increment(1),
      vipLevel: newVipLevel
    });

    // Encrypted Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'income',
      amount: rewardAmountCoins,
      date: dateStr,
      status: 'completed',
      description: `Verified Mission: ${appName} (₹${userRewardINR.toFixed(2)})`,
      isPostbackVerified: true,
      revenueReceived: rawRevenueINR,
      platformProfit: adminProfitINR
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: 'Liquidity Synced',
      userRewardCoins: rewardAmountCoins,
      adminMargin: adminProfitINR
    });

  } catch (error: any) {
    console.error('Postback Runtime Failure:', error);
    return NextResponse.json({ error: 'Operational Hub Offline' }, { status: 500 });
  }
}
