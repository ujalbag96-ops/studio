
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowLeft, Loader2, AlertCircle, ShieldCheck, CheckCircle2, Clock, Zap, Timer, ShieldAlert, Star, Lock, UserCheck, Shield, Fingerprint } from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrencyData } from '@/lib/currency';
import { cn } from '@/lib/utils';
import RiskDisclosureModal from '@/components/RiskDisclosureModal';

const MIN_WITHDRAWAL = 50;
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
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    const day = new Date().getDay();
    if (day === 5 || day === 6) setIsWindowOpen(true);
    else setIsWindowOpen(false);
  }, []);

  const currencyData = getCurrencyData(profile?.country);
  const localValue = parseFloat(amountLocal) || 0;
  const coinsRequired = localValue * currencyData.rateToCoins;
  
  const currentVip = profile?.vipLevel || 0;
  const isKycApproved = profile?.kycStatus === 'approved';
  
  const vipLimits: Record<number, number> = { 0: 0, 1: 500, 2: 1000, 3: 2500, 4: 5000, 5: 15000 };
  const currentLimit = vipLimits[currentVip] || 0;

  const handleWithdrawInitiate = () => {
    if (!profile?.riskNoticeAccepted) {
      setShowSecurityModal(true);
      return;
    }
    handleWithdraw();
  };

  const handleWithdraw = async () => {
    if (!user || !firestore || !profile || !userRef) return;
    
    if (profile.isSuspended) {
       setError("Account Security Audit Failed. Protocol Locked.");
       return;
    }

    if (!isKycApproved) {
       setError("Identity Audit Pending. Please complete KYC in Dashboard.");
       return;
    }

    if (currentVip === 0) {
      setError("Reach VIP Level 1 (10 Missions) to unlock payouts.");
      return;
    }

    if (!isWindowOpen) {
      setError("Withdrawal window is Friday-Saturday only.");
      return;
    }

    if (localValue < MIN_WITHDRAWAL) {
      setError(`Minimum threshold: ${currencyData.symbol}${MIN_WITHDRAWAL}`);
      return;
    }

    if (localValue > currentLimit) {
       setError(`VIP ${currentVip} limit: ${currencyData.symbol}${currentLimit} daily.`);
       return;
    }

    if (coinsRequired > (profile.winningBalance || 0)) {
      setError("Insufficient winning balance.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

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
        vipLevel: currentVip
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
        description: `Withdrawal via ${method}`,
        currencySymbol: currencyData.symbol
      });

      toast({ title: "DISPATCHED", description: "Audit in progress." });
      router.push('/dashboard');
    } catch (err: any) {
      setError("Sync Failure.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <RiskDisclosureModal isOpen={showSecurityModal} onOpenChange={setShowSecurityModal} onAccepted={handleWithdraw} />
      
      <div className="flex items-center gap-6 pt-10">
        <Button variant="ghost" asChild className="h-12 w-12 rounded-xl p-0 border border-white/5"><Link href="/dashboard"><ArrowLeft /></Link></Button>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Withdraw <span className="text-primary">Terminal</span></h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        <Card className="bg-[#0a0a0f] border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="bg-primary/10 p-10 border-b border-white/5 text-center relative">
             <div className="absolute top-4 right-6">
                <Badge className={cn("text-black font-black uppercase text-[8px] italic px-3 py-1", isKycApproved ? "bg-green-500" : "bg-amber-500")}>
                   {isKycApproved ? 'KYC: APPROVED' : 'KYC: PENDING'}
                </Badge>
             </div>
             <p className="text-[10px] font-black uppercase text-primary mb-2 italic">Withdrawable Assets</p>
             <h2 className="text-6xl font-black text-white italic">{profile?.winningBalance?.toFixed(0) || 0} 🪙</h2>
          </div>

          <CardContent className="p-10 space-y-8">
            {!isKycApproved && (
               <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-500 rounded-xl cursor-pointer" onClick={() => router.push('/dashboard')}>
                  <Fingerprint className="h-4 w-4" />
                  <AlertDescription className="font-bold text-[10px] uppercase">Identity Audit Required: Please verify your identity in Dashboard.</AlertDescription>
               </Alert>
            )}

            {error && <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 rounded-xl"><AlertCircle className="h-4 w-4" /><AlertDescription className="font-bold text-xs uppercase">{error}</AlertDescription></Alert>}
            
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Gateway Protocol</Label>
              <Select value={method} onValueChange={setMethod} disabled={!isKycApproved || currentVip === 0}>
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
              <Input 
                type="number" 
                value={amountLocal} 
                onChange={e => setAmountLocal(e.target.value)} 
                placeholder={`Min ${MIN_WITHDRAWAL}`} 
                disabled={!isKycApproved || currentVip === 0}
                className="h-16 bg-white/5 border-white/10 rounded-xl text-2xl font-black text-primary" 
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Destination Identification</Label>
              <Input 
                value={destinationId} 
                onChange={e => setDestinationId(e.target.value)} 
                placeholder="UPI ID or Account Number" 
                disabled={!isKycApproved || currentVip === 0}
                className="h-16 bg-white/5 border-white/10 rounded-xl font-mono text-xs" 
              />
            </div>

            <Button onClick={handleWithdrawInitiate} disabled={isSubmitting || !amountLocal || !destinationId || !method || !isKycApproved || currentVip === 0} className="w-full h-20 bg-primary font-black uppercase italic text-xl rounded-2xl shadow-xl">
               {isSubmitting ? <Loader2 className="animate-spin h-8 w-8" /> : "EXECUTE WITHDRAWAL"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
           <Card className="bg-[#121212] border-white/5 p-10 rounded-[2.5rem] space-y-6">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20"><Shield className="text-primary h-8 w-8" /></div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Security Protocol</h3>
              <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                 <li className="flex items-start gap-3"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> One-time KYC audit is mandatory.</li>
                 <li className="flex items-start gap-3"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Withdrawal window: Friday-Saturday only.</li>
                 <li className="flex items-start gap-3"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> 2% Industrial tax applied to Net Amount.</li>
              </ul>
           </Card>
        </div>
      </div>
    </div>
  );
}
