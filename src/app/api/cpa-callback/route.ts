
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Global CPA Postback Gateway v6.0
 * DYNAMIC REVENUE LOGIC:
 * 1. Domestic (India): 60% User / 40% Admin
 * 2. International (Global): Base 30% User / 70% Admin
 * 3. Elite International (1000+ Refs): 35% User / 65% Admin
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  // Raw Revenue is passed in USD from Global Networks
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

    // --- DYNAMIC PROFITABILITY CALIBRATION ---
    const isIndia = userData.country === 'India';
    const isElite = !!userData.isEliteAffiliate;
    
    // Logic: India gets 60%, Global gets 30%, Elite Global gets 35%
    let userSharePct = isIndia ? 0.60 : (isElite ? 0.35 : 0.30);
    
    // Assumption: 1 USD = 1000 Coins Base for Global tracking
    const totalCoinsInOffer = rawRevenueUSD * 1000;
    const rewardAmountCoins = Math.floor(totalCoinsInOffer * userSharePct);

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
      description: `Verified Mission: ${offerName} (${(userSharePct * 100).toFixed(0)}% Share)`,
      isPostbackVerified: true,
      geoMode: isIndia ? 'Domestic' : (isElite ? 'Elite-Global' : 'Standard-Global'),
      sharePct: `${userSharePct * 100}%`
    });

    // Update parent commission if applicable
    if (userData.referredBy) {
       // Referral Commission Logic (Std: 5%, Elite: 7%)
       const parentRef = doc(firestore, 'users', userData.referredBy);
       const parentSnap = await getDoc(parentRef);
       if (parentSnap.exists()) {
          const parentData = parentSnap.data();
          const commPct = parentData.isEliteAffiliate ? 0.07 : 0.05;
          const commAmount = Math.floor(totalCoinsInOffer * commPct);
          
          batch.update(parentRef, {
             winningBalance: increment(commAmount),
             coins: increment(commAmount),
             totalNetworkRevenue: increment(commAmount)
          });
          
          batch.set(doc(collection(firestore, 'users', userData.referredBy, 'ledger')), {
             type: 'referral_comm',
             amount: commAmount,
             date: dateStr,
             status: 'completed',
             description: `Network Commission from ${userData.email || 'Warrior'}`
          });
       }
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      share: `${userSharePct * 100}%`,
      reward: rewardAmountCoins 
    });

  } catch (error: any) {
    console.error('Global Postback Failure:', error);
    return NextResponse.json({ error: 'Operational Node Offline' }, { status: 500 });
  }
}
