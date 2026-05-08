
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, query, where } from 'firebase/firestore';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trophy, Calendar, Users, ShieldAlert, Key, Gamepad2, Coins, Loader2, ArrowLeft, ShieldCheck, Copy, CheckCircle2, PlayCircle, Wallet, Zap } from 'lucide-react';
import { useState } from 'react';
import { Tournament, Registration, UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import CountdownTimer from '@/components/CountdownTimer';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function TournamentDetails() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [gameIdInput, setGameIdInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const tournamentRef = useMemoFirebase(() => (firestore && params.id) ? doc(firestore, 'tournaments', params.id as string) : null, [firestore, params.id]);
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  
  const regQuery = useMemoFirebase(() => {
    if (!firestore || !user || !params.id) return null;
    return query(collection(firestore, 'registrations'), where('userId', '==', user.uid), where('tournamentId', '==', params.id));
  }, [firestore, user, params.id]);

  const { data: tournament, isLoading: isTourLoading } = useDoc<Tournament>(tournamentRef);
  const { data: registrations } = useCollection<Registration>(regQuery);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const isJoined = registrations && registrations.length > 0;
  const playableBalance = (profile?.depositBalance || 0) + (profile?.winningBalance || 0);
  const canAfford = playableBalance >= (tournament?.entryFee || 0);

  const copyToClipboard = (text: string, field: string) => {
    if (!text || text === "SECURED") return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: "Intelligence Copied", description: `${field} ready for deployment.` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleJoin = () => {
    if (!user || !firestore || !tournament || !userRef || !tournamentRef) {
      router.push('/login');
      return;
    }

    if (!gameIdInput.trim()) {
      toast({ variant: "destructive", title: "Identity Required", description: "Please enter your System ID." });
      return;
    }

    if (!canAfford) {
      toast({ variant: "destructive", title: "Insufficient Assets", description: "Recharge your portfolio to continue." });
      return;
    }

    setIsJoining(true);

    // WALLET PRIORITY PROTOCOL: DEPOSIT > WINNING
    const depositDeduction = Math.min(profile?.depositBalance || 0, tournament.entryFee);
    const remainingFee = tournament.entryFee - depositDeduction;
    
    const userUpdate = { 
      depositBalance: increment(-depositDeduction),
      winningBalance: increment(-remainingFee),
      withdrawableCoins: increment(-remainingFee),
      coins: increment(-tournament.entryFee)
    };

    updateDoc(userRef, userUpdate).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: userUpdate,
      }));
    });

    const regData = {
      userId: user.uid,
      tournamentId: tournament.id,
      gameId: gameIdInput,
      joinedAt: new Date().toISOString()
    };

    addDoc(collection(firestore, 'registrations'), regData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'registrations',
        operation: 'create',
        requestResourceData: regData,
      }));
    });

    const ledgerData = {
      type: 'entry_fee',
      amount: tournament.entryFee,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Participation Fee for ${tournament.name}`
    };

    addDoc(collection(firestore, 'users', user.uid, 'ledger'), ledgerData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${user.uid}/ledger`,
        operation: 'create',
        requestResourceData: ledgerData,
      }));
    });

    toast({ title: "Operation Confirmed!", description: "Funds synchronized. Session keys enabled." });
    setIsJoining(false);
  };

  if (isTourLoading) return <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Analyzing Event Matrix...</p></div>;
  if (!tournament) notFound();

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-32">
      <Button variant="ghost" asChild className="mb-4 hover:bg-white/5 text-muted-foreground">
        <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" /> System Sector</Link>
      </Button>

      <div className="relative rounded-[2.5rem] overflow-hidden border border-white/5 h-64 md:h-80 shadow-2xl">
        <img src={tournament.banner} alt={tournament.name} className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 md:p-12 space-y-4">
           <Badge className="bg-primary/20 text-primary border-primary/20 uppercase tracking-widest font-black px-4">{tournament.gameType}</Badge>
           <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none italic">{tournament.name}</h1>
           <div className="flex items-center gap-4">
             <CountdownTimer targetDate={tournament.startDate} />
             {isJoined && <Badge className="bg-green-500 text-black font-black uppercase tracking-widest px-3">CONFIRMED</Badge>}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card className="bg-white/5 border-white/5 rounded-[2rem] backdrop-blur-xl overflow-hidden">
            <CardHeader className="bg-white/5 p-8 border-b border-white/5">
              <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight italic">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Operation Brief
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6 p-8">
               <StatItem icon={<Trophy className="text-amber-400" />} label="Prize Pool" value={tournament.prizePool} />
               <StatItem icon={<Coins className="text-primary" />} label="Entry Fee" value={`${tournament.entryFee} 🪙`} />
               <StatItem icon={<Calendar className="text-secondary" />} label="Deployment" value={new Date(tournament.startDate).toLocaleString()} />
               <StatItem icon={<Gamepad2 className="text-white" />} label="Protocol" value={`${tournament.gameType} Elite`} />
            </CardContent>
          </Card>

          {isJoined ? (
            <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 rounded-[2rem] p-8 border-2 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
                  <PlayCircle className="h-40 w-40 text-green-500" />
               </div>
               <CardHeader className="px-0">
                 <CardTitle className="text-2xl font-black text-green-500 uppercase flex items-center gap-3 italic">
                   <Key className="h-6 w-6" /> Secure Session Keys
                 </CardTitle>
                 <div className="mt-4 flex items-center gap-3 bg-black/40 p-4 rounded-2xl border border-green-500/20">
                    <CountdownTimer targetDate={tournament.startDate} />
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Until Operation Launch</span>
                 </div>
               </CardHeader>
               <CardContent className="px-0 space-y-6 pt-4 relative z-10">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-black/60 rounded-2xl border border-white/5 flex flex-col justify-between group transition-all hover:border-green-500/40">
                       <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-2">Access ID Signature</p>
                          <p className="text-2xl font-black tracking-widest">{tournament.roomCredentials?.roomId || "SECURED"}</p>
                       </div>
                       <Button 
                        onClick={() => copyToClipboard(tournament.roomCredentials?.roomId || '', 'Room ID')}
                        variant="ghost" 
                        disabled={!tournament.roomCredentials?.roomId}
                        className="mt-4 w-full justify-between font-black uppercase text-[10px] tracking-widest hover:bg-green-500/20 hover:text-green-500"
                       >
                          {copiedField === 'Room ID' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copiedField === 'Room ID' ? 'COPIED' : 'COPY ID'}
                       </Button>
                    </div>
                    <div className="p-6 bg-black/60 rounded-2xl border border-white/5 flex flex-col justify-between group transition-all hover:border-green-500/40">
                       <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-2">Access Pass Cipher</p>
                          <p className="text-2xl font-black tracking-widest">{tournament.roomCredentials?.roomPassword || "SECURED"}</p>
                       </div>
                       <Button 
                        onClick={() => copyToClipboard(tournament.roomCredentials?.roomPassword || '', 'Password')}
                        variant="ghost" 
                        disabled={!tournament.roomCredentials?.roomPassword}
                        className="mt-4 w-full justify-between font-black uppercase text-[10px] tracking-widest hover:bg-green-500/20 hover:text-green-500"
                       >
                          {copiedField === 'Password' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copiedField === 'Password' ? 'COPIED' : 'COPY PASS'}
                       </Button>
                    </div>
                 </div>
                 
                 <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] font-bold text-muted-foreground italic">Analytical Note: Session keys are transmitted 15m prior to launch. Copy and authorize within the platform client.</p>
                 </div>
               </CardContent>
            </Card>
          ) : (
            <Card className="bg-primary/5 border-primary/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Users className="h-40 w-40 text-primary" />
               </div>
              <CardHeader className="px-0">
                <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Execute Participation</CardTitle>
                <CardDescription className="font-bold uppercase text-[10px] tracking-widest text-primary/80">Confirm deployment to the event sector.</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pt-6 space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Analytical System ID (Verification)</label>
                  <Input 
                    value={gameIdInput}
                    onChange={(e) => setGameIdInput(e.target.value)}
                    placeholder="e.g. 514209931" 
                    className="bg-black/40 border-white/10 h-16 rounded-2xl font-black text-xl tracking-widest focus:ring-primary focus:border-primary/40"
                  />
                </div>
                
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between shadow-inner">
                   <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Liquid Assets:</span>
                   <span className={`text-xl font-black tabular-nums ${canAfford ? 'text-secondary' : 'text-destructive animate-pulse'}`}>
                      {playableBalance.toFixed(1)} 🪙
                   </span>
                </div>

                {!canAfford ? (
                  <div className="grid grid-cols-2 gap-4">
                     <Button asChild variant="outline" className="h-16 rounded-xl border-white/10 font-black uppercase text-[10px]">
                        <Link href="/earning-hub"><Zap className="h-3 w-3 mr-2" /> EARN HUB</Link>
                     </Button>
                     <Button asChild className="h-16 rounded-xl bg-secondary hover:bg-secondary/90 font-black uppercase text-[10px]">
                        <Link href="/dashboard"><Wallet className="h-3 w-3 mr-2" /> RECHARGE</Link>
                     </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="w-full h-20 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-xl tracking-[0.2em] uppercase italic shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {isJoining ? <Loader2 className="animate-spin h-8 w-8" /> : `CONFIRM ${tournament.entryFee} COINS`}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card className="bg-white/5 border-white/5 rounded-[2rem] p-8 text-center space-y-6 shadow-xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 shadow-xl group-hover:rotate-6 transition-transform">
                <Users className="h-8 w-8 text-primary" />
             </div>
             <div className="space-y-2">
               <h3 className="text-xl font-black uppercase italic tracking-tight">Participant Comms</h3>
               <p className="text-xs text-muted-foreground leading-relaxed font-medium">Discuss strategy and event rules with fellow professionals in the lounge.</p>
             </div>
             <Button variant="outline" className="w-full border-white/10 h-14 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">ENTER COMMAND LOUNGE</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4">
       <div className="h-12 w-12 bg-black/60 rounded-2xl flex items-center justify-center border border-white/5 shadow-lg shrink-0">{icon}</div>
       <div className="min-w-0">
          <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em] truncate">{label}</p>
          <p className="text-sm font-black italic truncate">{value}</p>
       </div>
    </div>
  );
}
