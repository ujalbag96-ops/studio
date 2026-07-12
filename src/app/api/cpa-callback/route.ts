
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, getDoc } from 'firebase/firestore';

/**
 * CPA Lead / Offerwall Postback Callback
 * This endpoint is called by the CPA network when a user completes an offer.
 * URL parameters: ?uid={userId}&reward={amount}&offer={offerTitle}
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('uid');
  const rewardAmount = parseFloat(searchParams.get('reward') || '0');
  const offerTitle = searchParams.get('offer') || 'Strategic Mission';

  if (!userId || isNaN(rewardAmount) || rewardAmount <= 0) {
    return NextResponse.json({ error: 'Invalid postback parameters' }, { status: 400 });
  }

  try {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Warrior profile not found' }, { status: 404 });
    }

    // Industrial Credit Protocol
    await updateDoc(userRef, {
      bonusBalance: increment(rewardAmount),
      coins: increment(rewardAmount),
      lastTaskUpdate: new Date().toISOString()
    });

    // Log to Ledger
    await addDoc(collection(firestore, 'users', userId, 'ledger'), {
      userId,
      type: 'income',
      amount: rewardAmount,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `CPA Reward: ${offerTitle}`
    });

    return NextResponse.json({ 
      success: true, 
      message: `Credited ${rewardAmount} coins to ${userId}` 
    });

  } catch (error: any) {
    console.error('Postback Sync Failure:', error);
    return NextResponse.json({ error: 'Arena database synchronization failed' }, { status: 500 });
  }
}
