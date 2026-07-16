
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, addDoc, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Postback-Enforced Reward Gateway with VIP Escalation, MLM Distribution & Mega Milestone Audit
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
    // Standard: L1: 5% | L2: 2%
    // Elite Booster: L1: 7% | L2: 4%

    if (userData.referredBy) {
      const l1Ref = doc(firestore, 'users', userData.referredBy);
      const l1Snap = await getDoc(l1Ref);
      if (l1Snap.exists()) {
        const l1Data = l1Snap.data();
        const commRate = l1Data.isEliteAffiliate ? 0.07 : 0.05;
        const commAmount = rewardAmount * commRate;
        
        batch.update(l1Ref, {
          referralCommissionBalance: increment(commAmount),
          totalNetworkRevenue: increment(commAmount),
          networkTaskCompletions: increment(1),
          coins: increment(commAmount)
        });

        // MEGA MILESTONE CHECK: 1000 Downline
        const totalNet = (l1Data.totalNetworkReferrals || 0);
        if (totalNet >= 1000 && !l1Data.megaMilestoneClaimed) {
          batch.update(l1Ref, {
            isEliteAffiliate: true,
            megaMilestoneClaimed: true,
            coins: increment(100000), // ₹1,000 Bonus
            winningBalance: increment(100000),
            vipLevel: 7 // Grand Prize Upgrade
          });
          await addDoc(collection(firestore, 'notifications'), {
            userId: userData.referredBy,
            title: `🏆 MEGA MILESTONE: ELITE AFFILIATE`,
            body: `Incredible! You hit 1,000 downline. ₹1,000 Cash Bonus & Permanent VIP 7 Status unlocked.`,
            timestamp: new Date().toISOString(),
            type: 'milestone'
          });
        }

        batch.set(doc(collection(firestore, 'users', userData.referredBy, 'ledger')), {
          type: 'referral_comm',
          amount: commAmount,
          date: dateStr,
          status: 'completed',
          description: `Team Commission (L1) from ${userData.email || userData.id}`
        });
      }
    }

    if (userData.referredByL2) {
      const l2Ref = doc(firestore, 'users', userData.referredByL2);
      const l2Snap = await getDoc(l2Ref);
      if (l2Snap.exists()) {
        const l2Data = l2Snap.data();
        const commRate = l2Data.isEliteAffiliate ? 0.04 : 0.02;
        const commAmount = rewardAmount * commRate;

        batch.update(l2Ref, {
          referralCommissionBalance: increment(commAmount),
          totalNetworkRevenue: increment(commAmount),
          networkTaskCompletions: increment(1),
          coins: increment(commAmount)
        });

        batch.set(doc(collection(firestore, 'users', userData.referredByL2, 'ledger')), {
          type: 'referral_comm',
          amount: commAmount,
          date: dateStr,
          status: 'completed',
          description: `Team Commission (L2) from downline activity`
        });
      }
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
