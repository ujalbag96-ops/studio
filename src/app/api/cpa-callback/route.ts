
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch, addDoc } from 'firebase/firestore';
import { USER_REWARD_SHARE, ADMIN_PROFIT_MARGIN } from '@/lib/currency';

/**
 * Industrial CPA S2S Postback Node v2.0
 * Strictly enforces the 70% Profit Lock & Lifecycle Prompts.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  let rawRevenueUSD = parseFloat(searchParams.get('payout') || '0');
  const offerName = searchParams.get('offer') || 'Industrial Conversion';
  
  if (!userId || isNaN(rawRevenueUSD) || rawRevenueUSD <= 0) {
    return NextResponse.json({ error: 'Invalid Signal' }, { status: 400 });
  }

  try {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const statsRef = doc(firestore, 'platform_stats', 'revenue');
    const conversionRef = doc(collection(firestore, 'cpa_conversions'));

    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Identity Record Missing' }, { status: 404 });
    }

    const userData = userSnap.data();

    // --- 70/30 PROFIT DISTRIBUTION ENGINE ---
    const userShareUSD = rawRevenueUSD * USER_REWARD_SHARE; // 30% User Share
    const adminProfitUSD = rawRevenueUSD * ADMIN_PROFIT_MARGIN; // 70% Admin Profit Locked
    
    const rewardAmountCoins = Math.floor(userShareUSD * 1000); // Scale to coins (1000:1 USD)

    // 1. User Wallet Sync
    batch.update(userRef, {
      taskBalance: increment(rewardAmountCoins),
      coins: increment(rewardAmountCoins),
      cpaTasksCount: increment(1),
      tasksCompletedCount: increment(1),
      pendingRevenueShare: increment(userShareUSD)
    });

    // 2. Platform Revenue Registry (Admin Profit Focus)
    batch.set(statsRef, {
      totalDailyRevenueUSD: increment(rawRevenueUSD),
      totalAdminProfitUSD: increment(adminProfitUSD),
      totalDistributedToUsersUSD: increment(userShareUSD),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 3. Encrypted Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'income',
      amount: rewardAmountCoins,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Verified Conversion: ${offerName}`,
      profitSplit: '70/30 Lock',
      userShareUSD: userShareUSD
    });

    // 4. Live Tracking for Admin Dashboard
    batch.set(conversionRef, {
      userId,
      userEmail: userData.email || 'Anonymous',
      offerName,
      payoutUSD: rawRevenueUSD,
      userShareCoins: rewardAmountCoins,
      status: 'Credited',
      timestamp: new Date().toISOString()
    });

    // 5. Post-Completion Lifecycle Prompt (Inbox)
    const notifRef = doc(collection(firestore, 'notifications'));
    batch.set(notifRef, {
      userId: userId,
      title: '✅ REWARD CLAIMED!',
      body: `Success! ${rewardAmountCoins} coins added for "${offerName}". You can now safely uninstall the app to save storage.`,
      timestamp: new Date().toISOString(),
      type: 'system',
      imageUrl: 'https://picsum.photos/seed/success/400/200'
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      status: 'S2S_MARG_LOCKED',
      userCredit: rewardAmountCoins,
      lifecycle: 'UNINSTALL_PROMPT_SENT'
    });

  } catch (error: any) {
    console.error('CPA Postback Sync Error:', error);
    return NextResponse.json({ error: 'Sync Error' }, { status: 500 });
  }
}
