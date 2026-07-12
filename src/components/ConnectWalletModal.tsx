
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  SmartphoneNfc, 
  Wallet, 
  ArrowRight, 
  ShieldCheck,
  Zap,
  Globe,
  Loader2,
  Copy,
  CheckCircle2,
  Send,
  ArrowLeft,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { AppSettings, UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ConnectWalletModal({ isOpen, onOpenChange }: ConnectWalletModalProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [step, setStep] = useState<'selection' | 'automatic' | 'manual' | 'processing'>('selection');
  const [amount, setAmount] = useState('100');
  const [method, setMethod] = useState('');
  const [isCopying, setIsCopying] = useState(false);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);

  const handleCopyUPI = async () => {
    if (!settings?.adminUpiId) return;
    setIsCopying(true);
    await navigator.clipboard.writeText(settings.adminUpiId);
    toast({ title: "UPI ID Copied!" });
    setTimeout(() => setIsCopying(false), 2000);
  };

  const handleManualVerification = () => {
    const telegram = settings?.depositTelegramUrl || "https://t.me/bracketbattles_support";
    const text = encodeURIComponent(`HI ADMIN, I have sent ₹${amount} for my wallet.\n\nUser ID: ${user?.uid}\nEmail: ${user?.email}\n\nPlease verify and add coins.`);
    window.open(`${telegram}?text=${text}`, '_blank');
    onOpenChange(false);
  };

  const handleAutomaticPay = async () => {
    if (!user || !firestore || !userRef) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    setStep('processing');
    
    // Industrial Simulation of Payment Gateway Response
    setTimeout(async () => {
      try {
        const coinAmount = val * 10; // 1 INR = 10 Coins
        
        await updateDoc(userRef, {
          depositBalance: increment(coinAmount),
          coins: increment(coinAmount)
        });

        await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
          type: 'deposit',
          amount: coinAmount,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Automatic Instant Deposit: ₹${val}`
        });

        toast({ title: "DEPOSIT SUCCESSFUL", description: `${coinAmount} Coins added to your wallet.` });
        onOpenChange(false);
        setStep('selection');
      } catch (e) {
        toast({ variant: "destructive", title: "Sync Failed" });
        setStep('automatic');
      }
    }, 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-md rounded-[2.5rem] overflow-hidden p-0">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 p-8 space-y-8">
          {step !== 'selection' && step !== 'processing' && (
             <button onClick={() => setStep('selection')} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to options
             </button>
          )}

          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Add <span className="text-primary">Cash</span></DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Standardized Industrial Funding Protocol
            </DialogDescription>
          </DialogHeader>

          {step === 'selection' && (
            <div className="grid gap-4">
               <button 
                onClick={() => setStep('automatic')}
                disabled={!settings?.automaticGatewayEnabled}
                className="w-full p-6 rounded-2xl bg-primary/10 border border-primary/20 hover:border-primary transition-all group flex items-center justify-between"
               >
                  <div className="flex items-center gap-4">
                     <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                        <Zap className="h-6 w-6" />
                     </div>
                     <div className="text-left">
                        <p className="text-lg font-black uppercase italic">Automatic</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Instant Digital Gateway</p>
                     </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
               </button>

               <button 
                onClick={() => setStep('manual')}
                className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group flex items-center justify-between"
               >
                  <div className="flex items-center gap-4">
                     <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center text-white">
                        <SmartphoneNfc className="h-6 w-6" />
                     </div>
                     <div className="text-left">
                        <p className="text-lg font-black uppercase italic">Manual</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Direct UPI + WhatsApp/TG</p>
                     </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          )}

          {step === 'automatic' && (
             <div className="space-y-6 animate-in fade-in zoom-in-95">
                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground">Amount in INR (₹)</Label>
                   <Input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    className="h-16 bg-black border-white/10 rounded-xl text-3xl font-black text-primary text-center"
                   />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <MethodButton icon={<Smartphone />} label="UPI" active={method === 'upi'} onClick={() => setMethod('upi')} />
                   <MethodButton icon={<CreditCard />} label="Cards" active={method === 'card'} onClick={() => setMethod('card')} />
                </div>
                <Button onClick={handleAutomaticPay} disabled={!amount || !method} className="w-full h-20 bg-primary font-black uppercase italic text-xl rounded-2xl shadow-xl">
                   PROCEED TO PAY
                </Button>
             </div>
          )}

          {step === 'manual' && (
             <div className="space-y-6 animate-in fade-in zoom-in-95">
                <Card className="bg-white/5 border-white/5 p-6 space-y-4 rounded-2xl">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-muted-foreground">Transfer to Admin UPI</p>
                      <div className="flex items-center justify-between gap-4 bg-black border border-white/10 p-4 rounded-xl">
                         <p className="font-mono text-primary font-black text-sm">{settings?.adminUpiId || "ujalbag96@oksbi"}</p>
                         <button onClick={handleCopyUPI} className="text-muted-foreground hover:text-white transition-colors">
                            {isCopying ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                         </button>
                      </div>
                   </div>
                </Card>

                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground">Deposited Amount (₹)</Label>
                   <Input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    className="h-14 bg-black border-white/10 rounded-xl text-xl font-black text-white"
                   />
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                   <p className="text-[10px] font-bold text-amber-500 uppercase leading-relaxed">Send payment first, then click below to share screenshot/UID for approval.</p>
                </div>

                <Button onClick={handleManualVerification} className="w-full h-16 bg-green-600 hover:bg-green-500 font-black uppercase italic text-lg rounded-2xl shadow-xl flex items-center justify-center gap-3">
                   <Send className="h-5 w-5" /> VERIFY ON TELEGRAM
                </Button>
             </div>
          )}

          {step === 'processing' && (
             <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-500">
                <div className="h-24 w-24 relative">
                   <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                   <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
                   </div>
                </div>
                <div>
                   <h3 className="text-2xl font-black uppercase italic">Processing...</h3>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] mt-2">Waiting for Gateway Confirmation</p>
                </div>
                <p className="text-[9px] text-muted-foreground uppercase opacity-40">Please do not close this window</p>
             </div>
          )}

          <div className="pt-4 border-t border-white/5 text-center">
             <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase text-muted-foreground italic">
                <ShieldCheck className="h-3 w-3 text-primary" /> Bracket Battles Secured Connection
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MethodButton({ icon, label, active, onClick }: any) {
   return (
      <button 
        onClick={onClick}
        className={cn(
         "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all",
         active ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
        )}
      >
         {icon}
         <span className="text-[10px] font-black uppercase">{label}</span>
      </button>
   );
}
