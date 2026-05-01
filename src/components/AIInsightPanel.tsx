"use client";

import { useState } from 'react';
import { aiMatchInsightSummary } from '@/ai/flows/ai-match-insight-summary-flow';
import { Match } from '@/app/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';

export default function AIInsightPanel({ match }: { match: Match }) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function generateInsight() {
    setLoading(true);
    try {
      const result = await aiMatchInsightSummary({
        matchDescription: match.description,
        currentScore: `${match.teamA.name}: ${match.scoreA}, ${match.teamB.name}: ${match.scoreB}`,
        playerStats: "Top player on Team A has 25 kills. Team B has balanced performance.",
        userVotes: `${match.votesA} for ${match.teamA.name}, ${match.votesB} for ${match.teamB.name}`
      });
      setInsight(result.summary);
    } catch (error) {
      setInsight("Unable to generate insight at this time. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-secondary/30 bg-secondary/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <Sparkles className="h-20 w-20 text-secondary" />
      </div>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-secondary">
          <Sparkles className="h-4 w-4" />
          AI Analyst Insight
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[100px] flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            <span className="text-xs font-medium text-muted-foreground">Analyzing match data...</span>
          </div>
        ) : insight ? (
          <p className="text-sm italic leading-relaxed text-foreground">"{insight}"</p>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Generate an AI-powered summary of current match dynamics.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={generateInsight} 
          disabled={loading}
          variant="secondary" 
          size="sm" 
          className="w-full font-bold shadow-lg"
        >
          {insight ? <><RefreshCw className="h-4 w-4 mr-2" /> Refresh Insight</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Insight</>}
        </Button>
      </CardFooter>
    </Card>
  );
}
