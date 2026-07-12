
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, getDoc } from 'firebase/firestore';

/**
 * CPA Postback Webhook
 * Called by Offerwalls when a user completes a task.
 * Params: ?uid={userId}&reward={amount}&offer={appName}
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  const rewardAmount = parseFloat(searchParams.get('reward') || '0');
  const appName = searchParams.get('offer') || 'Mobile Mission';

  if (!userId || isNaN(rewardAmount) || rewardAmount <= 0) {
    return NextResponse.json({ error: 'Invalid Operational Signal' }, { status: 400 });
  }

  try {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Warrior Profile Missing' }, { status: 404 });
    }

    // Industrial Atomic Update
    await updateDoc(userRef, {
      bonusBalance: increment(rewardAmount),
      coins: increment(rewardAmount),
      tasksCompletedCount: increment(1),
      isAccountActivated: (userSnap.data().tasksCompletedCount + 1) >= 10
    });

    // Encrypted Ledger Entry
    await addDoc(collection(firestore, 'users', userId, 'ledger'), {
      type: 'income',
      amount: rewardAmount,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `CPA Reward: ${appName} Verified`
    });

    return NextResponse.json({ success: true, message: `Credited ${rewardAmount} to ${userId}` });

  } catch (error: any) {
    console.error('Industrial Postback Failure:', error);
    return NextResponse.json({ error: 'System Synchronization Error' }, { status: 500 });
  }
}
