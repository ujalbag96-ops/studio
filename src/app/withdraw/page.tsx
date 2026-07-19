
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowLeft, Loader2, AlertCircle, ShieldCheck, ShoppingBag, ArrowRight, Lock, ShieldAlert } from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrencyData } from '@/lib/currency';
import { cn } from '@/lib/utils';
import RiskDisclosureModal from '@/components/RiskDisclosureModal';

const FEE_PERCENT = 0.02;

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
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading } = useDoc<UserProfile>(userRef);

  const isIndia = profile?.country === 'India';
  const currencyData = getCurrencyData(profile?.country);

  // Validation Criteria
  const cpaMet = (profile?.cpaTasksCount || 0) >= 5;
  const generalMet = (profile?.generalTasksCount || 0) >= 10;
  const isValidationPassed = cpaMet && generalMet;

  useEffect(() => {
    if (!isLoading && profile && !isIndia) {
       toast({ title: "INTERNATIONAL MODE", description: "Direct withdrawal restricted. Please use the Gift Card Shop." });
    }
  }, [profile, isIndia, isLoading]);

  const handleWithdrawInitiate = () => {
    if (!profile?.riskNoticeAccepted) {
      setShowSecurityModal(true);
      return;
    }
    handleWithdraw();
  };

  const handleWithdraw = async () => {
    if (!user || !firestore || !profile || !userRef) return;
    
    if (!isValidationPassed) {
      setError("Validation Criteria not met. Complete 5 CPA + 10 General Tasks.");
      return;
    }

    const localValue = parseFloat(amountLocal) || 0;
    const coinsRequired = localValue * currencyData.rateToCoins;

    if (localValue < currencyData.minWithdrawal) {
      setError(`Minimum threshold: ${currencyData.symbol}${currencyData.minWithdrawal}`);
      return;
    }

    if (coinsRequired > (profile.winningBalance || 0)) {
      setError("Insufficient winning balance.");
      return;
    }

    setIsSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      const fee = localValue * FEE_PERCENT;
      const netAmount = localValue - fee;

      await addDoc(collection(firestore, 'payouts'), {
        userId: user.uid,
        userEmail: user.email,
        amount: localValue,
        fee,
        netAmount,
        method,
        destination: destinationId,
        status: 'pending',
        timestamp,
        geo: profile.country
      });

      await updateDoc(userRef, {
        winningBalance: increment(-coinsRequired),
        coins: increment(-coinsRequired)
      });

      toast({ title: "DISPATCHED", description: "Manual audit in progress." });
      router.push('/dashboard');
    } catch (err: any) {
      setError("Sync Failure.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  if (!isIndia) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-10 pt-20">
         <div className="h-32 w-32 bg-amber-500/10 rounded-[3rem] border-2 border-amber-500/20 flex items-center justify-center mx-auto shadow-2xl">
            <ShoppingBag className="h-16 w-16 text-amber-500" />
         </div>
         <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Global <span className="text-amber-500">Reward Mode</span></h2>
            <p className="text-muted-foreground font-medium text-lg leading-relaxed uppercase tracking-tight">
               Direct cash withdrawals are exclusive to India. As a Global User, please redeem your winnings for Gift Cards.
            </p>
         </div>
         <Button asChild className="h-20 w-full max-w-sm bg-amber-500 hover:bg-amber-600 text-black font-black uppercase italic text-xl rounded-2xl shadow-xl">
            <Link href="/shop">ENTER GIFT CARD SHOP <ArrowRight className="ml-3" /></Link>
         </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <RiskDisclosureModal isOpen={showSecurityModal} onOpenChange={setShowSecurityModal} onAccepted={handleWithdraw} />
      
      <div className="flex items-center gap-6 pt-10">
        <Button variant="ghost" asChild className="h-12 w-12 rounded-xl p-0 border border-white/5"><Link href="/dashboard"><ArrowLeft /></Link></Button>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Withdraw <span className="text-primary">Terminal</span></h1>
      </div>

      {!isValidationPassed && (
        <Card className="bg-red-500/5 border-red-500/20 p-8 rounded-[2rem] space-y-6 animate-pulse">
           <div className="flex items-center gap-4">
              <ShieldAlert className="h-6 w-6 text-red-500" />
              <h3 className="text-xl font-black uppercase italic text-white">Action Required: Validation Signal Missing</h3>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={cn("p-5 rounded-2xl border", cpaMet ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-white/5 border-white/5 text-white/40")}>
                 <p className="text-[10px] font-black uppercase">CPA Missions (5 Required)</p>
                 <p className="text-2xl font-black italic">{profile?.cpaTasksCount || 0} / 5</p>
              </div>
              <div className={cn("p-5 rounded-2xl border", generalMet ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-white/5 border-white/5 text-white/40")}>
                 <p className="text-[10px] font-black uppercase">General Tasks (10 Required)</p>
                 <p className="text-2xl font-black italic">{profile?.generalTasksCount || 0} / 10</p>
              </div>
           </div>
           <p className="text-[10px] font-bold text-muted-foreground uppercase text-center italic">
              *General tasks include Quizzes, Daily Check-ins, and Video Ads.
           </p>
        </Card>
      )}

      <Card className={cn(
        "bg-[#0a0a0f] border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden transition-all",
        !isValidationPassed && "opacity-40 grayscale pointer-events-none"
      )}>
        <div className="bg-primary/10 p-10 border-b border-white/5 text-center">
           <p className="text-[10px] font-black uppercase text-primary mb-2 italic">Withdrawable Assets</p>
           <h2 className="text-6xl font-black text-white italic">{profile?.winningBalance?.toFixed(0) || 0} 🪙</h2>
        </div>

        <CardContent className="p-10 space-y-8">
          {error && <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 rounded-xl"><AlertCircle className="h-4 w-4" /><AlertDescription className="font-bold text-xs uppercase">{error}</AlertDescription></Alert>}
          
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Gateway Protocol</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-16 bg-white/5 border-white/10 rounded-xl font-black text-xs uppercase"><SelectValue placeholder="Protocol" /></SelectTrigger>
              <SelectContent className="bg-[#0a0a0f] border-white/10">
                <SelectItem value="UPI">UPI Digital</SelectItem>
                <SelectItem value="Paytm">Paytm Wallet</SelectItem>
                <SelectItem value="Bank">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Amount ({currencyData.symbol})</Label>
            <Input type="number" value={amountLocal} onChange={e => setAmountLocal(e.target.value)} placeholder={`Min ${currencyData.minWithdrawal}`} className="h-16 bg-white/5 border-white/10 rounded-xl text-2xl font-black text-primary" />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Destination Identification</Label>
            <Input value={destinationId} onChange={e => setDestinationId(e.target.value)} placeholder="UPI ID or Account Number" className="h-16 bg-white/5 border-white/10 rounded-xl font-mono text-xs" />
          </div>

          <Button onClick={handleWithdrawInitiate} disabled={isSubmitting || !amountLocal || !destinationId || !method || !isValidationPassed} className="w-full h-20 bg-primary font-black uppercase italic text-xl rounded-2xl shadow-xl">
             {isSubmitting ? <Loader2 className="animate-spin h-8 w-8" /> : !isValidationPassed ? <><Lock className="mr-2 h-5 w-5" /> TERMINAL LOCKED</> : "EXECUTE WITHDRAWAL"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
