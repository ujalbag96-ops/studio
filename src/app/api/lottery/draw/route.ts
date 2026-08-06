export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, writeBatch } from 'firebase/firestore';

/**
 * Industrial Jackpot Draw Engine (Mock Cloud Function)
 * Runs at midnight to settle the daily lottery pool.
 */
export async function POST(request: Request) {
  try {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    // 1. Generate Winning Signal (1-10)
    const winningNumber = Math.floor(Math.random() * 10) + 1;
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0];

    // 2. Fetch Active Signal Entries
    const entriesRef = collection(firestore, 'lottery_entries');
    const q = query(entriesRef, where('status', '==', 'active'));
    const entrySnap = await getDocs(q);

    // 3. Fetch Pool Configuration
    const poolRef = doc(firestore, 'daily_pool', 'config');
    const poolSnap = await getDocs(query(collection(firestore, 'daily_pool'), where('id', '==', 'config'))); // Simplification
    // Note: in production use a better getDoc pattern
    
    // Total Pool Calculation: ₹(participants * 10 * 0.8)
    const participants = entrySnap.size;
    const totalPrize = participants * 10 * 0.8;

    const winners: any[] = [];
    entrySnap.forEach(doc => {
      const data = doc.data();
      if (data.selectedNumber === winningNumber) {
        winners.push({ id: doc.id, userId: data.userId, email: data.userEmail });
      }
    });

    if (winners.length > 0) {
      // 4. REAL WINNER DISTRIBUTION
      const splitPrize = totalPrize / winners.length;

      for (const winner of winners) {
        const userRef = doc(firestore, 'users', winner.userId);
        
        // Update user balances
        batch.update(userRef, {
          winningBalance: increment(splitPrize * 100), // Payout in coins
          coins: increment(splitPrize * 100),
          walletBalanceINR: increment(splitPrize)
        });

        // Ledger Entry
        batch.set(doc(collection(firestore, 'users', winner.userId, 'ledger')), {
          type: 'prediction_win',
          amount: splitPrize,
          date: dateStr,
          status: 'completed',
          description: `Daily Lottery Jackpot! Winning Number: ${winningNumber}`
        });
      }
    } else {
      // 5. BOT WINNER PROTOCOL (If no real winners)
      const bots = ["AlphaBot", "Zenith_9", "ProGamer_X", "LuckyBot"];
      const randomBot = bots[Math.floor(Math.random() * bots.length)];
      winners.push({ type: 'bot', name: randomBot, amount: totalPrize });
    }

    // 6. LOG RESULTS
    const resultRef = doc(collection(firestore, 'lottery_results'));
    batch.set(resultRef, {
      winningNumber,
      winners,
      poolAmount: totalPrize,
      timestamp,
      participants
    });

    // 7. RESET FOR NEXT CYCLE
    entrySnap.forEach(d => {
      batch.update(d.ref, { status: 'settled', winningNumber });
    });

    batch.update(poolRef, { total_participants: 0 });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      winningNumber, 
      winnersCount: winners.length, 
      prizeDistributed: totalPrize 
    });

  } catch (error) {
    console.error('[LOTTERY ENGINE FAILURE]', error);
    return NextResponse.json({ error: 'Jackpot Synchronizer Offline' }, { status: 500 });
  }
}