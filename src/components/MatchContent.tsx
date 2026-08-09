'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThumbsUp, Sparkles, Loader2, Lock } from 'lucide-react';
import AIInsightPanel from '@/components/AIInsightPanel';
import { Match } from '@/app/lib/types';
import { useState } from 'react';

export default function MatchContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [voted, setVoted] = useState(false);

  const matchId = params?.id as string || 'm1';
  const matchRef = useMemoFirebase(() => (firestore && matchId) ? doc(firestore, 'matches', matchId) : null, [firestore, matchId]);
  const { data: match, isLoading } = useDoc<Match>(matchRef);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (!match) notFound();

  const totalVotes = (match.votesA || 0) + (match.votesB || 0);
  const pctA = totalVotes > 0 ? Math.round(((match.votesA || 0) / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;

  const handleVote = async (team: 'A' | 'B') => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (voted || !firestore || !matchRef) return;

    try {
      await updateDoc(matchRef, {
        [team === 'A' ? 'votesA' : 'votesB']: increment(1)
      });
      setVoted(true);
    } catch (e) {
      console.error("Voting failed", e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <Card className="bg-gradient-to-b from-card to-background border-primary/20 overflow-hidden relative rounded-[2.5rem]">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <CardContent className="p-10 space-y-12 relative z-10">
          <div className="flex flex-col items-center justify-center space-y-2">
             <Badge variant={match.status === 'live' ? 'destructive' : 'secondary'} className="px-6 font-bold uppercase tracking-widest py-1.5 shadow-xl">
                {match.status}
             </Badge>
             <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{match.description}</span>
          </div>

          <div className="grid grid-cols-3 items-center gap-8">
            <div className="flex flex-col items-center space-y-6">
              <div className="h-28 w-28 rounded-3xl bg-white/5 border border-white/10 p-5 shadow-2xl backdrop-blur-md">
                <img src={match.teamA.logo} alt={match.teamA.name} className="h-full w-full object-contain" />
              </div>
              <h2 className="text-xl font-black text-center uppercase tracking-tighter">{match.teamA.name}</h2>
              <Button 
                variant="outline" 
                className="border-primary/40 hover:bg-primary/10 text-primary w-full max-w-[140px] font-black uppercase tracking-widest h-11 rounded-xl"
                onClick={() => handleVote('A')}
                disabled={voted}
              >
                {!user && <Lock className="h-3 w-3 mr-2" />} {voted ? 'Voted' : 'Vote A'}
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center">
              <span className="text-7xl font-black tracking-tighter text-foreground tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                {match.scoreA} <span className="text-primary italic">:</span> {match.scoreB}
              </span>
              <div className="mt-6 flex items-center gap-2 rounded-full bg-secondary/10 px-6 py-2 border border-secondary/20 animate-pulse">
                 <Sparkles className="h-4 w-4 text-secondary" />
                 <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Live Analysis</span>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-6">
              <div className="h-28 w-28 rounded-3xl bg-white/5 border border-white/10 p-5 shadow-2xl backdrop-blur-md">
                <img src={match.teamB.logo} alt={match.teamB.name} className="h-full w-full object-contain" />
              </div>
              <h2 className="text-xl font-black text-center uppercase tracking-tighter">{match.teamB.name}</h2>
              <Button 
                variant="outline" 
                className="border-secondary/40 hover:bg-secondary/10 text-secondary w-full max-w-[140px] font-black uppercase tracking-widest h-11 rounded-xl"
                onClick={() => handleVote('B')}
                disabled={voted}
              >
                {!user && <Lock className="h-3 w-3 mr-2" />} {voted ? 'Voted' : 'Vote B'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card className="bg-card/20 border-white/5 rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                <ThumbsUp className="h-5 w-5 text-primary" />
                Battle Predictions
              </CardTitle>
              <CardDescription className="font-medium text-xs">Based on {totalVotes.toLocaleString()} community fan votes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span>{match.teamA.name}</span>
                  <span className="text-primary">{pctA}%</span>
                </div>
                <Progress value={pctA} className="h-3 bg-white/5" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span>{match.teamB.name}</span>
                  <span className="text-secondary">{pctB}%</span>
                </div>
                <Progress value={pctB} className="h-3 bg-white/5" />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3 bg-muted/20 p-1 rounded-xl">
              <TabsTrigger value="overview" className="font-bold">Overview</TabsTrigger>
              <TabsTrigger value="stats" className="font-bold">Stats</TabsTrigger>
              <TabsTrigger value="rules" className="font-bold">Rules</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4 p-8 border border-white/5 rounded-[2rem] bg-card/20">
              <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                High-stakes battle for the {match.tournamentId} trophy. Every vote counts towards the final arena leaderboard.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <AIInsightPanel match={match} />
          
          <Card className="bg-primary/5 border-primary/20 rounded-[2rem] p-8 space-y-6">
              <h3 className="text-lg font-black uppercase tracking-tight">Support</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">Facing issues with your arena vote? Contact our 24/7 elite support team.</p>
              <Button asChild className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white font-black h-12 rounded-xl">
                <a href="https://t.me/campushub_support" target="_blank" rel="noopener noreferrer">
                  Telegram Help
                </a>
              </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
