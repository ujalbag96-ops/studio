
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowLeft, Loader2, AlertCircle, ShieldCheck, CheckCircle2, Clock, Zap, Timer, ShieldAlert, Star } from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrencyData } from '@/lib/currency';
import { cn } from '@/lib/utils';

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
  
  // --- VIP LIMIT VALIDATOR ---
  const currentVip = profile?.vipLevel || 0;
  const vipLimits: Record<number, number> = {
    0: 100,
    1: 500,
    2: 1000,
    3: 2500,
    4: 5000,
    5: 10000,
    6: 25000,
    7: 50000
  };
  const currentLimit = vipLimits[currentVip];

  const handleWithdraw = async () => {
    if (!user || !firestore || !profile || !userRef) return;
    
    if (profile.isSuspended || profile.isVpnDetected) {
       setError("Identity Security Audit Failed. Protocol Locked.");
       return;
    }

    if (!isWindowOpen) {
      setError("Withdrawal window is Friday-Saturday only.");
      return;
    }

    if (localValue < MIN_WITHDRAWAL) {
      setError(`Minimum threshold: ${currencyData.symbol}${MIN_WITHDRAWAL} required.`);
      return;
    }

    if (localValue > currentLimit) {
       setError(`VIP ${currentVip} limit exceeded. Maximum daily payout is ${currencyData.symbol}${currentLimit}. Upgrade to higher VIP level by completing more missions!`);
       return;
    }

    if (coinsRequired > (profile.winningBalance || 0)) {
      setError("Insufficient winning assets.");
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
        vipLevel: currentVip,
        isExpress: currentVip >= 5
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
        description: `VIP ${currentVip} Payout via ${method}`,
        currencySymbol: currencyData.symbol
      });

      toast({ title: "DISPATCHED", description: "Request queued for industrial audit." });
      router.push('/dashboard');
    } catch (err: any) {
      setError("Sync Failure.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <div className="flex items-center gap-6 pt-10">
        <Button variant="ghost" asChild className="h-12 w-12 rounded-xl p-0 border border-white/5"><Link href="/dashboard"><ArrowLeft /></Link></Button>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Withdraw <span className="text-primary">Terminal</span></h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        <Card className="bg-[#0a0a0f] border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="bg-primary/10 p-10 border-b border-white/5 text-center relative">
             <div className="absolute top-4 right-6">
                <Badge className="bg-amber-500 text-black font-black uppercase text-[8px] italic">VIP LEVEL {currentVip}</Badge>
             </div>
             <p className="text-[10px] font-black uppercase text-primary mb-2 italic">Withdrawable Assets</p>
             <h2 className="text-6xl font-black text-white italic">{profile?.winningBalance?.toFixed(0) || 0} 🪙</h2>
          </div>

          <CardContent className="p-10 space-y-8">
            {error && <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 rounded-xl"><AlertCircle className="h-4 w-4" /><AlertDescription className="font-bold">{error}</AlertDescription></Alert>}
            
            <div className="space-y-4">
               <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground px-1">
                  <span>Daily VIP Limit</span>
                  <span className="text-amber-500">{currencyData.symbol}{currentLimit}</span>
               </div>
               <Progress value={(localValue / currentLimit) * 100} className="h-2 bg-white/5" />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Transfer Gateway</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-16 bg-white/5 border-white/10 rounded-xl font-black text-xs uppercase"><SelectValue placeholder="Protocol" /></SelectTrigger>
                <SelectContent className="bg-[#0a0a0f] border-white/10">
                  <SelectItem value="UPI">UPI Industrial</SelectItem>
                  <SelectItem value="Paytm">Paytm Terminal</SelectItem>
                  <SelectItem value="Bank">IMPS Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Amount ({currencyData.symbol})</Label>
              <Input type="number" value={amountLocal} onChange={e => setAmountLocal(e.target.value)} placeholder={`Min ${MIN_WITHDRAWAL}`} className="h-16 bg-white/5 border-white/10 rounded-xl text-2xl font-black text-primary" />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Account ID / UPI VPA</Label>
              <Input value={destinationId} onChange={e => setDestinationId(e.target.value)} placeholder="Destination Signal" className="h-16 bg-white/5 border-white/10 rounded-xl font-mono text-xs" />
            </div>

            <Button onClick={handleWithdraw} disabled={isSubmitting || !amountLocal || !destinationId || !method} className="w-full h-20 bg-primary font-black uppercase italic text-xl rounded-2xl shadow-xl">
               {isSubmitting ? <Loader2 className="animate-spin h-8 w-8" /> : "EXECUTE WITHDRAWAL"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
           <Card className="bg-amber-500/5 border-amber-500/20 border-2 rounded-[2.5rem] p-10 flex flex-col justify-center space-y-6">
              <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-xl"><Star className="text-amber-500 h-8 w-8 fill-amber-500" /></div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">VIP Limit Matrix</h3>
              <div className="space-y-4">
                 <TierRow level={0} tasks={0} limit={100} current={currentVip === 0} />
                 <TierRow level={1} tasks={10} limit={500} current={currentVip === 1} />
                 <TierRow level={3} tasks={60} limit={2500} current={currentVip === 3} />
                 <TierRow level={5} tasks={200} limit={10000} current={currentVip === 5} />
                 <TierRow level={7} tasks={1000} limit={50000} current={currentVip === 7} />
              </div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed text-center italic">Complete missions in Earning Hub to upgrade your limit instantly.</p>
           </Card>
        </div>
      </div>
    </div>
  );
}

function TierRow({ level, tasks, limit, current }: any) {
   return (
      <div className={cn("flex justify-between items-center p-3 rounded-xl border transition-all", current ? "bg-amber-500/10 border-amber-500 text-white" : "border-white/5 opacity-40")}>
         <div>
            <p className="text-[10px] font-black">LEVEL {level}</p>
            <p className="text-[8px] font-bold uppercase opacity-60">{tasks} Missions</p>
         </div>
         <p className="font-black italic">₹{limit}</p>
      </div>
   );
}
