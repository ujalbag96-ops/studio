
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, writeBatch, getDoc } from 'firebase/firestore';
import { localizeNotification } from '@/ai/flows/localize-notification-flow';

/**
 * Automated Weather Prediction Payout Logic with AI Localization
 * Matches user votes against official condition and rewards winners with localized alerts.
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
      const userSnap = await getDoc(userRef);

      if (voteData.vote === winningVote) {
        // REWARD: 10 Bonus Coins for correct prediction
        batch.update(userRef, {
          bonusBalance: increment(10),
          coins: increment(10)
        });

        // 3. AI Localization Pipeline
        const userData = userSnap.data() || {};
        const baseMessage = `Correct prediction! You earned 10 Bonus Coins for "${winningVote}" on ${today}.`;
        
        let localizedBody = baseMessage;
        try {
           // Fetch local dialect from Genkit
           const aiResult = await localizeNotification({
              message: baseMessage,
              city: userData.city || 'Sambalpur',
              region: userData.region || 'Odisha',
              country: userData.country || 'India'
           });
           localizedBody = aiResult.localizedMessage;
        } catch (e) {
           console.error("AI Localization Failed, falling back to English.");
        }

        // NOTIFICATION with Regional Dialect
        const notifRef = doc(collection(firestore, 'notifications'));
        batch.set(notifRef, {
          userId: voteData.userId,
          title: '🌧️ WEATHER WIN!',
          body: baseMessage,
          localizedBody: localizedBody,
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
