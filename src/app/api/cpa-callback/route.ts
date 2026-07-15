
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Defensive MLM CPA Postback Webhook
 * Includes Anti-Fraud Device & IP Validation.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  const rewardAmount = parseFloat(searchParams.get('reward') || '0');
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

    // 1. Credit the Performing User (Worker)
    batch.update(userRef, {
      bonusBalance: increment(rewardAmount),
      coins: increment(rewardAmount),
      tasksCompletedCount: increment(1),
      isAccountActivated: (userData.tasksCompletedCount || 0) + 1 >= 10
    });

    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'income',
      amount: rewardAmount,
      date: dateStr,
      status: 'completed',
      description: `CPA Reward: ${appName} Verified`
    });

    // 2. MLM Anti-Fraud Logic
    // Fetch uplines to distribute commission AND check for device/IP collisions
    const uplineIds = [userData.referredBy, userData.referredByL2].filter(Boolean);

    for (const parentId of uplineIds) {
      if (!parentId) continue;
      const parentRef = doc(firestore, 'users', parentId);
      const parentSnap = await getDoc(parentRef);
      
      if (parentSnap.exists()) {
        const pData = parentSnap.data();
        
        // Anti-Fraud check: Compare Device ID and IP
        const isSameDevice = pData.deviceId === userData.deviceId;
        const isSameIp = pData.lastIp === userData.lastIp;

        if (isSameDevice || isSameIp) {
           // FLAG FOR FRAUD - Do not increment milestone for this task
           await addDoc(collection(firestore, 'fraud_alerts'), {
              referrerId: parentId,
              workerId: userId,
              type: isSameDevice ? 'DEVICE_COLLISION' : 'IP_COLLISION',
              timestamp: new Date().toISOString(),
              details: `Self-referral detected: ${userData.lastIp} | ${userData.deviceId}`
           });

           // Strictly lock milestone progress if extreme fraud pattern
           if (isSameDevice) {
              batch.update(parentRef, { isSuspended: true, status: 'suspended' });
           }
           
           continue; // Skip reward for this specific fraudulent referral link
        }

        // Clean Transaction: Distribute Commission & Milestone
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
      message: 'Atomic MLM distribution and Milestone sync successful.',
      userCredit: rewardAmount
    });

  } catch (error: any) {
    console.error('MLM Postback Critical Failure:', error);
    return NextResponse.json({ error: 'System Synchronization Error' }, { status: 500 });
  }
}
