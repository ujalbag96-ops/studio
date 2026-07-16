
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, writeBatch, increment, collection } from 'firebase/firestore';

/**
 * Industrial Multiplier Betting Engine
 * Handles rolls, jackpot checks, and real-time INR wallet syncing.
 */
export async function POST(request: Request) {
  try {
    const { userId, amountINR, multiplier } = await request.json();

    if (!userId || isNaN(amountINR) || amountINR < 1 || isNaN(multiplier)) {
      return NextResponse.json({ error: 'Invalid Signal: Minimum Bet ₹1 Required' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Identity Missing' }, { status: 404 });
    }

    const userData = userSnap.data();
    if (userData.isSuspended) {
      return NextResponse.json({ error: 'Identity Locked' }, { status: 403 });
    }

    const betAmountCoins = amountINR * 100; // 1 INR = 100 Coins
    if (userData.coins < betAmountCoins) {
      return NextResponse.json({ error: 'Insufficient Liquidity' }, { status: 400 });
    }

    // --- BETTING LOGIC ---
    const roll = Math.floor(Math.random() * 10000); // 0000 to 9999
    const luckyJackpotNumber = 8888;
    
    // Win Chance calculation (95% RTP for platform stability)
    const winChance = Math.floor(9500 / multiplier); 
    const isWin = roll < winChance;
    const isJackpot = roll === luckyJackpotNumber;

    let profitINR = 0;
    if (isJackpot) {
      profitINR = amountINR * 50; // Jackpot pays 50x
    } else if (isWin) {
      profitINR = amountINR * multiplier;
    }

    const profitCoins = profitINR * 100;
    const dateStr = new Date().toISOString().split('T')[0];
    const batch = writeBatch(firestore);

    if (isWin || isJackpot) {
      // Net change for Winning Balance: (Winnings - Bet)
      const netWinINR = profitINR - amountINR;
      const netWinCoins = profitCoins - betAmountCoins;

      batch.update(userRef, {
        winningBalance: increment(netWinCoins), // Store winnings as coins
        coins: increment(netWinCoins),
        walletBalanceINR: increment(netWinINR)
      });

      batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
        type: isJackpot ? 'jackpot' : 'multiplier_win',
        amount: profitINR,
        date: dateStr,
        status: 'completed',
        description: isJackpot ? `JACKPOT HIT! (8888) x50 Payout` : `Multiplier Win: ${multiplier}x [Roll: ${roll}]`
      });
    } else {
      // LOSS
      batch.update(userRef, {
        coins: increment(-betAmountCoins),
        depositBalance: increment(-betAmountCoins), // Deduct from deposit coins
        walletBalanceINR: increment(-amountINR)
      });

      batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
        type: 'multiplier_bet',
        amount: -amountINR,
        date: dateStr,
        status: 'completed',
        description: `Multiplier Loss [Roll: ${roll}]`
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      roll,
      isWin,
      isJackpot,
      profitINR,
      newBalanceINR: (userData.walletBalanceINR || 0) + (isWin || isJackpot ? (profitINR - amountINR) : -amountINR)
    });

  } catch (error) {
    console.error('[BETTING ENGINE FAILURE]', error);
    return NextResponse.json({ error: 'Engine Offline' }, { status: 500 });
  }
}
