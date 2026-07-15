
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, updateDoc, increment, addDoc, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Zap, Target, Loader2, Gamepad2, Users, Radio, Info } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, ESportsMatch, ESportsPoll } from '../lib/types';
import { cn } from '@/lib/utils';
import RiskDisclosureModal from '@/components/RiskDisclosureModal';

export default function ESportsLiveHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedGame, setSelectedGame] = useState<'All' | 'BGMI' | 'Free Fire' | 'Valorant'>('All');
  const [isVoting, setIsVoting] = useState<string | null>(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [pendingPoll, setPendingPoll] = useState<{ poll: ESportsPoll; choice: string } | null>(null);

  const matchesQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'esports_matches'), orderBy('timestamp', 'desc')) : null, 
    [firestore]
  );
  const { data: matches, isLoading: matchesLoading } = useCollection<ESportsMatch>(matchesQuery);

  const pollsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'esports_polls'), where('status', '==', 'open')) : null, 
    [firestore]
  );
  const { data: polls } = useCollection<ESportsPoll>(pollsQuery);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handlePredict = async (poll: ESportsPoll, choice: string) => {
    if (!user || !firestore || !profile) {
      toast({ variant: "destructive", title: "Login Required" });
      return;
    }

    if (!profile.riskNoticeAccepted) {
      setPendingPoll({ poll, choice });
      setShowRiskModal(true);
      return;
    }

    if (profile.coins < poll.entryFee) {
      toast({ variant: "destructive", title: "Insufficient Assets" });
      return;
    }

    setIsVoting(poll.id);
    try {
      await updateDoc(userRef, {
        coins: increment(-poll.entryFee),
        depositBalance: increment(-poll.entryFee)
      });

      const pollRef = doc(firestore, 'esports_polls', poll.id);
      await updateDoc(pollRef, {
        totalPool: increment(poll.entryFee)
      });

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'esports_stake',
        amount: poll.entryFee,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `E-Sports Stake: ${choice} in ${poll.question}`
      });

      toast({ title: "STAKE REGISTERED", description: "Successfully locked in your prediction." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsVoting(null);
    }
  };

  const filteredMatches = matches?.filter(m => selectedGame === 'All' || m.game === selectedGame) || [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <RiskDisclosureModal 
        isOpen={showRiskModal} 
        onOpenChange={setShowRiskModal} 
        onAccepted={() => pendingPoll && handlePredict(pendingPoll.poll, pendingPoll.choice)} 
      />

      <div className="space-y-4 pt-10">
         <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-4 py-1 text-[10px]">Industrial E-Sports Arena</Badge>
         <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white">Live <span className="text-primary">Stakes</span></h1>
         <div className="flex flex-wrap gap-4 pt-4">
            <GameFilter active={selectedGame === 'All'} label="All Arenas" onClick={() => setSelectedGame('All')} />
            <GameFilter active={selectedGame === 'BGMI'} label="BGMI" onClick={() => setSelectedGame('BGMI')} />
            <GameFilter active={selectedGame === 'Free Fire'} label="Free Fire" onClick={() => setSelectedGame('Free Fire')} />
            <GameFilter active={selectedGame === 'Valorant'} label="Valorant" onClick={() => setSelectedGame('Valorant')} />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-10">
            {matchesLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
            ) : filteredMatches.length > 0 ? filteredMatches.map((match) => (
              <Card key={match.id} className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden group shadow-2xl">
                 <div className="aspect-video bg-black relative group cursor-pointer">
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 z-10">
                       <PlayCircle className="h-20 w-20 text-white/20 group-hover:text-primary transition-all group-hover:scale-110" />
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Watch Live Feed</p>
                    </div>
                    <img src={`https://picsum.photos/seed/${match.id}/800/450`} className="w-full h-full object-cover opacity-30 blur-sm" alt="Stream" />
                    <div className="absolute top-6 left-6 flex items-center gap-3">
                       <Badge className="bg-red-600 text-white border-none font-black px-4 py-1.5 animate-pulse">LIVE</Badge>
                       <Badge className="bg-white/10 text-white border-none font-black px-4 py-1.5 uppercase italic">{match.game}</Badge>
                    </div>
                 </div>
                 <div className="p-10 space-y-8">
                    <div className="flex items-center justify-between">
                       <h3 className="text-3xl font-black uppercase italic tracking-tighter">{match.title}</h3>
                       <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="text-[10px] font-black">2.4K Watching</span>
                       </div>
                    </div>
                    
                    <div className="space-y-6">
                       <p className="text-[10px] font-black uppercase text-primary tracking-widest italic">Fast Updating Live Polls</p>
                       <div className="grid gap-4">
                          {polls?.filter(p => p.matchId === match.id).map(poll => (
                            <div key={poll.id} className="p-6 bg-white/5 border border-white/5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary/20 transition-all">
                               <div className="space-y-2 text-center md:text-left">
                                  <p className="text-lg font-black uppercase italic">{poll.question}</p>
                                  <p className="text-[10px] text-muted-foreground font-bold">POOL: {poll.totalPool.toLocaleString()} 🪙 • FEE: {poll.entryFee} 🪙</p>
                               </div>
                               <div className="flex gap-3 w-full md:w-auto">
                                  <Button onClick={() => handlePredict(poll, poll.optionA)} disabled={isVoting === poll.id} className="flex-1 md:w-32 bg-primary hover:bg-primary/90 font-black h-12 rounded-xl text-[10px] uppercase">
                                     {poll.optionA}
                                  </Button>
                                  <Button onClick={() => handlePredict(poll, poll.optionB)} disabled={isVoting === poll.id} variant="outline" className="flex-1 md:w-32 border-white/10 hover:bg-white/5 font-black h-12 rounded-xl text-[10px] uppercase">
                                     {poll.optionB}
                                  </Button>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </Card>
            )) : (
              <div className="py-32 text-center space-y-6 border-2 border-dashed border-white/5 rounded-[3rem]">
                 <Radio className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
                 <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">No Active Live Deployments</p>
              </div>
            )}
         </div>

         <div className="space-y-10">
            <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
               <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Target className="h-8 w-8 text-primary" />
               </div>
               <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Prediction Policy</h3>
                  <div className="text-[10px] text-muted-foreground font-bold space-y-6 uppercase leading-relaxed tracking-widest">
                     <p className="flex items-start gap-3"><span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" /> Stakes are non-refundable once locked in the live feed.</p>
                     <p className="flex items-start gap-3"><span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" /> Winners share 90% of total pool. 10% platform fee applies.</p>
                     <p className="flex items-start gap-3"><span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" /> Settlement occurs 2 minutes after outcome verification.</p>
                  </div>
               </div>
            </Card>

            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 space-y-6 shadow-2xl overflow-hidden relative">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Zap className="h-32 w-32 text-primary" />
               </div>
               <h4 className="text-lg font-black uppercase italic">Top Predictors</h4>
               <div className="space-y-4 relative z-10">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-[10px]">#{i}</div>
                          <p className="text-[10px] font-black">USER_{Math.random().toString(36).substring(2, 6).toUpperCase()}</p>
                       </div>
                       <span className="text-xs font-black text-green-500">+1.2K 🪙</span>
                    </div>
                  ))}
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}

function GameFilter({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
        active ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" : "bg-white/5 text-muted-foreground hover:bg-white/10"
      )}
    >
      {label}
    </button>
  );
}

function StreamStat({ label, value, icon }: any) {
  return (
    <Card className="bg-white/5 border-white/5 rounded-2xl p-6 text-center space-y-2">
       <div className="mx-auto h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">{icon}</div>
       <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
       <p className="text-xs font-black text-white italic">{value}</p>
    </Card>
  );
}
