
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, addDoc, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Postback-Enforced Reward Gateway
 * This is the ONLY source for increasing user balances from CPA missions.
 * Includes Anti-Fraud validation and suspicious activity logging.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  let rewardAmount = parseFloat(searchParams.get('reward') || '0');
  const appName = searchParams.get('offer') || 'System Task';
  
  // High-Security Check: UID and Positive Reward required
  if (!userId || isNaN(rewardAmount) || rewardAmount <= 0) {
    console.error(`[SECURITY ALERT] Invalid Postback Attempt: UID ${userId} | Reward ${rewardAmount}`);
    
    // Log anomalous signal
    const { firestore } = initializeFirebase();
    if (userId) {
       await addDoc(collection(firestore, 'fraud_alerts'), {
          userId,
          type: 'INVALID_POSTBACK_PAYLOAD',
          timestamp: new Date().toISOString(),
          details: `Reward: ${rewardAmount} | App: ${appName}`
       });
    }

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
    const currentTasks = (userData.tasksCompletedCount || 0) + 1;

    // 1. VIP 1 Multiplier Check (5% Bonus)
    let vipBonus = 0;
    let newVipLevel = userData.vipLevel || 'VIP 0';

    if (newVipLevel === 'VIP 0' && currentTasks >= 10) {
       newVipLevel = 'VIP 1';
       await addDoc(collection(firestore, 'notifications'), {
          userId: userId,
          title: '🔥 VIP 1 PROMOTED',
          body: 'Milestone reached: 10 Tasks. You now earn +5% bonus on all missions!',
          timestamp: new Date().toISOString(),
          type: 'mission'
       });
    }

    if (newVipLevel === 'VIP 1') {
       vipBonus = rewardAmount * 0.05;
       rewardAmount += vipBonus;
    }

    // 2. Verified Credit (Worker Node)
    batch.update(userRef, {
      taskBalance: increment(rewardAmount),
      coins: increment(rewardAmount),
      tasksCompletedCount: increment(1),
      vipLevel: newVipLevel,
      isAccountActivated: currentTasks >= 10 || userData.isAccountActivated || (userData.depositBalance > 0)
    });

    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'income',
      amount: rewardAmount,
      date: dateStr,
      status: 'completed',
      description: `Verified Signal: ${appName} ${vipBonus > 0 ? '(+5% VIP Bonus)' : ''}`,
      isPostbackVerified: true
    });

    // 3. MLM Distribution (L1: 20%, L2: 10%)
    const uplineIds = [userData.referredBy, userData.referredByL2].filter(Boolean);

    for (const parentId of uplineIds) {
      if (!parentId) continue;
      const parentRef = doc(firestore, 'users', parentId);
      const parentSnap = await getDoc(parentRef);
      
      if (parentSnap.exists()) {
        const pData = parentSnap.data();
        
        // Anti-Fraud: Referrer and Worker cannot be on the same hardware/IP
        const isFraudDetected = pData.deviceId === userData.deviceId || pData.lastIp === userData.lastIp;

        if (isFraudDetected) {
           await addDoc(collection(firestore, 'fraud_alerts'), {
              referrerId: parentId,
              workerId: userId,
              type: 'COLLISION_DETECTED',
              timestamp: new Date().toISOString()
           });
           continue; 
        }

        const isL1 = parentId === userData.referredBy;
        const commRate = isL1 ? 0.20 : 0.10;
        const commAmount = rewardAmount * commRate;

        // Condition: Leader must have 5 personal tasks + 5 direct refs
        const isActiveLeader = (pData.tasksCompletedCount || 0) >= 5 && (pData.totalReferrals || 0) >= 5;

        // Increment milestone tracker for leader
        batch.update(parentRef, {
          networkTaskCompletions: increment(1),
          totalNetworkRevenue: increment(rewardAmount)
        });

        if (isActiveLeader) {
          batch.update(parentRef, {
            referralCommissionBalance: increment(commAmount),
            coins: increment(commAmount),
          });

          batch.set(doc(collection(firestore, 'users', parentId, 'ledger')), {
            type: 'referral_comm',
            amount: commAmount,
            date: dateStr,
            status: 'completed',
            description: `Network Dividend (L${isL1 ? '1' : '2'}): verified traffic from ${userData.email || userId}`
          });
        }
      }
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: 'System Liquidity Synced',
      credit: rewardAmount 
    });

  } catch (error: any) {
    console.error('Postback Runtime Failure:', error);
    return NextResponse.json({ error: 'Operational Hub Offline' }, { status: 500 });
  }
}
