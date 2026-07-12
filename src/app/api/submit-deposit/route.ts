
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  increment, 
  addDoc, 
  limit,
  writeBatch
} from 'firebase/firestore';

/**
 * UTR Matching Engine API
 * Validates user-submitted UTR against Telegram logs.
 */
export async function POST(request: Request) {
  try {
    const { userId, utrId, amount, userEmail } = await request.json();

    if (!userId || !utrId || !amount) {
      return NextResponse.json({ error: 'Missing Identity or Signal data' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    
    // 1. Check for matching payment signal in Telegram Logs
    const signalsRef = collection(firestore, 'payment_signals');
    const q = query(
      signalsRef, 
      where('utrId', '==', utrId), 
      where('amount', '==', parseFloat(amount)),
      where('isUsed', '==', false),
      limit(1)
    );

    const signalSnap = await getDocs(q);
    const isMatchFound = !signalSnap.empty;

    const batch = writeBatch(firestore);
    const userRef = doc(firestore, 'users', userId);
    const ledgerRef = doc(collection(firestore, 'users', userId, 'ledger'));
    
    const coinAmount = parseFloat(amount) * 10; // 1 INR = 10 Coins logic

    if (isMatchFound) {
      const signalDoc = signalSnap.docs[0];
      
      // Industrial Atomic Update: Match Found
      batch.update(userRef, {
        depositBalance: increment(coinAmount),
        coins: increment(coinAmount)
      });

      batch.set(ledgerRef, {
        type: 'deposit',
        amount: coinAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Auto-Verified UTR: ${utrId}`,
        utrId: utrId,
        isAutoVerified: true
      });

      // Burn the signal to prevent double claims
      batch.update(signalDoc.ref, { isUsed: true, usedBy: userId });

      await batch.commit();

      return NextResponse.json({ 
        success: true, 
        message: 'Transaction auto-verified and credited.', 
        autoVerified: true 
      });
    } else {
      // Logic: No match found, log as pending for manual review
      await addDoc(ledgerRef.parent, {
        type: 'deposit',
        amount: coinAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        description: `Manual Verification Required [UTR: ${utrId}]`,
        utrId: utrId,
        isAutoVerified: false
      });

      // Also log in a global verifications collection for admin easier access
      await addDoc(collection(firestore, 'pending_verifications'), {
        userId,
        userEmail,
        utrId,
        amount: parseFloat(amount),
        status: 'pending',
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ 
        success: true, 
        message: 'UTR submitted. Awaiting signal match or manual audit.', 
        autoVerified: false 
      });
    }

  } catch (error) {
    console.error('[UTR ENGINE FAILURE]', error);
    return NextResponse.json({ error: 'Verification Engine Offline' }, { status: 500 });
  }
}
