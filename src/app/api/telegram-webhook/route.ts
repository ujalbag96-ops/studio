
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Industrial Telegram Webhook for UTR Extraction
 * Parses incoming messages from a Telegram bot to log payment signals.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body?.message?.text || "";

    if (!text) return NextResponse.json({ ok: true });

    // Industrial Regex for 12-digit UTR/Txn ID
    const utrRegex = /\b\d{12}\b/;
    // Regex for amount with currency symbols (₹, INR, Rs.)
    const amountRegex = /(?:INR|Rs\.?|₹)\s?(\d+(?:\.\d{2})?)/i;

    const utrMatch = text.match(utrRegex);
    const amountMatch = text.match(amountRegex);

    if (utrMatch) {
      const { firestore } = initializeFirebase();
      const utrId = utrMatch[0];
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      // Log the payment signal for the Matching Engine
      await addDoc(collection(firestore, 'payment_signals'), {
        utrId,
        amount,
        rawText: text,
        timestamp: serverTimestamp(),
        isUsed: false
      });

      console.log(`[UTR SYSTEM] Signal Captured: ${utrId} | Amount: ${amount}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[UTR ERROR]', error);
    return NextResponse.json({ error: 'Signal Processing Failed' }, { status: 500 });
  }
}
