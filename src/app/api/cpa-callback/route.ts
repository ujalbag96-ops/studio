
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, addDoc, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Postback-Enforced Reward Gateway with VIP 1 Quest Logic
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
    const currentCpa = (userData.cpaTasksCount || 0) + 1;
    const currentRefs = (userData.referralTasksCount || 0);
    const currentEng = (userData.engagementCount || 0);

    // --- VIP 1 QUEST LOGIC (5 CPA, 3 REFS, 2 ENG) ---
    let newVipLevel = userData.vipLevel || 0;
    if (newVipLevel === 0 && currentCpa >= 5 && currentRefs >= 3 && currentEng >= 2) {
       newVipLevel = 1;
       batch.update(userRef, {
          rank: 'Silver',
          isAccountActivated: true
       });
       
       await addDoc(collection(firestore, 'notifications'), {
          userId: userId,
          title: `🔥 VIP 1 PROTOCOL UNLOCKED`,
          body: `Congratulations! Your Quest is complete. Withdrawal access and high-value rewards are now active.`,
          timestamp: new Date().toISOString(),
          type: 'milestone'
       });
    } else if (newVipLevel > 0) {
       // Regular VIP escalation beyond VIP 1
       const tasksTotal = (userData.tasksCompletedCount || 0) + 1;
       const tiers = [
          { tasks: 30, level: 2 },
          { tasks: 50, level: 3 },
          { tasks: 100, level: 4 },
          { tasks: 200, level: 5 }
       ];
       const next = tiers.find(t => tasksTotal >= t.tasks && newVipLevel < t.level);
       if (next) newVipLevel = next.level;
    }

    // --- MLM COMMISSION DISTRIBUTION (2 LEVELS) ---
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
            coins: increment(100000), 
            winningBalance: increment(100000),
            vipLevel: 5 
          });
          await addDoc(collection(firestore, 'notifications'), {
            userId: userData.referredBy,
            title: `🏆 MEGA MILESTONE: ELITE AFFILIATE`,
            body: `₹1,000 Bonus & Permanent VIP 5 Status unlocked.`,
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

    // Main Reward Credit
    batch.update(userRef, {
      taskBalance: increment(rewardAmount),
      coins: increment(rewardAmount),
      tasksCompletedCount: increment(1),
      cpaTasksCount: increment(1),
      vipLevel: newVipLevel
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
