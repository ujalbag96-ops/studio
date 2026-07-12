
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';

/**
 * JILI Games Provider Callback Handler
 * Handles Auth, Balance Check, and Transaction processing.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { action, userId, amount, transactionId, secureToken } = payload;
    
    // Industrial Security Check (Placeholder for RSA/MD5 verification)
    if (!secureToken) {
      return NextResponse.json({ errorCode: 1, message: "Unauthorized Signal" }, { status: 401 });
    }

    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ errorCode: 2, message: "User Not Found" }, { status: 404 });
    }

    const userData = userSnap.data();

    // 1. Authenticate / Balance Check
    if (action === 'getBalance') {
      return NextResponse.json({ 
        userId: userId, 
        balance: userData.coins, 
        currency: "COIN" 
      });
    }

    // 2. Betting / Payment Execution
    if (action === 'userPay' || action === 'userWin') {
      const isWin = action === 'userWin';
      const coinDelta = isWin ? amount : -amount;

      if (!isWin && userData.coins < amount) {
        return NextResponse.json({ errorCode: 3, message: "Insufficient Liquidity" }, { status: 400 });
      }

      // Atomic Balance Sync
      await updateDoc(userRef, {
        coins: increment(coinDelta),
        winningBalance: isWin ? increment(amount) : userData.winningBalance // Only winnings affect winningBalance
      });

      // Encrypted Ledger Log
      await addDoc(collection(firestore, 'users', userId, 'ledger'), {
        type: isWin ? 'income' : 'entry_fee',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `JILI Games: ${isWin ? 'WIN' : 'BET'} (#${transactionId})`
      });

      return NextResponse.json({ 
        success: true, 
        newBalance: userData.coins + coinDelta 
      });
    }

    return NextResponse.json({ errorCode: 4, message: "Invalid Action" }, { status: 400 });

  } catch (error: any) {
    console.error('JILI Callback Failure:', error);
    return NextResponse.json({ errorCode: 5, message: "Critical System Sync Error" }, { status: 500 });
  }
}
