
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowLeft, Loader2, AlertCircle, Trophy, ShieldCheck } from 'lucide-react';
import { AppSettings, UserProfile } from '@/app/lib/types';
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

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);

  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const currencyData = getCurrencyData(profile?.country);
  const localValue = parseFloat(amountLocal) || 0;
  const coinsRequired = localValue * currencyData.rateToCoins;
  
  const feeRate = settings?.withdrawalFeePercent ? (settings.withdrawalFeePercent / 100) : 0.08; 
  const payoutAmount = localValue * (1 - feeRate);

  const handleWithdraw = async () => {
    if (!user || !firestore || !profile || !userRef) return;
    
    if (coinsRequired > (profile.winningBalance || 0)) {
      setError("Insufficient winning balance assets.");
      return;
    }

    if (localValue < 10) {
      setError(`Minimum withdrawal is ${currencyData.symbol}10.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const timestamp = new Date().toISOString();

      // Industrial Batch-Write Simulation
      await addDoc(collection(firestore, 'withdrawals'), {
        userId: user.uid,
        userEmail: user.email,
        amount: localValue,
        method: method,
        destination: destinationId,
        status: 'pending',
        timestamp: timestamp
      });

      await updateDoc(userRef, {
        winningBalance: increment(-coinsRequired),
        coins: increment(-coinsRequired)
      });

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'withdrawal',
        amount: localValue,
        date: timestamp.split('T')[0],
        status: 'pending',
        description: `Withdrawal via ${method} to ${destinationId}`
      });

      toast({ title: "REQUEST QUEUED", description: "Admin will verify and process your payout shortly." });
      router.push('/dashboard');
    } catch (err: any) {
      setError("System sync failed. Protocol interrupted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="flex items-center gap-6">
        <Button variant="ghost" asChild className="h-12 w-12 rounded-xl p-0 hover:bg-white/5">
          <Link href="/dashboard"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Withdraw <span className="text-primary">Winnings</span></h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        <Card className="bg-[#0a0a0f] border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="bg-primary/10 p-8 border-b border-white/5">
             <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Available for Payout</p>
             <h2 className="text-5xl font-black text-white italic">{profile?.winningBalance?.toFixed(0) || 0} <span className="text-xl opacity-30">🪙</span></h2>
             <p className="text-sm text-muted-foreground font-bold uppercase mt-2">≈ {currencyData.symbol}{( (profile?.winningBalance || 0) / currencyData.rateToCoins ).toFixed(2)}</p>
          </div>

          <CardContent className="p-8 space-y-6">
            {error && <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 rounded-xl"><AlertCircle className="h-4 w-4" /><AlertDescription className="font-bold">{error}</AlertDescription></Alert>}
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Select Gateway</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-xl font-bold">
                  <SelectValue placeholder="Gateway Network" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0f] border-white/10">
                  <SelectItem value="UPI">UPI Network</SelectItem>
                  <SelectItem value="Paytm">Paytm Wallet</SelectItem>
                  <SelectItem value="Binance">Binance Pay (USDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Amount ({currencyData.symbol})</Label>
              <Input type="number" value={amountLocal} onChange={e => setAmountLocal(e.target.value)} placeholder="Min 10" className="h-14 bg-white/5 border-white/10 rounded-xl text-xl font-black text-primary" />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Account ID / Address</Label>
              <Input value={destinationId} onChange={e => setDestinationId(e.target.value)} placeholder="e.g. name@upi" className="h-14 bg-white/5 border-white/10 rounded-xl" />
            </div>

            {localValue > 0 && (
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                 <span className="text-[10px] font-black uppercase text-muted-foreground">You Receive</span>
                 <span className="text-2xl font-black text-green-500 italic">{currencyData.symbol}{payoutAmount.toFixed(2)}</span>
              </div>
            )}

            <Button onClick={handleWithdraw} disabled={isSubmitting || !amountLocal || !destinationId} className="w-full h-16 bg-primary font-black uppercase italic text-lg rounded-2xl shadow-xl">
               {isSubmitting ? <Loader2 className="animate-spin" /> : "INITIATE PAYOUT"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 border-2 rounded-[2.5rem] p-8 space-y-6">
           <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20"><ShieldCheck className="text-primary h-8 w-8" /></div>
           <h3 className="text-2xl font-black uppercase italic">Withdrawal Protocol</h3>
           <ul className="space-y-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              <li className="flex gap-3"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> Processing: 2-24 Hours</li>
              <li className="flex gap-3"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> Minimum: ₹10 (Local Eqv)</li>
              <li className="flex gap-3"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> Fees: {globalSettings?.withdrawalFeePercent || 8}% Operational Fee</li>
              <li className="flex gap-3"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> Source: Winnings Only</li>
           </ul>
        </Card>
      </div>
    </div>
  );
}
