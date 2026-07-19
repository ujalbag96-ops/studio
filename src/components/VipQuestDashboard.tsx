
'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Circle, Smartphone, Users, Zap, Info, ArrowRight, Trophy, Lock, Video } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserProfile } from '@/app/lib/types';
import { cn } from '@/lib/utils';

interface QuestProps {
  profile: UserProfile;
}

export default function VipQuestDashboard({ profile }: QuestProps) {
  const requirements = {
    cpa: 5,
    ads: 5,
    referrals: 5
  };

  const currentCpa = profile.cpaTasksCount || 0;
  const currentAds = profile.generalTasksCount || 0;
  const currentRefs = profile.totalReferrals || 0;

  const totalTasks = currentCpa + currentAds + currentRefs;
  const targetTasks = requirements.cpa + requirements.ads + requirements.referrals;
  const overallProgress = Math.min((totalTasks / targetTasks) * 100, 100);

  return (
    <Card className="bg-[#0a0a0f] border-primary/20 border-2 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <Trophy className="h-48 w-48 text-primary" />
      </div>

      <div className="relative z-10 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1 text-[9px] tracking-widest">VIP 1 UNLOCK QUEST</Badge>
               <span className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1.5 animate-pulse">
                  <Zap className="h-3 w-3 fill-amber-500" /> MISSION ACTIVE
               </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">Elite Access <span className="text-primary">Protocol</span></h2>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-tight">"Complete 10 Tasks & 5 Invites to unlock Payout"</p>
          </div>
          
          <div className="bg-black/40 border border-white/10 p-6 rounded-3xl text-center min-w-[160px]">
             <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Quest Progress</p>
             <p className="text-4xl font-black text-white italic">{totalTasks}<span className="text-lg opacity-40">/{targetTasks}</span></p>
             <Progress value={overallProgress} className="h-1.5 mt-4 bg-white/5" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <QuestItem 
             icon={<Smartphone className="text-primary" />} 
             title="CPA Missions" 
             current={currentCpa} 
             target={requirements.cpa} 
             desc="Install & verify 5 sponsored apps."
             href="/earning-hub"
           />
           <QuestItem 
             icon={<Video className="text-amber-500" />} 
             title="Video Signals" 
             current={currentAds} 
             target={requirements.ads} 
             desc="Watch 5 sponsored video ads."
             href="/earning-hub"
           />
           <QuestItem 
             icon={<Users className="text-green-500" />} 
             title="Warriors Recruited" 
             current={currentRefs} 
             target={requirements.referrals} 
             desc="Invite 5 students using your link."
             href="/refer"
           />
        </div>

        <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                 <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest">
                 VIP 1 verifies your industrial integrity. Once unlocked, the Anti-Fraud Shield will perform a final audit of your task completion history before your first withdrawal.
              </p>
           </div>
           <Button asChild className="bg-white text-black hover:bg-white/90 font-black uppercase italic rounded-xl px-8 h-12 shadow-xl">
              <Link href="/earning-hub">GO TO HUB <ArrowRight className="ml-2 h-4 w-4" /></Link>
           </Button>
        </div>
      </div>
    </Card>
  );
}

function QuestItem({ icon, title, current, target, desc, href }: any) {
  const isDone = current >= target;
  
  return (
    <div className={cn(
      "p-8 rounded-[2rem] border-2 transition-all relative group",
      isDone ? "bg-green-500/5 border-green-500/20" : "bg-white/5 border-white/5 hover:border-primary/20"
    )}>
       <div className="flex justify-between items-start mb-6">
          <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
             {icon}
          </div>
          {isDone ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <Circle className="h-6 w-6 text-muted-foreground opacity-20" />}
       </div>

       <div className="space-y-2">
          <h4 className="text-lg font-black uppercase italic text-white">{title}</h4>
          <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-tight mb-4">{desc}</p>
          
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
             <span className="text-[9px] font-black uppercase text-muted-foreground">Status</span>
             <span className={cn("text-sm font-black italic", isDone ? "text-green-500" : "text-primary")}>{current} / {target}</span>
          </div>
          
          {!isDone && (
            <Link href={href} className="text-[9px] font-black text-primary uppercase flex items-center gap-1 mt-4 hover:underline">
               Complete Now <ArrowRight className="h-2 w-2" />
            </Link>
          )}
       </div>
    </div>
  );
}
