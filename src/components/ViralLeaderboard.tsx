
'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, Users, TrendingUp, Medal, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ViralLeaderboard() {
  // Mock data for viral kings (real-time simulation)
  const networkKings = [
    { id: '1', name: 'Master_Ref', referrals: 42, earnings: '1,200', avatar: 'M' },
    { id: '2', name: 'WinZO_PRO', referrals: 28, earnings: '850', avatar: 'W' },
    { id: '3', name: 'GamingBhai', referrals: 15, earnings: '420', avatar: 'G' },
    { id: '4', name: 'Legendary', referrals: 12, earnings: '310', avatar: 'L' },
    { id: '5', name: 'ReferralKing', referrals: 9, earnings: '220', avatar: 'R' },
  ];

  return (
    <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
       <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Trophy className="h-5 w-5 text-amber-500" />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase italic tracking-widest">Network Kings</h3>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Top Daily Referral Drivers</p>
             </div>
          </div>
          <Badge className="bg-amber-500/20 text-amber-500 border-none font-black text-[8px] px-3 uppercase italic">Live Sync</Badge>
       </div>

       <div className="p-2 divide-y divide-white/5">
          {networkKings.map((king, idx) => (
            <div key={king.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all rounded-2xl group/item">
               <div className="flex items-center gap-4">
                  <div className="relative">
                     <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary text-sm shadow-inner group-hover/item:border-amber-500/40 transition-colors">
                        {king.avatar}
                     </div>
                     {idx === 0 && <Crown className="absolute -top-2 -right-2 h-4 w-4 text-amber-500 drop-shadow-lg" />}
                  </div>
                  <div>
                     <p className="text-xs font-black uppercase text-white truncate max-w-[100px]">{king.name}</p>
                     <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Users className="h-2 w-2" /> {king.referrals} Network
                     </p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-xs font-black text-green-500 tabular-nums">+{king.earnings} 🪙</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Comm Earned</p>
               </div>
            </div>
          ))}
       </div>
    </Card>
  );
}
