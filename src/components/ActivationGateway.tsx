
'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ShieldAlert, Zap, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

interface ActivationGatewayProps {
  tasksCompleted: number;
  isActivated: boolean;
}

export default function ActivationGateway({ tasksCompleted, isActivated }: ActivationGatewayProps) {
  if (isActivated) return (
    <Card className="bg-green-500/5 border-green-500/20 border-2 rounded-[2rem] p-8 md:p-10 relative overflow-hidden group shadow-2xl animate-in slide-in-from-top-4 duration-700">
       <div className="relative z-10 flex items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
             <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <div>
             <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Account Activated</h3>
             <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Full platform features & instant withdrawals unlocked.</p>
          </div>
       </div>
    </Card>
  );

  const activationGoal = 10;
  const progress = Math.min((tasksCompleted / activationGoal) * 100, 100);

  return (
    <Card className="bg-red-500/5 border-red-500/20 border-2 rounded-[2rem] p-8 md:p-10 relative overflow-hidden group shadow-2xl animate-in slide-in-from-top-4 duration-700">
       <div className="absolute top-0 right-0 p-8 opacity-5">
          <Lock className="h-40 w-48 text-red-500" />
       </div>
       
       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-6 flex-1 text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                   <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Activation Challenge</h3>
             </div>
             
             <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-lg">
                Unlock full platform features and instant withdrawals. You must complete <span className="text-white font-bold">{activationGoal} CPA App Tasks</span> to verify your industrial integrity.
             </p>

             <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                   <span className="text-muted-foreground">Verification Progress</span>
                   <span className="text-red-400">Missions: {tasksCompleted}/{activationGoal}</span>
                </div>
                <Progress value={progress} className="h-3 bg-white/5" />
             </div>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-3">
             <Button asChild className="h-16 px-10 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase italic text-lg shadow-xl shadow-red-600/20 transition-all hover:scale-105">
                <Link href="/earning-hub">COMPLETE MISSIONS <Zap className="ml-2 h-5 w-5 fill-white" /></Link>
             </Button>
             <p className="text-[9px] font-bold text-muted-foreground text-center uppercase tracking-widest italic">Verification via Tasks Required</p>
          </div>
       </div>
    </Card>
  );
}
