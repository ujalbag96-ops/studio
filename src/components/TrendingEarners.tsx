
'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, TrendingUp, User, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function TrendingEarners() {
  const trends = [
    { id: '1', name: 'Rahul_7', task: 'CPA Mission', prize: '₹45.00', color: 'text-primary' },
    { id: '2', name: 'EliteNode', task: 'Ludo Win', prize: '₹12.00', color: 'text-green-500' },
    { id: '3', name: 'SambalpurWarrior', task: '7D Streak', prize: '₹50.00', color: 'text-amber-500' },
  ];

  return (
    <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
       <div className="absolute top-0 right-0 p-4 opacity-5">
          <TrendingUp className="h-32 w-32 text-primary" />
       </div>

       <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Trophy className="h-5 w-5 text-primary animate-bounce" />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase italic tracking-widest">Trending Warriors</h3>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Live Platform Activity</p>
             </div>
          </div>
          <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black px-3 uppercase animate-pulse">LIVE SYNC</Badge>
       </div>

       <div className="space-y-4 relative z-10">
          {trends.map((t) => (
             <div key={t.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-primary/40 transition-all">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-xl bg-black/40 flex items-center justify-center text-muted-foreground group-hover:text-primary border border-white/5 transition-colors">
                      <User className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-xs font-black uppercase text-white truncate max-w-[120px]">{t.name}</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">{t.task}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className={cn("text-sm font-black italic", t.color)}>+{t.prize}</p>
                   <div className="flex items-center justify-end gap-1">
                      <Zap className="h-2 w-2 text-primary" />
                      <span className="text-[7px] font-black text-muted-foreground uppercase">Verified</span>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </Card>
  );
}
