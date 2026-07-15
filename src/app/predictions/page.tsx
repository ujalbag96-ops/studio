'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, updateDoc, increment, addDoc, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Timer, Zap, Globe, Target, ShieldCheck, Loader2, Info, Activity, Flame } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, PredictionPoll } from '../lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import RiskDisclosureModal from '@/components/RiskDisclosureModal';

export default function PredictionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState<string | null>(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [pendingVote, setPendingVote] = useState<{ pollId: string, fee: number, choice: string } | null>(null);

  const pollsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'polls'), orderBy('timestamp', 'desc')) : null, 
    [firestore]
  );
  const { data: polls, isLoading: pollsLoading } = useCollection<PredictionPoll>(pollsQuery);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handleVote = async (pollId: string, fee: number, choice: string) => {
    if (!user || !firestore || !userRef || !profile) {
      toast({ variant: "destructive", title: "Login Required" });
      return;
    }

    if (!profile.riskNoticeAccepted) {
      setPendingVote({ pollId, fee, choice });
      setShowRiskModal(true);
      return;
    }

    if (profile.coins < fee) {
      toast({ variant: "destructive", title: "Insufficient Assets", description: "Complete missions or add cash to play." });
      return;
    }

    setIsVoting(pollId);
    try {
      await updateDoc(userRef!, {
        coins: increment(-fee),
        depositBalance: increment(-fee)
      });

      const pollRef = doc(firestore, 'polls', pollId);
      await updateDoc(pollRef, {
        totalPool: increment(fee)
      });

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'prediction_fee',
        amount: fee,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Poll Entry: ${choice} (Poll #${pollId})`
      });

      toast({ title: "PREDICTION LOCKED", description: "Your vote has been registered in the arena pool." });
      
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      audio.play().catch(() => {});
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Error" });
    } finally {
      setIsVoting(null);
    }
  };

  const cricketPolls = polls?.filter(p => p.category.toLowerCase().includes('cricket')) || [];
  const otherPolls = polls?.filter(p => !p.category.toLowerCase().includes('cricket')) || [];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <RiskDisclosureModal 
        isOpen={showRiskModal} 
        onOpenChange={setShowRiskModal} 
        onAccepted={() => pendingVote && handleVote(pendingVote.pollId, pendingVote.fee, pendingVote.choice)} 
      />

      <div className="space-y-4 pt-10 text-center md:text-left">
         <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-xl">
            <Target className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Live Event Predictions</span>
         </div>
         <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white">Poll <span className="text-primary">Wars</span></h1>
         <p className="text-muted-foreground font-medium text-lg max-w-2xl leading-relaxed">
            Analyze match dynamics in real-time, place your stakes, and win a share of the total arena prize pool.
         </p>
      </div>

      {pollsLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
           <Loader2 className="animate-spin h-10 w-10 text-primary" />
           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] italic">Interfearing Signals...</p>
        </div>
      ) : (
        <>
          {cricketPolls.length > 0 && (
            <div className="space-y-8">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                     <Activity className="h-5 w-5 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">Live Over-by-Over <span className="text-blue-500">Events</span></h2>
               </div>
               <div className="grid gap-6">
                  {cricketPolls.map((poll) => (
                    <PollCard key={poll.id} poll={poll} onVote={handleVote} isVoting={isVoting === poll.id} variant="blue" />
                  ))}
               </div>
            </div>
          )}

          {otherPolls.length > 0 && (
            <div className="space-y-8 pt-10">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                     <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">General <span className="text-primary">Predictions</span></h2>
               </div>
               <div className="grid gap-6">
                  {otherPolls.map((poll) => (
                    <PollCard key={poll.id} poll={poll} onVote={handleVote} isVoting={isVoting === poll.id} />
                  ))}
               </div>
            </div>
          )}

          {(!polls || polls.length === 0) && (
            <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem] space-y-6">
               <Target className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
               <div className="space-y-2">
                  <p className="text-lg font-black uppercase text-white italic">Sector Silence</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">No active signals detected. Check back during live match hours.</p>
               </div>
               <Button asChild variant="outline" className="h-12 px-8 rounded-xl border-white/10 text-[10px] font-black uppercase tracking-widest italic">
                  <Link href="/">Back to Tournaments</Link>
               </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PollCard({ poll, onVote, isVoting, variant = "primary" }: any) {
  const isBlue = variant === "blue";
  const isOverSignal = poll.question.toLowerCase().includes('over #');
  
  return (
    <Card className={cn(
      "bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all border-2",
      isBlue ? "hover:border-blue-500/20 border-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.05)]" : "hover:border-primary/20",
      isOverSignal && "animate-in slide-in-from-left-4 duration-500"
    )}>
       <CardContent className="p-0">
          <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-10">
             <div className="space-y-6 flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4">
                   <Badge className={cn("border-none uppercase font-black text-[8px] tracking-widest px-3 py-1", isBlue ? "bg-blue-500/20 text-blue-500" : "bg-primary/20 text-primary")}>
                     {poll.category}
                   </Badge>
                   {isOverSignal && (
                      <Badge className="bg-red-500/10 text-red-500 border-none uppercase font-black text-[8px] px-3 animate-pulse">FAST ACTION</Badge>
                   )}
                   <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                      <Timer className="h-3 w-3" /> {poll.expiry}
                   </div>
                </div>
                <h3 className={cn(
                  "font-black uppercase italic leading-tight tracking-tighter text-white",
                  isOverSignal ? "text-3xl md:text-5xl" : "text-2xl md:text-4xl"
                )}>
                  {poll.question}
                </h3>
                <div className="flex items-center justify-center md:justify-start gap-10">
                   <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Prize Pool</p>
                      <p className={cn("text-3xl font-black italic tabular-nums", isBlue ? "text-blue-400" : "text-amber-500")}>{poll.totalPool.toLocaleString()} 🪙</p>
                   </div>
                   <div className="w-px h-12 bg-white/10" />
                   <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Entry Fee</p>
                      <p className="text-3xl font-black text-white italic tabular-nums">{poll.entryFee} 🪙</p>
                   </div>
                </div>
             </div>

             <div className="flex flex-col gap-4 w-full md:w-72">
                <Button 
                  onClick={() => onVote(poll.id, poll.entryFee, 'YES')} 
                  disabled={isVoting} 
                  className={cn(
                    "h-16 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all hover:scale-[1.02] active:scale-95",
                    isBlue ? "bg-blue-600 hover:bg-blue-500" : "bg-primary hover:bg-primary/90"
                  )}
                >
                   {isVoting ? <Loader2 className="animate-spin" /> : "VOTE YES"}
                </Button>
                <Button 
                  onClick={() => onVote(poll.id, poll.entryFee, 'NO')} 
                  disabled={isVoting} 
                  variant="outline" 
                  className="h-16 border-white/10 hover:bg-white/5 rounded-2xl font-black text-xl uppercase italic transition-all hover:scale-[1.02] active:scale-95"
                >
                   VOTE NO
                </Button>
             </div>
          </div>
          <div className="bg-white/5 p-4 text-center border-t border-white/5 flex items-center justify-center gap-3">
             <ShieldCheck className="h-3 w-3 text-muted-foreground" />
             <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.3em] italic">Winning distributed among correct predictors minus 10% operational fee.</p>
          </div>
       </CardContent>
    </Card>
  );
}
