
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowLeft, Loader2, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';
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
    
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (withdrawAmount > (profile.coins || 0)) {
      setError("Insufficient balance. You cannot withdraw more than you have.");
      return;
    }

    if (!method) {
      setError("Please select a withdrawal method.");
      return;
    }

    if (!upiId.trim()) {
      setError("Please enter your UPI ID or Payment Detail.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

      // 1. Create Pending Withdrawal Request in Ledger
      await addDoc(ledgerRef, {
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
        title: "Request Submitted",
        description: `Your withdrawal of ₹${withdrawAmount} is being processed.`,
      });

      router.push('/ledger');
    } catch (err: any) {
      setError(err.message || "Failed to process withdrawal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Account Required</h2>
        <Button asChild><Link href="/login">Login to Withdraw</Link></Button>
      </div>
    );
  }

  const gateways = settings?.withdrawalGateways || ['UPI', 'Paytm', 'Google Pay'];

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/ledger"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-black uppercase tracking-tighter">Withdraw Funds</h1>
      </div>

      <Card className="bg-card/50 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden rounded-[2rem]">
        <div className="bg-primary/10 p-6 border-b border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Available Balance</p>
            <h2 className="text-3xl font-black text-primary">{profile?.coins?.toLocaleString() || 0} 🪙</h2>
          </div>
          <Wallet className="h-10 w-10 text-primary opacity-20" />
        </div>

        <CardContent className="p-8 space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive text-xs py-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="bg-black/20 border-white/10 h-12">
                <SelectValue placeholder="Choose gateway" />
              </SelectTrigger>
              <SelectContent>
                {gateways.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">UPI ID / Mobile Number</Label>
            <div className="relative">
              <Input 
                value={upiId} 
                onChange={(e) => setUpiId(e.target.value)} 
                placeholder="e.g. 9876543210@ybl" 
                className="bg-black/20 border-white/10 h-12 pl-10"
              />
              <CreditCard className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground/50" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Withdrawal Amount (INR)</Label>
            <Input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="Min. ₹50" 
              className="bg-black/20 border-white/10 h-12 text-xl font-black"
            />
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider italic">Conversion: 1 🪙 = ₹1</p>
          </div>

          <div className="bg-secondary/10 p-4 rounded-xl border border-secondary/20 space-y-2">
            <div className="flex items-center gap-2 text-secondary">
               <CheckCircle2 className="h-4 w-4" />
               <p className="text-[10px] font-black uppercase tracking-widest">Verification Status</p>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Standard processing time: 2-24 hours. Ensure your UPI ID is correct to avoid payment failure.
            </p>
          </div>
        </CardContent>

        <CardFooter className="p-8 pt-0">
          <Button 
            onClick={handleWithdraw} 
            disabled={isSubmitting || !amount || !upiId || !method} 
            className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </>
            ) : "Submit Request"}
          </Button>
        </CardFooter>
      </Card>

      <p className="text-center text-[10px] text-muted-foreground font-medium max-w-xs mx-auto">
        By submitting, you agree to our withdrawal policy. Multiple accounts found will lead to permanent bans.
      </p>
    </div>
  );
}
