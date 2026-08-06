
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, query, where } from 'firebase/firestore';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Calendar, Users, ShieldAlert, Key, Gamepad2, Coins, Loader2, ArrowLeft, ShieldCheck, PlayCircle, Wallet, Zap, Star, Video, Radio } from 'lucide-react';
import { useState } from 'react';
import { Tournament, Registration, UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import CountdownTimer from '@/components/CountdownTimer';
import Link from 'next/link';
import ScratchCard from '@/components/ScratchCard';
import { cn } from '@/lib/utils';
import RiskDisclosureModal from '@/components/RiskDisclosureModal';

// Required for static export
export function generateStaticParams() {
  return [
    { id: 't1' },
    { id: 't2' }
  ];
}

export default function TournamentDetails() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [gameIdInput, setGameIdInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showScratch, setShowScratch] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'stream'>('info');
  const [showRiskModal, setShowRiskModal] = useState(false);

  const tournamentId = params?.id as string || 't1';
  const tournamentRef = useMemoFirebase(() => (firestore && tournamentId) ? doc(firestore, 'tournaments', tournamentId) : null, [firestore, tournamentId]);
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  
  const regQuery = useMemoFirebase(() => {
    if (!firestore || !user || !tournamentId) return null;
    return query(collection(firestore, 'registrations'), where('userId', '==', user.uid), where('tournamentId', '==', tournamentId));
  }, [firestore, user, tournamentId]);

  const { data: tournament, isLoading: isTourLoading } = useDoc<Tournament>(tournamentRef);
  const { data: registrations } = useCollection<Registration>(regQuery);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const isVip = profile?.vipStatus?.isActive && new Date(profile.vipStatus.expiryDate) > new Date();
  const discountPercent = isVip ? (profile?.vipStatus?.tier === 'monthly' ? 20 : 10) : 0;
  
  const originalFee = tournament?.entryFee || 0;
  const finalFee = Math.floor(originalFee * (1 - discountPercent / 100));

  const isJoined = registrations && registrations.length > 0;
  const playableBalance = (profile?.depositBalance || 0) + (profile?.winningBalance || 0) + (profile?.bonusBalance || 0);
  const canAfford = playableBalance >= finalFee;

  const handleJoin = async () => {
    if (!user || !firestore || !tournament || !userRef || isJoining) return;
    if (!gameIdInput.trim()) { toast({ variant: "destructive", title: "ID Required" }); return; }
    if (!canAfford) { toast({ variant: "destructive", title: "Insufficient Assets" }); return; }

    // Check Risk Consent
    if (!profile?.riskNoticeAccepted) {
      setShowRiskModal(true);
      return;
    }

    setIsJoining(true); 
    try {
      const fee = finalFee;
      
      let rem = fee;
      const depDec = Math.min(profile?.depositBalance || 0, rem);
      rem -= depDec;
      const bonDec = Math.min(profile?.bonusBalance || 0, rem);
      rem -= bonDec;
      const winDec = rem;
      
      await updateDoc(userRef, { 
        depositBalance: increment(-depDec),
        bonusBalance: increment(-bonDec),
        winningBalance: increment(-winDec),
        coins: increment(-fee)
      });

      await addDoc(collection(firestore, 'registrations'), {
        userId: user.uid,
        tournamentId: tournament.id,
        gameId: gameIdInput,
        joinedAt: new Date().toISOString(),
        feePaid: fee
      });

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'entry_fee',
        amount: fee,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Joined: ${tournament.name} ${isVip ? '(VIP Discount Applied)' : ''}`
      });

      toast({ title: "DEPLOYED SUCCESSFULLY" });
      setShowScratch(true);
    } catch (e) {
      toast({ variant: "destructive", title: "JOIN FAILED" });
    } finally {
      setIsJoining(false); 
    }
  };

  const getEmbedUrl = (url?: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  };

  if (isTourLoading) return <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!tournament) notFound();

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-32">
      {showScratch && <ScratchCard onClose={() => setShowScratch(false)} />}
      <RiskDisclosureModal isOpen={showRiskModal} onOpenChange={setShowRiskModal} onAccepted={handleJoin} />
      
      <Button variant="ghost" asChild className="mb-4 hover:bg-white/5 text-muted-foreground">
        <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" /> All Arenas</Link>
      </Button>

      <div className="relative rounded-[2.5rem] overflow-hidden border border-white/5 h-64 md:h-80 shadow-2xl">
        <img src={tournament.banner} alt={tournament.name} className="h-full w-full object-cover opacity-60" />
        <div className="absolute bottom-0 left-0 p-8 md:p-12 space-y-4">
           <Badge className="bg-primary/20 text-primary uppercase font-black px-4">{tournament.gameType}</Badge>
           <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">{tournament.name}</h1>
           <div className="flex items-center gap-4">
             <CountdownTimer targetDate={tournament.startDate} />
           </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
         <button onClick={() => setActiveTab('info')} className={cn("flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'info' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white")}>Tournament Info</button>
         <button onClick={() => setActiveTab('stream')} className={cn("flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", activeTab === 'stream' ? "bg-destructive text-white shadow-lg" : "text-muted-foreground hover:text-white")}>
            <Radio className={cn("h-3 w-3", activeTab === 'stream' && "animate-pulse")} /> Live Stream
         </button>
      </div>

      {activeTab === 'info' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="bg-white/5 border-white/5 rounded-[2rem] p-8">
               <div className="grid grid-cols-2 gap-6">
                  <StatItem icon={<Trophy className="text-amber-400" />} label="Prize Pool" value={tournament.prizePool} />
                  <StatItem icon={<Coins className="text-primary" />} label="Entry Fee" value={`${finalFee} 🪙`} />
                  <StatItem icon={<Calendar className="text-secondary" />} label="Start Time" value={new Date(tournament.startDate).toLocaleString()} />
                  <StatItem icon={<Gamepad2 className="text-white" />} label="Format" value={tournament.gameType} />
               </div>
            </Card>

            {isJoined ? (
              <Card className="bg-green-500/10 border-green-500/20 rounded-[2rem] p-8 border-2 shadow-2xl relative overflow-hidden">
                 <h3 className="text-2xl font-black text-green-500 uppercase flex items-center gap-3 italic"><Key /> Active Keys</h3>
                 <div className="grid sm:grid-cols-2 gap-4 mt-6">
                    <div className="p-6 bg-black/60 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Access ID</p>
                       <p className="text-2xl font-black tracking-widest">{tournament.roomCredentials?.roomId || "AWAITING"}</p>
                    </div>
                    <div className="p-6 bg-black/60 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Access Pass</p>
                       <p className="text-2xl font-black tracking-widest">{tournament.roomCredentials?.roomPassword || "AWAITING"}</p>
                    </div>
                 </div>
              </Card>
            ) : tournament.status === 'active' && (
              <Card className="bg-[#0a0a0f] border-primary/20 rounded-[2rem] p-8 shadow-2xl">
                 <CardHeader className="px-0 space-y-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-2xl font-black uppercase italic">Match Registration</CardTitle>
                      {isVip && (
                        <Badge className="bg-amber-500 text-black font-black italic uppercase px-3 py-1 text-[8px] tracking-widest">
                           <Star className="h-3 w-3 mr-1 inline" /> VIP Discount {discountPercent}% Applied
                        </Badge>
                      )}
                    </div>
                 </CardHeader>
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Game User ID (Required)</Label>
                       <Input value={gameIdInput} onChange={e => setGameIdInput(e.target.value)} placeholder="e.g. 514209931" className="h-16 bg-black border-white/10 rounded-2xl font-black text-xl tracking-widest" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                         <span className="text-[8px] font-black uppercase opacity-60 block mb-1">Entry Fee</span>
                         <div className="flex items-center gap-2">
                            <span className={cn("text-xl font-black", isVip && "line-through opacity-40 text-xs")}>{originalFee}</span>
                            {isVip && <span className="text-xl font-black text-amber-500">{finalFee} 🪙</span>}
                         </div>
                      </div>
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                         <span className="text-[8px] font-black uppercase opacity-60 block mb-1">Your Assets</span>
                         <span className={cn("text-xl font-black", canAfford ? "text-green-500" : "text-red-500")}>{playableBalance.toFixed(0)} 🪙</span>
                      </div>
                    </div>

                    <Button type="button" onClick={handleJoin} disabled={isJoining || !canAfford} className="w-full h-20 bg-primary font-black text-xl italic uppercase shadow-xl">
                       {isJoining ? <Loader2 className="animate-spin" /> : `PAY ${finalFee} COINS`}
                    </Button>
                 </div>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
           {tournament.streamUrl ? (
             <div className="aspect-video bg-black rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
                <iframe 
                  src={getEmbedUrl(tournament.streamUrl) || ''} 
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
             </div>
           ) : (
             <Card className="bg-black border-white/5 rounded-[3rem] overflow-hidden aspect-video relative group">
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 z-10">
                   <div className="h-24 w-24 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center animate-pulse">
                      <Video className="h-10 w-10 text-destructive" />
                   </div>
                   <div className="text-center space-y-2">
                      <h3 className="text-3xl font-black uppercase italic text-white">Live Feed Offline</h3>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Stream starts 5 minutes before match kickoff</p>
                   </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-60" />
                <img src={tournament.banner} className="w-full h-full object-cover blur-xl opacity-20" alt="Stream BG" />
             </Card>
           )}

           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StreamStat label="Active Viewers" value="1.2K" icon={<Users className="text-blue-500" />} />
              <StreamStat label="Stream Status" value={tournament.streamUrl ? "Online" : "Awaiting"} icon={<Radio className={cn("text-destructive", tournament.streamUrl && "text-green-500 animate-pulse")} />} />
              <StreamStat label="Delay" value="Low Latency" icon={<Zap className="text-amber-500" />} />
              <StreamStat label="Resolution" value="1080p Ultra" icon={<ShieldCheck className="text-green-500" />} />
           </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4">
       <div className="h-12 w-12 bg-black/60 rounded-2xl flex items-center justify-center border border-white/5">{icon}</div>
       <div>
          <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
          <p className="text-sm font-black italic">{value}</p>
       </div>
    </div>
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
