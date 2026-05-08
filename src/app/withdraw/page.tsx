
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowLeft, Loader2, AlertCircle, CreditCard, IndianRupee, Percent, Coins, Trophy, ShieldCheck } from 'lucide-react';
import { AppSettings, UserProfile } from '@/app/lib/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const COIN_TO_RUPEE_RATE = 10; 

export default function WithdrawPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [amountRupees, setAmountRupees] = useState('');
  const [method, setMethod] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);

  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const rupeeValue = parseFloat(amountRupees) || 0;
  const coinsRequired = rupeeValue * COIN_TO_RUPEE_RATE;
  
  const feeRate = 0.08; 
  const feeAmount = rupeeValue * feeRate;
  const payoutAmount = rupeeValue - feeAmount;

  const availableWinningBal = profile?.winningBalance || 0;

  const handleWithdraw = async () => {
    if (!user || !firestore || !profile || !userRef) return;
    
    if (isNaN(rupeeValue) || rupeeValue < 110) {
      setError("Minimum withdrawal protocol requires ₹110.");
      return;
    }

    if (coinsRequired > availableWinningBal) {
      setError(`Insufficient Intel Funds. Max withdrawal: ₹${(availableWinningBal / COIN_TO_RUPEE_RATE).toFixed(2)}.`);
      return;
    }

    if (!method || !upiId.trim()) {
      setError("Provide gateway and tactical destination (UPI).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');
      
      // AI FRAUD CHECK: If user did > 5 tasks today, flag for manual review
      const isSuspect = (profile.tasksCompletedToday || 0) > 5;
      const status = isSuspect ? 'review_required' : 'pending';

      await addDoc(ledgerRef, {
        userId: user.uid,
        type: 'withdrawal',
        amount: rupeeValue,
        date: new Date().toISOString().split('T')[0],
        status: status,
        isFlagged: isSuspect,
        description: `Withdrawal via ${method}: ${upiId} (Net: ₹${payoutAmount.toFixed(2)})`
      });

      await updateDoc(userRef, {
        winningBalance: increment(-coinsRequired),
        coins: increment(-coinsRequired)
      });

      toast({
        title: isSuspect ? "Manual Review Required" : "Request Queued",
        description: isSuspect ? "Multiple tasks detected. Admin will verify before release." : "Withdrawal initiated.",
      });

      router.push('/ledger');
    } catch (err: any) {
      setError("Arena sync failed. Protocol disconnected.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  const gateways = settings?.withdrawalGateways || ['UPI', 'Paytm', 'PhonePe'];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <div className="flex items-center gap-6">
        <Button variant="outline" size="icon" asChild className="rounded-2xl border-white/5 bg-white/5 h-12 w-12">
          <Link href="/ledger"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Tactical <span className="text-primary">Vault</span></h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest italic">Secure Withdrawal Sector</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-[#1a1a1a] border-white/5 shadow-2xl overflow-hidden rounded-[3rem]">
            <div className="bg-gradient-to-r from-green-500/10 to-transparent p-10 border-b border-white/5 flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-green-500 flex items-center gap-2">
                  <Trophy className="h-3 w-3" /> Withdrawable Intel
                </p>
                <h2 className="text-5xl font-black text-white tracking-tighter">
                  {Math.floor(availableWinningBal).toLocaleString()} <span className="text-2xl align-top">🪙</span>
                  <span className="text-lg text-muted-foreground ml-4">≈ ₹{(availableWinningBal / 10).toFixed(2)}</span>
                </h2>
              </div>
              <IndianRupee className="h-10 w-10 text-green-500 opacity-20" />
            </div>

            <CardContent className="p-10 space-y-8">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-black uppercase text-[10px]">Protocol Violation</AlertTitle>
                  <AlertDescription className="font-bold text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gateway</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="bg-black/40 border-white/10 h-14 rounded-xl">
                        <SelectValue placeholder="Protocol Selector" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                        {gateways.map((g) => (
                          <SelectItem key={g} value={g} className="font-bold uppercase text-xs">{g} NETWORK</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">UPI Destination</Label>
                    <Input 
                      value={upiId} 
                      onChange={(e) => setUpiId(e.target.value)} 
                      placeholder="warrior@upi" 
                      className="bg-black/40 border-white/10 h-14 rounded-xl font-black uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Volume (₹)</Label>
                    <Input 
                      type="number" 
                      value={amountRupees} 
                      onChange={(e) => setAmountRupees(e.target.value)} 
                      placeholder="Min. 110" 
                      className="bg-black/40 border-white/10 h-14 rounded-xl text-3xl font-black text-green-500 tabular-nums"
                    />
                  </div>

                  {rupeeValue >= 110 && (
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 shadow-inner">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-muted-foreground">Volume in Coins</span>
                        <span className="text-white">{coinsRequired} 🪙</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-muted-foreground">Admin Fee (8%)</span>
                        <span className="text-destructive">-₹{feeAmount.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-white">Net Payout</span>
                        <span className="text-2xl font-black text-green-500 tabular-nums">₹{payoutAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-10 pt-0">
              <Button 
                onClick={handleWithdraw} 
                disabled={isSubmitting || !amountRupees || !upiId || !method || rupeeValue < 110} 
                className="w-full bg-primary hover:bg-primary/90 h-18 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 text-lg transition-all italic"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "INITIATE WITHDRAWAL"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="bg-white/5 border-white/5 rounded-[2.5rem] p-8 text-center space-y-6 shadow-xl">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 shadow-xl">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-black uppercase italic tracking-tighter">Security Policy</h3>
                <div className="text-[10px] text-muted-foreground leading-relaxed font-bold space-y-4 text-left uppercase tracking-widest">
                  <p>• Only <span className="text-white">Winning Balance</span> is withdrawable.</p>
                  <p>• Conversion from Tasks requires protocol verification.</p>
                  <p>• VPN/Proxy detection active. Violators will face <span className="text-red-500">Blacklist Status</span>.</p>
                  <p>• Manual review active for high-volume task earners.</p>
                </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
