'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowLeft, Loader2, AlertCircle, CheckCircle2, CreditCard, IndianRupee } from 'lucide-react';
import { AppSettings, UserProfile } from '@/app/lib/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function WithdrawPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);

  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handleWithdraw = async () => {
    if (!user || !firestore || !profile) return;
    
    const withdrawAmount = parseFloat(amount);
    
    if (isNaN(withdrawAmount) || withdrawAmount < 50) {
      setError("Minimum withdrawal amount is ₹50.");
      return;
    }

    if (withdrawAmount > (profile.coins || 0)) {
      setError("Insufficient balance in your arena wallet.");
      return;
    }

    if (!method) {
      setError("Please select a withdrawal method.");
      return;
    }

    if (!upiId.trim()) {
      setError("Please enter your UPI ID or mobile number.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

      // 1. Create Pending Withdrawal Request in Ledger
      await addDoc(ledgerRef, {
        userId: user.uid,
        type: 'withdrawal',
        amount: withdrawAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        description: `Withdrawal via ${method}: ${upiId}`
      });

      // 2. Deduct coins from user profile
      await updateDoc(userRef as any, {
        coins: increment(-withdrawAmount)
      });

      toast({
        title: "Request Transmitted",
        description: `Your ₹${withdrawAmount} request is now in the queue.`,
      });

      router.push('/ledger');
    } catch (err: any) {
      setError(err.message || "Arena sync failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center gap-6">
        <div className="h-20 w-20 bg-muted rounded-3xl flex items-center justify-center">
          <Wallet className="h-10 w-10 text-muted-foreground opacity-20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Login Required</h2>
          <p className="text-muted-foreground font-medium">Please sign in to access the withdrawal vault.</p>
        </div>
        <Button asChild size="lg" className="rounded-2xl font-black px-12">
          <Link href="/login">GO TO LOGIN</Link>
        </Button>
      </div>
    );
  }

  const gateways = settings?.withdrawalGateways || ['UPI', 'Paytm', 'Google Pay'];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Button variant="outline" size="icon" asChild className="rounded-2xl border-white/5 bg-white/5 h-12 w-12 hover:bg-white/10">
          <Link href="/ledger"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Vault <span className="text-primary italic">Withdrawal</span></h1>
          <p className="text-muted-foreground text-sm font-medium">Convert your arena glory into real rewards.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="bg-[#1a1a1a] border-white/5 shadow-2xl overflow-hidden rounded-[2.5rem]">
          <div className="bg-gradient-to-r from-primary/10 to-transparent p-10 border-b border-white/5 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Available for Payout</p>
              <h2 className="text-5xl font-black text-white tracking-tighter">
                {profile?.coins?.toLocaleString() || 0} <span className="text-2xl align-top">🪙</span>
              </h2>
            </div>
            <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <IndianRupee className="h-8 w-8 text-primary" />
            </div>
          </div>

          <CardContent className="p-10 space-y-8">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-2xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-black uppercase tracking-widest text-[10px]">Security Alert</AlertTitle>
                <AlertDescription className="font-bold">{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Payment Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="bg-black/40 border-white/10 h-14 rounded-2xl focus:ring-primary">
                      <SelectValue placeholder="Select Gateway" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      {gateways.map((g) => (
                        <SelectItem key={g} value={g} className="font-bold">{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Transfer Destination</Label>
                  <div className="relative">
                    <Input 
                      value={upiId} 
                      onChange={(e) => setUpiId(e.target.value)} 
                      placeholder="e.g. yourname@upi" 
                      className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl font-bold"
                    />
                    <CreditCard className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-[9px] text-muted-foreground px-1">Ensure this detail is 100% correct.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Amount to Withdraw</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      placeholder="Min. 50" 
                      className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-2xl font-black text-secondary"
                    />
                    <div className="absolute left-4 top-4.5 font-black text-muted-foreground/40 text-lg italic">₹</div>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Rate: 1 🪙 = ₹1</p>
                    <p className="text-[9px] text-primary font-black uppercase tracking-widest">No Fee</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/10 space-y-2">
                  <div className="flex items-center gap-2 text-secondary">
                    <CheckCircle2 className="h-3 w-3" />
                    <p className="text-[9px] font-black uppercase tracking-widest">Verification Status</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                    Standard processing: 2-24 hours. VIP members enjoy priority processing.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-10 pt-0">
            <Button 
              onClick={handleWithdraw} 
              disabled={isSubmitting || !amount || !upiId || !method} 
              className="w-full bg-primary hover:bg-primary/90 h-16 rounded-2xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 text-lg transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin mr-3" />
                  PROCESSING...
                </>
              ) : "INITIATE WITHDRAWAL"}
            </Button>
          </CardFooter>
        </Card>

        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] max-w-sm leading-relaxed">
            By submitting, you confirm that your payout details are accurate. Multiple accounts or fraudulent activity will result in permanent ban and forfeiture of coins.
          </p>
          <div className="flex items-center gap-4 opacity-30 grayscale">
            <img src="https://picsum.photos/seed/pci/100/40" alt="PCI DSS" className="h-6" />
            <img src="https://picsum.photos/seed/ssl/100/40" alt="SSL Secure" className="h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
