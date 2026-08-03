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
  SmartphoneNfc, 
  ArrowRight, 
  ShieldCheck,
  Zap,
  Loader2,
  Copy,
  CheckCircle2,
  ArrowLeft,
  Fingerprint
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppSettings, UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import RiskDisclosureModal from './RiskDisclosureModal';

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
  const [utrId, setUtrId] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handleCopyUPI = async () => {
    if (!settings?.adminUpiId) return;
    setIsCopying(true);
    await navigator.clipboard.writeText(settings.adminUpiId);
    toast({ title: "UPI ID Copied!" });
    setTimeout(() => setIsCopying(false), 2000);
  };

  const checkRiskConsent = () => {
    if (!profile?.riskNoticeAccepted) {
      setShowRiskModal(true);
      return false;
    }
    return true;
  };

  const handleSelection = (nextStep: 'automatic' | 'manual') => {
    if (checkRiskConsent()) {
      setStep(nextStep);
    }
  };

  const handleSubmitUTR = async () => {
    if (!user || isVerifying) return;
    if (!checkRiskConsent()) return;

    if (utrId.length !== 12) {
      toast({ variant: "destructive", title: "Invalid UTR", description: "UTR ID must be 12 digits." });
      return;
    }

    setIsVerifying(true);
    setStep('processing');

    try {
      const response = await fetch('/api/submit-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          utrId,
          amount: parseFloat(amount)
        })
      });

      const result = await response.json();

      if (result.autoVerified) {
        toast({ title: "AUTO-VERIFIED", description: "Coins credited instantly!" });
        onOpenChange(false);
        setStep('selection');
      } else {
        toast({ 
          title: "SUBMITTED", 
          description: "Signal not found. Admin will verify manually (5-15 mins)." 
        });
        onOpenChange(false);
        setStep('selection');
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Engine Error", description: "Verification attempt failed." });
      setStep('manual');
    } finally {
      setIsVerifying(false);
      setUtrId('');
    }
  };

  return (
    <>
      <RiskDisclosureModal isOpen={showRiskModal} onOpenChange={setShowRiskModal} />
      
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-md rounded-[2.5rem] overflow-hidden p-0 shadow-2xl" title="Add Cash Terminal">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10 p-8 space-y-8">
            {step !== 'selection' && step !== 'processing' && (
               <button onClick={() => setStep('selection')} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">
                  <ArrowLeft className="h-3 w-3" /> Back to options
               </button>
            )}

            <DialogHeader className="text-center space-y-2">
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-white">Add <span className="text-primary">Cash</span></DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                {settings?.customAppName || "CampusHub"} Industrial Funding Protocol
              </DialogDescription>
            </DialogHeader>

            {step === 'selection' && (
              <div className="grid gap-4">
                 <button 
                  onClick={() => handleSelection('automatic')}
                  disabled={!settings?.automaticGatewayEnabled}
                  className="w-full p-6 rounded-2xl bg-primary/10 border border-primary/20 hover:border-primary transition-all group flex items-center justify-between disabled:opacity-50"
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
                  onClick={() => handleSelection('manual')}
                  className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group flex items-center justify-between"
                 >
                    <div className="flex items-center gap-4">
                       <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center text-white">
                          <SmartphoneNfc className="h-6 w-6" />
                       </div>
                       <div className="text-left">
                          <p className="text-lg font-black uppercase italic">Manual</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">UTR Verification Bot</p>
                       </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
            )}

            {step === 'automatic' && (
               <div className="space-y-6 animate-in fade-in zoom-in-95">
                  <div className="space-y-3">
                     <Label className="text-[9px] font-black uppercase text-muted-foreground">Amount (₹)</Label>
                     <Input 
                      type="number" 
                      value={amount} 
                      onChange={e => setAmount(e.target.value)} 
                      className="h-16 bg-black border-white/10 rounded-xl text-3xl font-black text-primary text-center"
                     />
                  </div>
                  <Button onClick={() => setStep('processing')} disabled={!amount} className="w-full h-20 bg-primary font-black uppercase italic text-xl rounded-2xl shadow-xl">
                     PROCEED TO PAY
                  </Button>
               </div>
            )}

            {step === 'manual' && (
               <div className="space-y-6 animate-in fade-in zoom-in-95">
                  <div className="bg-white/5 border border-white/5 p-6 space-y-4 rounded-2xl">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-muted-foreground">Transfer to Admin UPI</p>
                        <div className="flex items-center justify-between gap-4 bg-black border border-white/10 p-4 rounded-xl">
                           <p className="font-mono text-primary font-black text-sm">{settings?.adminUpiId || "ujalbag96@oksbi"}</p>
                           <button onClick={handleCopyUPI} className="text-muted-foreground hover:text-white transition-colors">
                              {isCopying ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Amount (₹)</Label>
                        <Input 
                          type="number" 
                          value={amount} 
                          onChange={e => setAmount(e.target.value)} 
                          className="h-12 bg-black border-white/10 rounded-xl font-black text-white"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">UTR ID (12 Digits)</Label>
                        <Input 
                          placeholder="012345678912" 
                          maxLength={12}
                          value={utrId} 
                          onChange={e => setUtrId(e.target.value)} 
                          className="h-12 bg-black border-white/10 rounded-xl font-mono text-xs text-primary"
                        />
                     </div>
                  </div>

                  <Button 
                    onClick={handleSubmitUTR} 
                    disabled={!amount || utrId.length !== 12 || isVerifying}
                    className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase italic text-lg rounded-2xl shadow-xl flex items-center justify-center gap-3"
                  >
                     {isVerifying ? <Loader2 className="animate-spin h-5 w-5" /> : <><Fingerprint className="h-5 w-5" /> VERIFY TRANSACTION</>}
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
                     <h3 className="text-2xl font-black uppercase italic">Processing Signal...</h3>
                  </div>
               </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}