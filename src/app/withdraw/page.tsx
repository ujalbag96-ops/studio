
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
       setError("SECURITY LOCK: Access to the vault is blacklisted for this device signature.");
       return;
    }

    if (isNaN(localValue) || localValue < minWithdrawLocal) {
      setError(`Minimum withdrawal protocol requires ${currencyData.symbol}${minWithdrawLocal.toFixed(2)}.`);
      return;
    }

    if (coinsRequired > availableWinningBal) {
      setError(`Insufficient Intel Funds. Max withdrawal: ${currencyData.symbol}${(availableWinningBal / currencyData.rateToCoins).toFixed(2)}.`);
      return;
    }

    if (!method || !destinationId.trim()) {
      setError("Provide gateway and tactical destination.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');
      
      // Smart Processor: Auto-approve < ₹200 (20 coins roughly)
      const isSmallAmount = localValue < 20; 
      const isSuspect = (profile.tasksCompletedToday || 0) > 10 || !!profile.isVpnActive;
      
      const status = (isSmallAmount && !isSuspect) ? 'completed' : 'pending';

      await addDoc(ledgerRef, {
        userId: user.uid,
        type: 'withdrawal',
        amount: localValue,
        currencySymbol: currencyData.symbol,
        date: new Date().toISOString().split('T')[0],
        status: status,
        isFlagged: isSuspect,
        description: `Withdrawal via ${method}: ${destinationId} (Net: ${currencyData.symbol}${payoutAmount.toFixed(2)})`
      });

      await updateDoc(userRef, {
        winningBalance: increment(-coinsRequired),
        coins: increment(-coinsRequired)
      });

      toast({
        title: status === 'completed' ? "Protocol Auto-Approved" : "Request Queued",
        description: status === 'completed' ? "Winnings transferred instantly." : "High-volume detected. Admin will verify signal.",
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
    : ['PayPal', 'Binance Pay', 'Skrill', 'TransferWise'];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="flex items-center gap-8">
        <Button variant="outline" size="icon" asChild className="rounded-2xl border-white/5 bg-white/5 h-14 w-14">
          <Link href="/ledger"><ArrowLeft className="h-6 w-6" /></Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none">Tactical <span className="text-primary">Vault</span></h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] italic">Secure Withdrawal Sector • {profile?.country || 'Global'} Region</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Card className="bg-[#0a0a0f] border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.4)] overflow-hidden rounded-[3rem]">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-12 border-b border-white/5 flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                  <Trophy className="h-4 w-4" /> Withdrawable Intel
                </p>
                <h2 className="text-6xl font-black text-white tracking-tighter flex items-baseline gap-4">
                  {Math.floor(availableWinningBal).toLocaleString()} <span className="text-2xl font-black opacity-30">🪙</span>
                </h2>
                <p className="text-lg text-muted-foreground font-black uppercase italic tracking-widest">≈ {currencyData.symbol}{(availableWinningBal / currencyData.rateToCoins).toFixed(2)}</p>
              </div>
              <div className="h-24 w-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/5 shadow-2xl rotate-12">
                 <Globe className="h-10 w-10 text-primary opacity-40" />
              </div>
            </div>

            <CardContent className="p-12 space-y-10">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-[1.5rem] p-6">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="font-black uppercase text-xs tracking-widest">Protocol Violation</AlertTitle>
                  <AlertDescription className="font-black text-xs mt-2 uppercase">{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Payment Gateway</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="bg-white/5 border-white/5 h-16 rounded-2xl font-black uppercase tracking-widest text-xs">
                        <SelectValue placeholder="Protocol Selector" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121216] border-white/10 text-white">
                        {gateways.map((g) => (
                          <SelectItem key={g} value={g} className="font-black uppercase text-[10px] tracking-widest py-3">{g} NETWORK</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Tactical Destination ({method || 'ID'})</Label>
                    <Input 
                      value={destinationId} 
                      onChange={(e) => setDestinationId(e.target.value)} 
                      placeholder={profile?.country === 'India' ? "WARRIOR@UPI" : "USER@SIGNAL.COM"} 
                      className="bg-white/5 border-white/5 h-16 rounded-2xl font-black uppercase text-sm tracking-widest focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Volume Transfer ({currencyData.symbol})</Label>
                    <Input 
                      type="number" 
                      value={amountLocal} 
                      onChange={(e) => setAmountLocal(e.target.value)} 
                      placeholder={`MIN. ${minWithdrawLocal.toFixed(1)}`} 
                      className="bg-white/5 border-white/5 h-16 rounded-2xl text-4xl font-black text-primary tabular-nums focus:ring-primary placeholder:opacity-20"
                    />
                  </div>

                  {localValue >= minWithdrawLocal && (
                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 space-y-6 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                         <Zap className="h-20 w-20 text-primary" />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground">Volume in Coins</span>
                        <span className="text-white">{coinsRequired.toFixed(0)} 🪙</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground">Protocol Fee ({(feeRate * 100).toFixed(0)}%)</span>
                        <span className="text-destructive">-{currencyData.symbol}{feeAmount.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-white/5 pt-6 flex justify-between items-center">
                        <span className="text-[11px] font-black uppercase text-white italic tracking-widest">Net Payout</span>
                        <span className="text-3xl font-black text-green-500 tabular-nums shadow-green-500/20 drop-shadow-xl">{currencyData.symbol}{payoutAmount.toFixed(2)}</span>
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
                className="w-full bg-primary hover:bg-primary/90 h-24 rounded-[2rem] font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 text-2xl transition-all hover:scale-[1.02] italic active:scale-95"
              >
                {isSubmitting ? <Loader2 className="h-8 w-8 animate-spin" /> : "Initiate Withdrawal"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-10">
           <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl">
              <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20 shadow-2xl rotate-3">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-6">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Security Policy</h3>
                <div className="text-[10px] text-muted-foreground leading-relaxed font-black space-y-6 text-left uppercase tracking-[0.2em]">
                  <p className="flex items-start gap-3">
                     <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                     Only <span className="text-white italic px-1">Winning Balance</span> is eligible for vault extraction.
                  </p>
                  <p className="flex items-start gap-3">
                     <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                     Region: <span className="text-primary italic px-1">{profile?.country || 'GLOBAL'}</span>
                  </p>
                  <p className="flex items-start gap-3">
                     <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                     VPN/Proxy detection is <span className="text-red-500 italic px-1">ACTIVE</span>. Multiple account signals result in a hard-device ban.
                  </p>
                  <p className="flex items-start gap-3">
                     <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                     Smart Processor: Low volume requests auto-approved. High volume missions require manual review.
                  </p>
                </div>
              </div>
           </Card>
           
           <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 rounded-[2.5rem] p-10 text-center shadow-2xl border-2">
              <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] italic text-white">Elite Withdrawal Limit</p>
              <h4 className="text-3xl font-black italic tracking-tighter mt-2">No Upper Limit</h4>
              <p className="text-[9px] text-muted-foreground mt-4 font-bold uppercase tracking-widest">Winning warriors have no bounds.</p>
           </Card>
        </div>
      </div>
    </div>
  );
}
