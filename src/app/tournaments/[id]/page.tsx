
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, query, where } from 'firebase/firestore';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trophy, Calendar, Users, ShieldAlert, Key, Gamepad2, Coins, Loader2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Tournament, Registration, UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import CountdownTimer from '@/components/CountdownTimer';
import Link from 'next/link';

export default function TournamentDetails() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [gameIdInput, setGameIdInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

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

  const handleJoin = async () => {
    if (!user || !firestore || !tournament || !userRef) {
      router.push('/login');
      return;
    }

    if (!gameIdInput.trim()) {
      toast({ variant: "destructive", title: "Missing ID", description: "Please enter your Game ID." });
      return;
    }

    if ((profile?.coins || 0) < tournament.entryFee) {
      toast({ variant: "destructive", title: "Insufficient Balance", description: "Earn more coins to join." });
      return;
    }

    setIsJoining(true);
    try {
      // 1. Pay entry fee
      await updateDoc(userRef, { coins: increment(-tournament.entryFee) });
      
      // 2. Register
      await addDoc(collection(firestore, 'registrations'), {
        userId: user.uid,
        tournamentId: tournament.id,
        gameId: gameIdInput,
        joinedAt: new Date().toISOString()
      });

      // 3. Ledger
      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'entry_fee',
        amount: tournament.entryFee,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Entry fee for ${tournament.name}`
      });

      toast({ title: "Joined Successfully!", description: "Prepare for the battle." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e.message });
    } finally {
      setIsJoining(false);
    }
  };

  if (isTourLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (!tournament) notFound();

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-32">
      <Button variant="ghost" asChild className="mb-4 hover:bg-white/5">
        <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Arena</Link>
      </Button>

      <div className="relative rounded-[2.5rem] overflow-hidden border border-white/5 h-64 md:h-80 shadow-2xl">
        <img src={tournament.banner} alt={tournament.name} className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 md:p-12 space-y-4">
           <Badge className="bg-primary/20 text-primary border-primary/20 uppercase tracking-widest font-black px-4">{tournament.gameType}</Badge>
           <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">{tournament.name}</h1>
           <CountdownTimer targetDate={tournament.startDate} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card className="bg-card/20 border-white/5 rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                <ShieldAlert className="h-5 w-5 text-secondary" />
                Tournament Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6 p-8">
               <StatItem icon={<Trophy className="text-amber-400" />} label="Prize Pool" value={tournament.prizePool} />
               <StatItem icon={<Coins className="text-primary" />} label="Entry Fee" value={`${tournament.entryFee} 🪙`} />
               <StatItem icon={<Calendar className="text-secondary" />} label="Start Time" value={new Date(tournament.startDate).toLocaleString()} />
               <StatItem icon={<Gamepad2 className="text-white" />} label="Game Mode" value="Squad (Ranked)" />
            </CardContent>
          </Card>

          {isJoined ? (
            <Card className="bg-green-500/5 border-green-500/20 rounded-[2rem] p-8 border-2">
               <CardHeader className="px-0">
                 <CardTitle className="text-2xl font-black text-green-500 uppercase flex items-center gap-3">
                   <Key className="h-6 w-6" /> Room Credentials
                 </CardTitle>
                 <CardDescription className="font-bold">Credentials will appear here 15 mins before start time.</CardDescription>
               </CardHeader>
               <CardContent className="px-0 space-y-4 pt-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Room ID</p>
                       <p className="text-2xl font-black">{tournament.roomCredentials?.roomId || "----"}</p>
                    </div>
                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Password</p>
                       <p className="text-2xl font-black">{tournament.roomCredentials?.roomPassword || "----"}</p>
                    </div>
                 </div>
               </CardContent>
            </Card>
          ) : (
            <Card className="bg-primary/5 border-primary/20 rounded-[2rem] p-8">
              <CardHeader className="px-0">
                <CardTitle className="text-2xl font-black uppercase tracking-tighter">Enter Battle</CardTitle>
                <CardDescription className="font-medium italic">Join the elite arena by providing your game credentials.</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pt-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Your {tournament.gameType} ID</label>
                  <Input 
                    value={gameIdInput}
                    onChange={(e) => setGameIdInput(e.target.value)}
                    placeholder="e.g. 523190421" 
                    className="bg-black/40 border-white/10 h-14 rounded-2xl font-black text-lg"
                  />
                </div>
                <Button 
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl font-black text-lg tracking-[0.2em] shadow-xl shadow-primary/20"
                >
                  {isJoining ? <Loader2 className="animate-spin" /> : `PAY ${tournament.entryFee} 🪙 & JOIN`}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card className="bg-card/40 border-white/5 rounded-[2rem] p-8 text-center space-y-4">
             <Users className="h-10 w-10 text-secondary mx-auto" />
             <h3 className="text-lg font-black uppercase">Community</h3>
             <p className="text-xs text-muted-foreground leading-relaxed font-medium">Connect with fellow warriors in the arena lounge.</p>
             <Button variant="outline" className="w-full border-white/10 h-12 rounded-xl">Lounge Chat</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4">
       <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">{icon}</div>
       <div>
          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
          <p className="text-sm font-black">{value}</p>
       </div>
    </div>
  );
}
