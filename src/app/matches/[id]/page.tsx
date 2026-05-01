import { MOCK_MATCHES } from '@/app/lib/mock-data';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, ThumbsUp, Sparkles, Trophy, Info } from 'lucide-react';
import AIInsightPanel from '@/components/AIInsightPanel';

export default async function MatchPage({ params }: { params: { id: string } }) {
  const match = MOCK_MATCHES.find(m => m.id === params.id);

  if (!match) notFound();

  const totalVotes = match.votesA + match.votesB;
  const pctA = Math.round((match.votesA / totalVotes) * 100);
  const pctB = 100 - pctA;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Scoreboard Header */}
      <Card className="bg-gradient-to-b from-card to-background border-primary/20">
        <CardContent className="p-8 space-y-8">
          <div className="flex flex-col items-center justify-center space-y-2">
             <Badge variant={match.status === 'live' ? 'destructive' : 'secondary'} className="px-6 font-bold uppercase tracking-widest">
                {match.status}
             </Badge>
             <span className="text-muted-foreground text-sm font-medium">{match.description}</span>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-24 w-24 rounded-2xl bg-muted border border-border p-4 shadow-xl">
                <img src={match.teamA.logo} alt={match.teamA.name} className="h-full w-full object-contain" />
              </div>
              <h2 className="text-xl font-black text-center">{match.teamA.name}</h2>
              <Button variant="outline" className="border-primary/40 hover:bg-primary/10 text-primary w-full max-w-[120px]">
                Vote Team A
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center">
              <span className="text-7xl font-black tracking-tighter text-foreground tabular-nums drop-shadow-lg">
                {match.scoreA} <span className="text-primary">:</span> {match.scoreB}
              </span>
              <div className="mt-4 flex items-center gap-2 rounded-full bg-secondary/20 px-4 py-1 border border-secondary/30">
                 <Sparkles className="h-4 w-4 text-secondary" />
                 <span className="text-xs font-bold text-secondary uppercase">Analysis Live</span>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="h-24 w-24 rounded-2xl bg-muted border border-border p-4 shadow-xl">
                <img src={match.teamB.logo} alt={match.teamB.name} className="h-full w-full object-contain" />
              </div>
              <h2 className="text-xl font-black text-center">{match.teamB.name}</h2>
              <Button variant="outline" className="border-secondary/40 hover:bg-secondary/10 text-secondary w-full max-w-[120px]">
                Vote Team B
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Stats & Voting */}
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-primary" />
                Community Predictions
              </CardTitle>
              <CardDescription>Based on {totalVotes.toLocaleString()} total votes cast by fans.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>{match.teamA.name}</span>
                  <span>{pctA}%</span>
                </div>
                <Progress value={pctA} className="h-3 bg-muted" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>{match.teamB.name}</span>
                  <span>{pctB}%</span>
                </div>
                <Progress value={pctB} className="h-3 bg-muted" />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="stats">Player Stats</TabsTrigger>
              <TabsTrigger value="rules">Tournament Rules</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4 p-4 border rounded-lg bg-card/50">
              <p className="text-muted-foreground text-sm leading-relaxed">
                This is a high-stakes match for {match.tournamentId}. Both teams have shown incredible form in the group stages. The winner of this BO3 series will advance directly to the Grand Finals.
              </p>
            </TabsContent>
            <TabsContent value="stats" className="mt-4">
              <div className="rounded-lg border bg-card p-8 text-center">
                <Info className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Stats are updated in real-time as match progresses.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: AI Insight */}
        <div className="space-y-8">
          <AIInsightPanel match={match} />
          
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Facing issues with voting or scores? Join our Telegram support.</p>
              <Button className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white font-bold">
                Join Telegram Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
