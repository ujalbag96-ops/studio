
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flag, Loader2, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';
import { fetchLiveCricketMatches } from '@/lib/cricket-service';
import { CricketMatch } from '@/app/lib/types';
import { cn } from '@/lib/utils';

export default function LiveCricketWidget() {
  const [matches, setMatches] = useState<CricketMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    async function sync() {
      try {
        const data = await fetchLiveCricketMatches();
        setMatches(data);
      } catch (err) {
        console.error("Signal Jammed: Cricket Data Sync Failed");
      } finally {
        setLoading(false);
      }
    }
    sync();
    const interval = setInterval(sync, 60000); // 1 minute industrial refresh
    return () => clearInterval(interval);
  }, []);

  if (loading && matches.length === 0) {
    return (
      <Card className="bg-black/40 border-white/5 h-64 flex items-center justify-center rounded-[2.5rem] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="animate-spin text-primary h-10 w-10" />
           <p className="text-[10px] font-black uppercase text-muted-foreground italic tracking-widest">Intercepting Match Signals...</p>
        </div>
      </Card>
    );
  }

  const match = matches[activeIndex];
  if (!match) return null;

  return (
    <Card className="bg-gradient-to-r from-blue-900/40 to-black border-blue-500/20 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative group shadow-2xl transition-all duration-500 hover:border-blue-500/40">
       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
          <Flag className="h-48 w-48 text-blue-400" />
       </div>
       
       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-8">
             <div className="flex flex-wrap items-center gap-3">
                <div className={cn("h-2.5 w-2.5 rounded-full", match.status === 'live' ? "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-muted")} />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 italic">
                   {match.status === 'live' ? 'Live Industrial Intelligence' : 
                    match.status === 'completed' ? 'Match Archives Settle' : 'Awaiting Match Signal'}
                </span>
                <Badge variant="outline" className="border-blue-500/20 text-[9px] text-blue-300 uppercase font-black px-4 py-1 bg-blue-500/5">{match.series}</Badge>
             </div>

             <div className="flex items-center gap-10 md:gap-16">
                <div className="text-center space-y-4">
                   <div className="h-20 w-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center font-black text-3xl shadow-2xl group-hover:scale-105 transition-transform group-hover:border-blue-500/30">
                      {match.teamA.substring(0, 3).toUpperCase()}
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{match.teamA}</p>
                      <p className="text-sm font-black text-white italic">{match.liveScore?.runsA || '0/0'}</p>
                   </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                   <span className="font-black text-muted-foreground italic text-2xl opacity-20">VS</span>
                   {match.status === 'live' && <Badge className="bg-red-600 animate-pulse text-white text-[8px] font-black px-2">LIVE</Badge>}
                </div>

                <div className="text-center space-y-4">
                   <div className="h-20 w-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center font-black text-3xl shadow-2xl group-hover:scale-105 transition-transform group-hover:border-blue-500/30">
                      {match.teamB.substring(0, 3).toUpperCase()}
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{match.teamB}</p>
                      <p className="text-sm font-black text-white italic">{match.liveScore?.runsB || '0/0'}</p>
                   </div>
                </div>

                {match.status === 'live' && (
                  <div className="hidden xl:block border-l border-white/10 pl-10 space-y-2">
                     <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        <Activity className="h-3 w-3 text-blue-400" /> Active Over
                     </p>
                     <p className="text-3xl font-black text-blue-400 tabular-nums">{match.liveScore?.overs} <span className="text-xs opacity-40 italic">OVS</span></p>
                  </div>
                )}
             </div>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-4">
             <Button asChild className="w-full md:w-72 h-20 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] font-black uppercase italic text-xl shadow-2xl transition-all hover:scale-[1.02] shadow-blue-600/20 active:scale-95">
                <Link href="/cricket">STAKE ON WINNER</Link>
             </Button>
             
             <div className="flex items-center justify-between px-3">
                <div className="flex flex-col">
                   <p className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Match Status</p>
                   <p className="text-[10px] font-black uppercase text-white italic">{match.status === 'completed' ? `Won by ${match.winner}` : `Target: ${match.liveScore?.target || 'N/A'}`}</p>
                </div>
                <button 
                  onClick={() => setActiveIndex((activeIndex + 1) % matches.length)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 h-10 px-4 rounded-xl text-[10px] font-black uppercase text-blue-400 flex items-center gap-2 transition-all"
                >
                  Next Signal <ArrowRight className="h-3 w-3" />
                </button>
             </div>
          </div>
       </div>
    </Card>
  );
}
