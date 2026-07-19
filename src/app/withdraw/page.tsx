
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowLeft, Loader2, AlertCircle, ShieldCheck, ShoppingBag, ArrowRight, Lock, ShieldAlert, CreditCard, UserCheck, Zap, Fingerprint } from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrencyData } from '@/lib/currency';
import { cn } from '@/lib/utils';
import RiskDisclosureModal from '@/components/RiskDisclosureModal';

export default function WithdrawPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [amountLocal, setAmountLocal] = useState('');
  const [method, setMethod] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingFraud, setIsCheckingFraud] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading } = useDoc<UserProfile>(userRef);

  const currencyData = getCurrencyData(profile?.country);

  // --- STRICT VIP 1 VALIDATION ---
  const cpaMet = (profile?.cpaTasksCount || 0) >= 5;
  const adsMet = (profile?.generalTasksCount || 0) >= 5; 
  const referralsMet = (profile?.totalReferrals || 0) >= 5; 
  
  const isValidationPassed = cpaMet && adsMet && referralsMet;

  const handleWithdrawInitiate = () => {
    if (!profile?.riskNoticeAccepted) {
      setShowSecurityModal(true);
      return;
    }
    
    setIsCheckingFraud(true);
    // Simulation of Industrial Anti-Fraud Check
    setTimeout(() => {
      setIsCheckingFraud(false);
      handleWithdraw();
    }, 3000);
  };

  const handleWithdraw = async () => {
    if (!user || !firestore || !profile || !userRef) return;
    
    if (!isValidationPassed) {
      setError("Terminal Locked. Complete 10 Tasks & 5 Invites.");
      return;
    }

    const localValue = parseFloat(amountLocal) || 0;
    const coinsRequired = localValue * currencyData.rateToCoins;

    if (coinsRequired < 50000) { // 50,000 Minimum
      setError(`Minimum threshold: 50,000 Coins (₹500 / $50)`);
      return;
    }

    if (coinsRequired > (profile.winningBalance || 0)) {
      setError("Insufficient verified winning balance.");
      return;
    }

    setIsSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      const fee = coinsRequired * 0.02; // 2% Industrial Tax

      await addDoc(collection(firestore, 'payouts'), {
        userId: user.uid,
        userEmail: user.email,
        coinAmount: coinsRequired,
        localAmount: localValue,
        method,
        destination: destinationId,
        status: 'pending',
        timestamp,
        geo: profile.country,
        vipLevel: profile.vipLevel
      });

      await updateDoc(userRef, {
        winningBalance: increment(-coinsRequired),
        coins: increment(-coinsRequired)
      });

      toast({ title: "DISPATCHED", description: "Audit Node analyzing user activity log." });
      router.push('/dashboard');
    } catch (err: any) {
      setError("Sync Failure.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  const isIndia = profile?.country === 'India';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <RiskDisclosureModal isOpen={showSecurityModal} onOpenChange={setShowSecurityModal} onAccepted={handleWithdraw} />
      
      <div className="flex items-center gap-6 pt-10">
        <Button variant="ghost" asChild className="h-12 w-12 rounded-xl p-0 border border-white/5"><Link href="/dashboard"><ArrowLeft /></Link></Button>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Withdraw <span className="text-primary">Terminal</span></h1>
      </div>

      {!isValidationPassed && (
        <Card className="bg-red-500/5 border-red-500/20 p-8 rounded-[2rem] space-y-6 shadow-2xl">
           <div className="flex items-center gap-4">
              <ShieldAlert className="h-6 w-6 text-red-500 animate-pulse" />
              <h3 className="text-xl font-black uppercase italic text-white leading-none">Access Denied: <span className="text-red-500">VIP 1 REQUIRED</span></h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ProgressBox label="CPA Missions" current={profile?.cpaTasksCount || 0} target={5} color="text-primary" />
              <ProgressBox label="Video Signals" current={profile?.generalTasksCount || 0} target={5} color="text-amber-500" />
              <ProgressBox label="Active Invites" current={profile?.totalReferrals || 0} target={5} color="text-green-500" />
           </div>
           
           <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">
                 "Complete 10 Tasks & 5 Invites to unlock Payout Terminal"
              </p>
           </div>
        </Card>
      )}

      <Card className={cn(
        "bg-[#0a0a0f] border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden transition-all",
        !isValidationPassed && "opacity-40 grayscale pointer-events-none"
      )}>
        <div className="bg-primary/10 p-10 border-b border-white/5 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5"><Zap className="h-20 w-20 text-primary" /></div>
           <p className="text-[10px] font-black uppercase text-primary mb-2 italic tracking-widest">Verified Assets</p>
           <h2 className="text-6xl font-black text-white italic tabular-nums">{profile?.winningBalance?.toLocaleString() || 0} 🪙</h2>
        </div>

        <CardContent className="p-10 space-y-8">
          {error && <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 rounded-xl"><AlertCircle className="h-4 w-4" /><AlertDescription className="font-bold text-xs uppercase">{error}</AlertDescription></Alert>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-3">
               <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Payout Protocol</Label>
               <Select value={method} onValueChange={setMethod}>
                 <SelectTrigger className="h-16 bg-white/5 border-white/10 rounded-xl font-black text-xs uppercase"><SelectValue placeholder="Protocol" /></SelectTrigger>
                 <SelectContent className="bg-[#0a0a0f] border-white/10">
                   {isIndia ? (
                     <>
                       <SelectItem value="UPI">UPI Digital (IN)</SelectItem>
                       <SelectItem value="Paytm">Paytm Wallet (IN)</SelectItem>
                     </>
                   ) : (
                     <>
                       <SelectItem value="PayPal">PayPal Global</SelectItem>
                       <SelectItem value="Crypto">USDT (TRC20)</SelectItem>
                     </>
                   )}
                 </SelectContent>
               </Select>
             </div>

             <div className="space-y-3">
               <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Volume ({currencyData.symbol})</Label>
               <Input type="number" value={amountLocal} onChange={e => setAmountLocal(e.target.value)} placeholder="Min 500" className="h-16 bg-white/5 border-white/10 rounded-xl text-2xl font-black text-primary" />
             </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Destination Credentials</Label>
            <Input value={destinationId} onChange={e => setDestinationId(e.target.value)} placeholder={method === 'UPI' ? "upi-id@bank" : "Email or Wallet Address"} className="h-16 bg-white/5 border-white/10 rounded-xl font-mono text-xs" />
          </div>

          <div className="pt-4">
             <Button 
               onClick={handleWithdrawInitiate} 
               disabled={isSubmitting || isCheckingFraud || !amountLocal || !destinationId || !method || !isValidationPassed} 
               className="w-full h-20 bg-primary font-black uppercase italic text-xl rounded-2xl shadow-xl flex items-center justify-center gap-4"
             >
                {isSubmitting ? <Loader2 className="animate-spin h-8 w-8" /> : 
                 isCheckingFraud ? <><Loader2 className="animate-spin h-6 w-6" /> VERIFYING FRAUD SHIELD...</> : 
                 !isValidationPassed ? "TERMINAL LOCKED" : <><Fingerprint className="h-6 w-6" /> SUBMIT FOR AUDIT</>}
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressBox({ label, current, target, color }: any) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
       <div className="flex justify-between items-center text-[9px] font-black uppercase">
          <span className="text-muted-foreground">{label}</span>
          <span className={color}>{current}/{target}</span>
       </div>
       <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
          <div className={cn("h-full transition-all duration-1000", color.replace('text', 'bg'))} style={{ width: `${pct}%` }} />
       </div>
    </div>
  );
}
