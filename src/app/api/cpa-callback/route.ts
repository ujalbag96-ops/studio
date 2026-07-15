
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Industrial MLM CPA Postback Webhook
 * 30% Commission Distribution Logic: L1 (20%) and L2 (10%)
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

    // 2. MLM Commission Logic (30% Total Split: 20% L1, 10% L2)
    const commL1 = rewardAmount * 0.20;
    const commL2 = rewardAmount * 0.10;

    // Distribute to L1 (Direct Parent)
    if (userData.referredBy) {
      const l1Ref = doc(firestore, 'users', userData.referredBy);
      batch.update(l1Ref, {
        referralCommissionBalance: increment(commL1),
        coins: increment(commL1)
      });
      batch.set(doc(collection(firestore, 'users', userData.referredBy, 'ledger')), {
        type: 'referral_comm',
        amount: commL1,
        date: dateStr,
        status: 'completed',
        description: `MLM L1 Bonus: ${userData.email || userData.id} completed ${appName}`
      });
    }

    // Distribute to L2 (Grandparent)
    if (userData.referredByL2) {
      const l2Ref = doc(firestore, 'users', userData.referredByL2);
      batch.update(l2Ref, {
        referralCommissionBalance: increment(commL2),
        coins: increment(commL2)
      });
      batch.set(doc(collection(firestore, 'users', userData.referredByL2, 'ledger')), {
        type: 'referral_comm',
        amount: commL2,
        date: dateStr,
        status: 'completed',
        description: `MLM L2 Bonus: Downline activity detected (${appName})`
      });
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: 'Atomic MLM distribution successful.',
      userCredit: rewardAmount,
      l1Comm: commL1,
      l2Comm: commL2
    });

  } catch (error: any) {
    console.error('MLM Postback Critical Failure:', error);
    return NextResponse.json({ error: 'System Synchronization Error' }, { status: 500 });
  }
}
