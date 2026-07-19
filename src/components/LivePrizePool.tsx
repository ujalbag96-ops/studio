
'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, Users, Zap, TrendingUp, Sparkles } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function LivePrizePool() {
  const firestore = useFirestore();
  const poolRef = useMemoFirebase(() => firestore ? doc(firestore, 'daily_pool', 'config') : null, [firestore]);
  const { data: pool } = useDoc<any>(poolRef);

  const participants = pool?.total_participants || 0;
  // Calculation: ₹(total_participants * 10 * 0.8)
  const bountyPool = participants * 10 * 0.8;

  const mockWinners = [
    { name: "Rahul_G", amount: 240 },
    { name: "MasterNode_99", amount: 500 },
    { name: "GamerPro_22", amount: 180 },
    { name: "Skill_Strike", amount: 350 }
  ];

  return (
    <div className="w-full space-y-6">
       <Card className="bg-gradient-to-br from-amber-600/20 to-black border-amber-500/30 rounded-[2.5rem] p-10 overflow-hidden relative shadow-[0_0_50px_rgba(245,158,11,0.15)] group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
             <Trophy className="h-40 w-48 text-amber-500" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3">
                   <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Zap className="h-5 w-5 text-amber-500 animate-pulse" />
                   </div>
                   <h3 className="text-xl font-black uppercase italic tracking-widest text-white">Daily Skill Bounty</h3>
                </div>
                <div>
                   <p className="text-6xl md:text-8xl font-black text-amber-500 italic tracking-tighter drop-shadow-lg">
                      ₹{bountyPool.toFixed(0)}
                   </p>
                   <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] mt-2">Operational Integrity Active</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <StatBox label="Active Peers" value={participants} icon={<Users />} />
                <StatBox label="Settle In" value="Midnight" icon={<Sparkles />} />
             </div>
          </div>

          {/* Running Marquee Effect */}
          <div className="mt-10 bg-black/40 border-y border-white/5 py-4 -mx-10 relative overflow-hidden">
             <div className="flex animate-marquee whitespace-nowrap gap-20">
                {Array(4).fill(0).map((_, i) => (
                   <div key={i} className="flex gap-20">
                      {mockWinners.map((winner, idx) => (
                         <div key={idx} className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                               Recent Credit: <span className="text-white italic">{winner.name}</span> earned <span className="text-green-500">₹{winner.amount}</span>
                            </span>
                         </div>
                      ))}
                   </div>
                ))}
             </div>
          </div>
       </Card>

       <style jsx global>{`
          @keyframes marquee {
             0% { transform: translateX(0); }
             100% { transform: translateX(-50%); }
          }
          .animate-marquee {
             animation: marquee 30s linear infinite;
             display: flex;
             width: max-content;
          }
       `}</style>
    </div>
  );
}

function StatBox({ label, value, icon }: any) {
  return (
    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl text-center space-y-1">
       <div className="h-8 w-8 rounded-lg bg-white/5 mx-auto flex items-center justify-center text-amber-500/60 mb-2">{icon}</div>
       <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
       <p className="text-xl font-black text-white italic">{value}</p>
    </div>
  );
}
