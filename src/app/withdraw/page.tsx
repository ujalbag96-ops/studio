
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowLeft, Loader2, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrencyData } from '@/lib/currency';

export default function WithdrawPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [amountLocal, setAmountLocal] = useState('');
  const [method, setMethod] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const currencyData = getCurrencyData(profile?.country);
  const localValue = parseFloat(amountLocal) || 0;
  const coinsRequired = localValue * currencyData.rateToCoins;

  const handleWithdraw = async () => {
    if (!user || !firestore || !profile || !userRef) return;
    
    if (coinsRequired > (profile.winningBalance || 0)) {
      setError("Insufficient winning assets in wallet.");
      return;
    }

    if (localValue < 10) {
      setError(`Minimum threshold: ${currencyData.symbol}10 required.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const timestamp = new Date().toISOString();

      // Payout Dispatcher
      await addDoc(collection(firestore, 'payouts'), {
        userId: user.uid,
        userEmail: user.email,
        amount: localValue,
        method: method,
        destination: destinationId,
        status: 'pending',
        timestamp: timestamp
      });

      // Atomic Balance Lock
      await updateDoc(userRef, {
        winningBalance: increment(-coinsRequired),
        coins: increment(-coinsRequired)
      });

      // Ledger Receipt
      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'withdrawal',
        amount: localValue,
        date: timestamp.split('T')[0],
        status: 'pending',
        description: `Industrial Payout via ${method} to ${destinationId}`
      });

      toast({ title: "PAYOUT DISPATCHED", description: "Request queued for executive review." });
      router.push('/dashboard');
    } catch (err: any) {
      setError("System synchronization failure. Protocol halted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="flex items-center gap-6 pt-10">
        <Button variant="ghost" asChild className="h-12 w-12 rounded-xl p-0 hover:bg-white/5 border border-white/5">
          <Link href="/dashboard"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Withdraw <span className="text-primary">Terminal</span></h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        <Card className="bg-[#0a0a0f] border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="bg-primary/10 p-10 border-b border-white/5 text-center">
             <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 italic">Available Liquid Assets</p>
             <h2 className="text-6xl font-black text-white italic">{profile?.winningBalance?.toFixed(0) || 0} <span className="text-2xl opacity-30">🪙</span></h2>
             <p className="text-sm text-muted-foreground font-black uppercase mt-3">≈ {currencyData.symbol}{( (profile?.winningBalance || 0) / currencyData.rateToCoins ).toFixed(2)}</p>
          </div>

          <CardContent className="p-10 space-y-8">
            {error && <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 rounded-xl"><AlertCircle className="h-4 w-4" /><AlertDescription className="font-bold">{error}</AlertDescription></Alert>}
            
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Network Gateway</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-16 bg-white/5 border-white/10 rounded-xl font-black text-xs uppercase">
                  <SelectValue placeholder="Select Protocol" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0f] border-white/10">
                  <SelectItem value="UPI">UPI Industrial</SelectItem>
                  <SelectItem value="Paytm">Paytm Terminal</SelectItem>
                  <SelectItem value="Binance">Binance Pay (USDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Transfer Amount ({currencyData.symbol})</Label>
              <Input type="number" value={amountLocal} onChange={e => setAmountLocal(e.target.value)} placeholder="Min 10" className="h-16 bg-white/5 border-white/10 rounded-xl text-2xl font-black text-primary" />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Account ID / Wallet Address</Label>
              <Input value={destinationId} onChange={e => setDestinationId(e.target.value)} placeholder="e.g. warrior@upi" className="h-16 bg-white/5 border-white/10 rounded-xl font-mono text-xs" />
            </div>

            <Button onClick={handleWithdraw} disabled={isSubmitting || !amountLocal || !destinationId} className="w-full h-20 bg-primary font-black uppercase italic text-xl rounded-2xl shadow-xl">
               {isSubmitting ? <Loader2 className="animate-spin h-8 w-8" /> : "EXECUTE WITHDRAWAL"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 border-2 rounded-[2.5rem] p-10 space-y-8 flex flex-col justify-center">
           <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-2xl animate-pulse"><ShieldCheck className="text-primary h-10 w-10" /></div>
           <h3 className="text-3xl font-black uppercase italic tracking-tighter">Security Protocol</h3>
           <ul className="space-y-6 text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">
              <li className="flex gap-4"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Processing: 2-24 Hours Industrial SLA</li>
              <li className="flex gap-4"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Minimum: ₹10 (Local Market Equivalent)</li>
              <li className="flex gap-4"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Source: Verified Winnings Only</li>
              <li className="flex gap-4"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Audit: Multiple accounts blocked automatically</li>
           </ul>
        </Card>
      </div>
    </div>
  );
}
