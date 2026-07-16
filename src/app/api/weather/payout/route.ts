
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, writeBatch } from 'firebase/firestore';

/**
 * Automated Weather Prediction Payout Logic
 * Matches user votes against official condition and rewards winners.
 */
export async function POST() {
  try {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch Official Condition
    const logsRef = collection(firestore, 'weather_logs');
    const logQ = query(logsRef, where('date', '==', today));
    const logSnap = await getDocs(logQ);

    if (logSnap.empty) {
      return NextResponse.json({ error: 'No official weather log found for today.' }, { status: 404 });
    }

    const officialData = logSnap.docs[0].data();
    const isRainy = officialData.condition.toLowerCase().includes('rain') || officialData.condition.toLowerCase().includes('storm');
    const winningVote = isRainy ? 'YES' : 'NO';

    // 2. Fetch User Votes
    const votesRef = collection(firestore, 'weather_votes');
    const votesQ = query(votesRef, where('status', '==', 'pending'));
    const votesSnap = await getDocs(votesQ);

    let winnerCount = 0;

    for (const voteDoc of votesSnap.docs) {
      const voteData = voteDoc.data();
      const userRef = doc(firestore, 'users', voteData.userId);

      if (voteData.vote === winningVote) {
        // REWARD: 10 Bonus Coins for correct prediction
        batch.update(userRef, {
          bonusBalance: increment(10),
          coins: increment(10)
        });

        // NOTIFICATION
        batch.set(doc(collection(firestore, 'notifications')), {
          userId: voteData.userId,
          title: '🌧️ WEATHER WIN!',
          body: `Correct prediction! You earned 10 Bonus Coins for "${winningVote}" on ${today}.`,
          timestamp: new Date().toISOString(),
          type: 'payout'
        });

        winnerCount++;
      }

      // Mark vote as settled
      batch.update(voteDoc.ref, { status: 'settled', result: winningVote === voteData.vote ? 'win' : 'loss' });
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      settledCount: votesSnap.size, 
      winners: winnerCount,
      officialResult: winningVote
    });

  } catch (error) {
    console.error('Weather Payout Failure:', error);
    return NextResponse.json({ error: 'Payout Engine Malfunction' }, { status: 500 });
  }
}
