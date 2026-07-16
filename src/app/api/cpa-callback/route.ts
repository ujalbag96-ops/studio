
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Defensive MLM CPA Postback Webhook
 * Includes Anti-Fraud Device & IP Validation + VIP Bonus Logic.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  let rewardAmount = parseFloat(searchParams.get('reward') || '0');
  const appName = searchParams.get('offer') || 'Premium Mission';

  if (!userId || isNaN(rewardAmount) || rewardAmount <= 0) {
    return NextResponse.json({ error: 'Invalid Operational Signal' }, { status: 400 });
  }

  try {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Warrior Profile Missing' }, { status: 404 });
    }

    const userData = userSnap.data();
    if (userData.isSuspended) {
       return NextResponse.json({ error: 'Identity Locked: Account Suspended' }, { status: 403 });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const currentTasks = (userData.tasksCompletedCount || 0) + 1;

    // 1. VIP 1 Logic: 5% Bonus and Auto-Upgrade
    let vipBonus = 0;
    let newVipLevel = userData.vipLevel || 'VIP 0';

    if (newVipLevel === 'VIP 0' && currentTasks >= 10) {
       newVipLevel = 'VIP 1';
       // Initial VIP 1 Notification
       await addDoc(collection(firestore, 'notifications'), {
          userId: userId,
          title: '🔥 VIP 1 ACTIVATED',
          body: 'Congratulations! You have completed 10 tasks. You are now VIP 1 and will earn +5% bonus on all future tasks!',
          timestamp: new Date().toISOString(),
          type: 'mission'
       });
    }

    if (newVipLevel === 'VIP 1') {
       vipBonus = rewardAmount * 0.05;
       rewardAmount += vipBonus;
    }

    // 2. Credit the Performing User (Worker)
    batch.update(userRef, {
      bonusBalance: increment(rewardAmount),
      coins: increment(rewardAmount),
      tasksCompletedCount: increment(1),
      vipLevel: newVipLevel,
      vipBonusEarned: increment(vipBonus),
      isAccountActivated: currentTasks >= 10 || userData.isAccountActivated
    });

    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'income',
      amount: rewardAmount,
      date: dateStr,
      status: 'completed',
      description: `CPA Reward: ${appName} Verified ${vipBonus > 0 ? '(Includes 5% VIP 1 Bonus)' : ''}`
    });

    // 3. MLM Anti-Fraud Logic
    const uplineIds = [userData.referredBy, userData.referredByL2].filter(Boolean);

    for (const parentId of uplineIds) {
      if (!parentId) continue;
      const parentRef = doc(firestore, 'users', parentId);
      const parentSnap = await getDoc(parentRef);
      
      if (parentSnap.exists()) {
        const pData = parentSnap.data();
        const isSameDevice = pData.deviceId === userData.deviceId;
        const isSameIp = pData.lastIp === userData.lastIp;

        if (isSameDevice || isSameIp) {
           await addDoc(collection(firestore, 'fraud_alerts'), {
              referrerId: parentId,
              workerId: userId,
              type: isSameDevice ? 'DEVICE_COLLISION' : 'IP_COLLISION',
              timestamp: new Date().toISOString(),
              details: `Self-referral detected: ${userData.lastIp} | ${userData.deviceId}`
           });

           if (isSameDevice) {
              batch.update(parentRef, { isSuspended: true, status: 'suspended' });
           }
           continue; 
        }

        const isL1 = parentId === userData.referredBy;
        const commRate = isL1 ? 0.20 : 0.10;
        const commAmount = rewardAmount * commRate;

        batch.update(parentRef, {
          referralCommissionBalance: increment(commAmount),
          coins: increment(commAmount),
          networkTaskCompletions: increment(1),
          totalNetworkRevenue: increment(rewardAmount)
        });

        batch.set(doc(collection(firestore, 'users', parentId, 'ledger')), {
          type: 'referral_comm',
          amount: commAmount,
          date: dateStr,
          status: 'completed',
          description: `MLM ${isL1 ? 'L1' : 'L2'} Bonus: Real User activity detected`
        });
      }
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Sync successful. ${newVipLevel === 'VIP 1' ? 'VIP 1 Active.' : ''}`,
      userCredit: rewardAmount
    });

  } catch (error: any) {
    console.error('MLM Postback Critical Failure:', error);
    return NextResponse.json({ error: 'System Synchronization Error' }, { status: 500 });
  }
}
