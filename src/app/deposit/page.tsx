'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wallet, 
  ArrowLeft, 
  QrCode, 
  CreditCard, 
  PlayCircle, 
  ShieldCheck, 
  Zap,
  CheckCircle2,
  Info
} from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function DepositPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const quickAmounts = [100, 500, 1000];

  const handleDeposit = () => {
    toast({
      title: "Redirecting to Gateway",
      description: "Secure payment channel is opening...",
    });
    // Integration for payment gateway would go here
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Account Required</h2>
        <Button asChild><Link href="/login">Login to Deposit</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/ledger"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-black uppercase tracking-tighter">Deposit Funds</h1>
      </div>

      <Card className="bg-card/50 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden rounded-[2rem]">
        <div className="bg-green-500/10 p-6 border-b border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-green-500/70">Current Balance</p>
            <h2 className="text-3xl font-black text-green-400">{profile?.coins?.toLocaleString() || 0} 🪙</h2>
          </div>
          <Wallet className="h-10 w-10 text-green-500 opacity-20" />
        </div>

        <CardContent className="p-8 space-y-8">
          {/* Method Selection */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Payment Method</Label>
            <div className="grid gap-3">
              <PaymentMethod 
                id="upi" 
                label="UPI / PhonePe" 
                icon={<CreditCard className="h-4 w-4" />} 
                selected={method === 'upi'} 
                onSelect={() => setMethod('upi')}
                bonus="+2% Extra"
              />
              <PaymentMethod 
                id="qr" 
                label="Scan QR Code" 
                icon={<QrCode className="h-4 w-4" />} 
                selected={method === 'qr'} 
                onSelect={() => setMethod('qr')}
                bonus="+2% Extra"
              />
              <PaymentMethod 
                id="paytm" 
                label="Paytm Wallet" 
                icon={<Zap className="h-4 w-4" />} 
                selected={method === 'paytm'} 
                onSelect={() => setMethod('paytm')}
              />
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enter Amount (INR)</Label>
              <Input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="Min. ₹10" 
                className="bg-black/20 border-white/10 h-14 text-2xl font-black text-center"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((amt) => (
                <Button 
                  key={amt} 
                  variant="outline" 
                  className={cn(
                    "border-white/10 bg-white/5 font-bold rounded-xl h-12",
                    amount === amt.toString() && "border-primary bg-primary/10 text-primary"
                  )}
                  onClick={() => setAmount(amt.toString())}
                >
                  ₹{amt}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-start gap-3">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Deposits are credited instantly after verification. Use the same UPI ID for fast processing.
            </p>
          </div>
        </CardContent>

        <CardFooter className="p-8 pt-0">
          <Button 
            onClick={handleDeposit}
            disabled={!amount} 
            className="w-full bg-green-600 hover:bg-green-700 h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-green-900/20 text-base"
          >
            Deposit Now
          </Button>
        </CardFooter>
      </Card>

      {/* Trust Section */}
      <div className="space-y-6">
        <Card className="bg-black/20 border-dashed border-white/10 rounded-2xl p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <PlayCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-tight">Need Help?</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Watch our 1-minute tutorial on how to deposit safely.</p>
            </div>
            <Button variant="link" className="text-primary font-black uppercase tracking-widest text-[10px]">
              WATCH TUTORIAL VIDEO
            </Button>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-6 opacity-30 grayscale">
          <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest">
            <ShieldCheck className="h-3 w-3" /> Secure SSL
          </div>
          <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest">
            <CheckCircle2 className="h-3 w-3" /> PCI DSS
          </div>
          <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest">
            <Zap className="h-3 w-3" /> Instant Credit
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentMethod({ id, label, icon, selected, onSelect, bonus }: any) {
  return (
    <button 
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between p-4 rounded-2xl border transition-all relative overflow-hidden group",
        selected 
          ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(168,85,247,0.1)]" 
          : "bg-black/20 border-white/5 hover:border-white/20"
      )}
    >
      <div className="flex items-center gap-3 relative z-10">
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
          selected ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
        )}>
          {icon}
        </div>
        <span className={cn("text-sm font-bold tracking-tight", selected ? "text-white" : "text-muted-foreground")}>{label}</span>
      </div>
      
      {bonus && (
        <span className="bg-green-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full relative z-10 animate-pulse">
          {bonus}
        </span>
      )}
      
      {selected && (
        <div className="absolute top-0 right-0 p-1">
          <CheckCircle2 className="h-3 w-3 text-primary" />
        </div>
      )}
    </button>
  );
}
