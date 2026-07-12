
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowLeft, Loader2, AlertCircle, CreditCard, IndianRupee, Percent, Coins, Trophy, ShieldCheck, Globe, Zap } from 'lucide-react';
import { AppSettings, UserProfile } from '@/app/lib/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  const feeAmount = localValue * feeRate;
  const payoutAmount = localValue - feeAmount;

  const availableWinningBal = profile?.winningBalance || 0;
  const minWithdrawLocal = 110 / 10; 

  const handleWithdraw = async () => {
    if (!user || !firestore || !profile || !userRef) return;
    
    if (profile.isBanned) {
       setError("SECURITY LOCK: Access blacklisted.");
       return;
    }

    if (isNaN(localValue) || localValue < minWithdrawLocal) {
      setError(`Minimum withdrawal required: ${currencyData.symbol}${minWithdrawLocal.toFixed(2)}.`);
      return;
    }

    if (coinsRequired > availableWinningBal) {
      setError(`Insufficient winning balance.`);
      return;
    }

    if (!method || !destinationId.trim()) {
      setError("Provide gateway and destination details.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const status = 'pending';
      const timestamp = new Date().toISOString();

      // Log in User's Ledger
      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        userId: user.uid,
        type: 'withdrawal',
        amount: localValue,
        currencySymbol: currencyData.symbol,
        date: timestamp.split('T')[0],
        status: status,
        description: `Withdrawal via ${method}: ${destinationId} (Net: ${currencyData.symbol}${payoutAmount.toFixed(2)})`
      });

      // Log in Global Withdrawals Queue for Admin
      await addDoc(collection(firestore, 'withdrawals'), {
        userId: user.uid,
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

      toast({
        title: "REQUEST QUEUED",
        description: "Admin will verify and process your payout within 2-12 hours.",
      });

      router.push('/ledger');
    } catch (err: any) {
      setError("Arena sync failed. Protocol disconnected.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  const gateways = profile?.country === 'India' 
    ? ['UPI', 'Paytm', 'PhonePe'] 
    : ['PayPal', 'Binance Pay', 'Skrill'];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="flex items-center gap-8">
        <Button variant="outline" size="icon" asChild className="rounded-2xl border-white/5 bg-white/5 h-14 w-14">
          <Link href="/ledger"><ArrowLeft className="h-6 w-6" /></Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none">Withdraw <span className="text-primary">Winnings</span></h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] italic">Secure Payout Sector • {profile?.country || 'Global'} Region</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Card className="bg-[#0a0a0f] border-white/5 shadow-2xl overflow-hidden rounded-[3rem]">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-12 border-b border-white/5 flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                  <Trophy className="h-4 w-4" /> Available for Payout
                </p>
                <h2 className="text-6xl font-black text-white tracking-tighter flex items-baseline gap-4">
                  {Math.floor(availableWinningBal).toLocaleString()} <span className="text-2xl font-black opacity-30">🪙</span>
                </h2>
                <p className="text-lg text-muted-foreground font-black uppercase italic tracking-widest">≈ {currencyData.symbol}{(availableWinningBal / currencyData.rateToCoins).toFixed(2)}</p>
              </div>
            </div>

            <CardContent className="p-12 space-y-10">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-2xl">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="font-bold uppercase text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Payment Method</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="bg-white/5 border-white/5 h-16 rounded-2xl font-black uppercase text-xs">
                        <SelectValue placeholder="Select Gateway" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121216] border-white/10 text-white">
                        {gateways.map((g) => (
                          <SelectItem key={g} value={g} className="font-black uppercase text-[10px] py-3">{g} NETWORK</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Account / UPI ID</Label>
                    <Input 
                      value={destinationId} 
                      onChange={(e) => setDestinationId(e.target.value)} 
                      placeholder="e.g. name@upi" 
                      className="bg-white/5 border-white/5 h-16 rounded-2xl font-black uppercase text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Amount ({currencyData.symbol})</Label>
                    <Input 
                      type="number" 
                      value={amountLocal} 
                      onChange={(e) => setAmountLocal(e.target.value)} 
                      placeholder={`Min ${minWithdrawLocal}`} 
                      className="bg-white/5 border-white/5 h-16 rounded-2xl text-4xl font-black text-primary tabular-nums"
                    />
                  </div>

                  {localValue >= minWithdrawLocal && (
                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-muted-foreground">Fee ({(feeRate * 100).toFixed(0)}%)</span>
                        <span className="text-red-400">-{currencyData.symbol}{feeAmount.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-white italic">You Receive</span>
                        <span className="text-3xl font-black text-green-500 tabular-nums">{currencyData.symbol}{payoutAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-12 pt-0">
              <Button 
                onClick={handleWithdraw} 
                disabled={isSubmitting || !amountLocal || !destinationId || !method || localValue < minWithdrawLocal} 
                className="w-full bg-primary h-20 rounded-2xl font-black uppercase italic text-xl shadow-xl"
              >
                {isSubmitting ? <Loader2 className="h-8 w-8 animate-spin" /> : "Request Payout"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
