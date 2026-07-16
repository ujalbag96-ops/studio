
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Reading Time Reward Gateway
 * Credits 2 coins for every 15 minutes of verified reading.
 */
export async function POST(request: Request) {
  try {
    const { userId, type } = await request.json();

    if (!userId || !['reading', 'quiz'].includes(type)) {
      return NextResponse.json({ error: 'Invalid Signal' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Identity Missing' }, { status: 404 });
    }

    const reward = type === 'reading' ? 2 : 5;
    const description = type === 'reading' 
      ? 'Reading Milestone: 15 Mins (+2 🪙)' 
      : 'Knowledge Quiz: Perfect Score (+5 🪙)';

    batch.update(userRef, {
      taskBalance: increment(reward),
      coins: increment(reward),
      weeklyPointsEarned: increment(reward)
    });

    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: type === 'reading' ? 'reading_reward' : 'quiz_reward',
      amount: reward,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description,
      isPostbackVerified: true
    });

    await batch.commit();

    return NextResponse.json({ success: true, reward });

  } catch (error) {
    return NextResponse.json({ error: 'Sync Error' }, { status: 500 });
  }
}
