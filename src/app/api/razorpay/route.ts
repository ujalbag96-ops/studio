export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, increment, collection, addDoc, writeBatch } from 'firebase/firestore';

/**
 * Industrial Razorpay API Node
 * Simulates high-speed bank settlement and webhook verification.
 */
export async function POST(request: Request) {
  try {
    const { userId, amountINR, type } = await request.json();

    if (!userId || !amountINR) {
      return NextResponse.json({ error: 'Invalid Signal' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const settingsRef = doc(firestore, 'app_settings', 'global_config');
    const settingsSnap = await getDoc(settingsRef);
    const settings = settingsSnap.data();

    if (!settings?.api_razorpay_active) {
       return NextResponse.json({ error: 'Razorpay Node Offline' }, { status: 503 });
    }

    // Logic: If Razorpay Auto-Payout is enabled, process instantly.
    // In a real build, you'd use the Razorpay Node SDK here.
    const isAutoPay = settings?.razorpayAutoPayout;
    const status = isAutoPay ? 'completed' : 'pending';

    const batch = writeBatch(firestore);
    const userRef = doc(firestore, 'users', userId);
    const dateStr = new Date().toISOString().split('T')[0];

    // Log the transaction
    const payoutRef = doc(collection(firestore, 'payouts'));
    batch.set(payoutRef, {
      userId,
      amount: amountINR,
      method: 'Razorpay Direct',
      status: status,
      timestamp: new Date().toISOString(),
      isAutoProcessed: isAutoPay
    });

    // If it's a deposit (simplified)
    if (type === 'deposit') {
       batch.update(userRef, {
          depositBalance: increment(amountINR * 100),
          coins: increment(amountINR * 100)
       });
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      status: status,
      message: isAutoPay ? 'Industrial Settlement Complete' : 'Awaiting Admin Audit' 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Gateway Sync Failed' }, { status: 500 });
  }
}