
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface RiskDisclosureModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAccepted?: () => void;
}

export default function RiskDisclosureModal({ isOpen, onOpenChange, onAccepted }: RiskDisclosureModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleAccept = async () => {
    if (!user || !firestore) return;
    setIsUpdating(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        riskNoticeAccepted: true
      });
      toast({ title: "DISCLOSURE ACCEPTED", description: "You may now participate in tournaments." });
      onOpenChange(false);
      if (onAccepted) onAccepted();
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-lg rounded-[2.5rem] overflow-hidden p-0 shadow-2xl">
        <div className="bg-red-600/10 p-8 border-b border-white/5 flex items-center gap-4">
           <div className="h-14 w-14 rounded-2xl bg-red-600/20 flex items-center justify-center border border-red-600/30">
              <ShieldAlert className="h-8 w-8 text-red-500 animate-pulse" />
           </div>
           <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Risk Disclosure</h2>
              <p className="text-[10px] font-black uppercase text-red-400/60 tracking-widest italic">Action Required: Tactical Consent</p>
           </div>
        </div>

        <div className="p-8 space-y-6">
           <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <p className="text-sm font-bold uppercase italic text-white leading-relaxed">
                 <span className="text-red-500 font-black">IMPORTANT NOTICE:</span> Any participation in JILI Games, PUBG Tournaments, or other competitive E-Sports matches involving entry fees or deposited funds is strictly at your own individual risk. 
              </p>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                 The platform does not guarantee winnings and is not responsible for any losses or defeats in these matches. High-stakes competition involves performance variance.
              </p>
           </div>

           <div className="flex items-start gap-4 p-5 rounded-2xl bg-green-500/5 border border-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                 <h4 className="text-[10px] font-black uppercase text-green-500 tracking-widest">Guaranteed Sector</h4>
                 <p className="text-[11px] text-muted-foreground font-bold uppercase leading-relaxed mt-1">
                    All earnings, rewards, and commissions generated through completed <span className="text-white">CPA tasks</span> are 100% guaranteed, secure, and risk-free.
                 </p>
              </div>
           </div>

           <div className="flex items-center gap-3 px-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">By continuing, you acknowledge individual financial responsibility.</p>
           </div>
        </div>

        <DialogFooter className="p-8 bg-white/5 border-t border-white/5 flex flex-col sm:flex-row gap-4">
           <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 font-black uppercase italic text-xs h-14 rounded-xl hover:bg-white/5">Decline</Button>
           <Button onClick={handleAccept} disabled={isUpdating} className="flex-1 bg-primary hover:bg-primary/90 h-14 rounded-xl font-black uppercase italic text-sm shadow-xl">
              {isUpdating ? "SYNCING..." : "I AGREE & CONTINUE"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
