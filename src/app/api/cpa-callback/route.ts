
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, addDoc, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Postback-Enforced Reward Gateway with VIP Escalation & MLM Distribution
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  let rewardAmount = parseFloat(searchParams.get('reward') || '0');
  const appName = searchParams.get('offer') || 'System Task';
  
  if (!userId || isNaN(rewardAmount) || rewardAmount <= 0) {
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

    const dateStr = new Date().toISOString().split('T')[0];
    const newTasksTotal = (userData.tasksCompletedCount || 0) + 1;

    // --- VIP ESCALATION LOGIC ---
    let newVipLevel = userData.vipLevel || 0;
    const vipTiers = [
      { tasks: 10, level: 1, name: 'VIP 1: Rookie' },
      { tasks: 30, level: 2, name: 'VIP 2: Warrior' },
      { tasks: 60, level: 3, name: 'VIP 3: Pro' },
      { tasks: 100, level: 4, name: 'VIP 4: Master' },
      { tasks: 200, level: 5, name: 'VIP 5: Elite' },
      { tasks: 500, level: 6, name: 'VIP 6: Legend' },
      { tasks: 1000, level: 7, name: 'VIP 7: God Mode' }
    ];

    const nextTier = vipTiers.find(t => newTasksTotal >= t.tasks && newVipLevel < t.level);
    if (nextTier) {
       newVipLevel = nextTier.level;
       await addDoc(collection(firestore, 'notifications'), {
          userId: userId,
          title: `🔥 PROMOTED TO ${nextTier.name.toUpperCase()}`,
          body: `Mission mastery reached ${nextTier.tasks} tasks. Your withdrawal limits are now boosted!`,
          timestamp: new Date().toISOString(),
          type: 'milestone'
       });
    }

    // --- MLM COMMISSION DISTRIBUTION (2 LEVELS) ---
    // Level 1: 5% | Level 2: 2%
    const commL1 = rewardAmount * 0.05;
    const commL2 = rewardAmount * 0.02;

    if (userData.referredBy) {
      const l1Ref = doc(firestore, 'users', userData.referredBy);
      batch.update(l1Ref, {
        referralCommissionBalance: increment(commL1),
        totalNetworkRevenue: increment(commL1),
        networkTaskCompletions: increment(1),
        coins: increment(commL1)
      });
      batch.set(doc(collection(firestore, 'users', userData.referredBy, 'ledger')), {
        type: 'referral_comm',
        amount: commL1,
        date: dateStr,
        status: 'completed',
        description: `Team Commission (L1) from ${userData.email || userData.id}`
      });
    }

    if (userData.referredByL2) {
      const l2Ref = doc(firestore, 'users', userData.referredByL2);
      batch.update(l2Ref, {
        referralCommissionBalance: increment(commL2),
        totalNetworkRevenue: increment(commL2),
        networkTaskCompletions: increment(1),
        coins: increment(commL2)
      });
      batch.set(doc(collection(firestore, 'users', userData.referredByL2, 'ledger')), {
        type: 'referral_comm',
        amount: commL2,
        date: dateStr,
        status: 'completed',
        description: `Team Commission (L2) from downline activity`
      });
    }

    // Main Reward Credit
    batch.update(userRef, {
      taskBalance: increment(rewardAmount),
      coins: increment(rewardAmount),
      tasksCompletedCount: increment(1),
      vipLevel: newVipLevel,
      isAccountActivated: newTasksTotal >= 10 || userData.isAccountActivated
    });

    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'income',
      amount: rewardAmount,
      date: dateStr,
      status: 'completed',
      description: `Mission Verified: ${appName}`,
      isPostbackVerified: true
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: 'System Liquidity Synced',
      vip: newVipLevel 
    });

  } catch (error: any) {
    console.error('Postback Runtime Failure:', error);
    return NextResponse.json({ error: 'Operational Hub Offline' }, { status: 500 });
  }
}
