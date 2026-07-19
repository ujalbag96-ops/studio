
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, increment, collection, addDoc, writeBatch } from 'firebase/firestore';

/**
 * Industrial Daily Check-in Gateway
 * Manages login streaks and milestone rewards.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) return NextResponse.json({ error: 'Missing UID' }, { status: 400 });

    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return NextResponse.json({ error: 'User Not Found' }, { status: 404 });

    const userData = userSnap.data();
    const today = new Date().toISOString().split('T')[0];

    if (userData.lastCheckInDate === today) {
      return NextResponse.json({ error: 'Signal already synced for today' }, { status: 429 });
    }

    const batch = writeBatch(firestore);
    let newStreak = (userData.dailyStreak || 0) + 1;
    
    // Check if streak was broken
    if (userData.lastCheckInDate) {
      const lastDate = new Date(userData.lastCheckInDate);
      const todayDate = new Date(today);
      const diffDays = (todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays > 1) newStreak = 1;
    }

    const reward = newStreak === 7 ? 50 : 2;

    batch.update(userRef, {
      dailyStreak: newStreak,
      lastCheckInDate: today,
      coins: increment(reward),
      bonusBalance: increment(reward)
    });

    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'daily_reward',
      amount: reward,
      date: today,
      status: 'completed',
      description: `Daily Check-in (Day ${newStreak})`
    });

    await batch.commit();

    return NextResponse.json({ success: true, reward, streak: newStreak });

  } catch (error) {
    return NextResponse.json({ error: 'Sync Error' }, { status: 500 });
  }
}
