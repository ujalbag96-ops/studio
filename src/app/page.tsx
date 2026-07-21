'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Zap, 
  Trophy, 
  Globe, 
  Gamepad2, 
  ShieldCheck, 
  Library,
  ShoppingBag,
  GraduationCap,
  Sparkles,
  PlayCircle
} from 'lucide-react';
import Link from 'next/link';
import { UserProfile } from './lib/types';
import { cn } from '@/lib/utils';
import LivePrizePool from '@/components/LivePrizePool';

export default function Home() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const isIndia = profile?.country === 'India' || !profile?.country; 
  
  return (
    <div className="max-w-7xl mx-auto px-8 py-16 space-y-24 pb-40">
      {/* Dynamic Bounty HUD */}
      <section className="animate-in fade-in slide-in-from-top-4 duration-1000">
         <LivePrizePool />
      </section>

      {/* Industrial Hero Section */}
      <section className="relative glass-panel rounded-[4rem] p-12 md:p-24 overflow-hidden flex flex-col items-center text-center space-y-12">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -mr-60 -mt-60" />
        
        <div className="space-y-8 relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center justify-center gap-4">
             <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
               <ShieldCheck className="h-3.5 w-3.5 text-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Standard Integrity Protocol</span>
             </div>
             <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md">
               <Globe className="h-3.5 w-3.5 text-muted-foreground" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{profile?.country || 'Analyzing Signal...'}</span>
             </div>
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.8] text-white uppercase italic">
            Global <br />
            <span className="text-primary">Yield Hub</span>
          </h1>
          
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed uppercase tracking-tight opacity-70">
            Professional student resources and strategic earning missions. Verified via industrial-grade S2S verification.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8">
            <Button asChild size="lg" className="h-20 bg-primary hover:bg-primary/90 text-white font-black px-12 rounded-[2rem] shadow-2xl shadow-primary/20 text-xl uppercase italic transition-all hover:scale-105 active:scale-95">
              <Link href={isIndia ? "/campus" : "/earning-hub"}>
                 {isIndia ? "Access Library" : "Start Missions"}
              </Link>
            </Button>
            <Link href="/dashboard" className="text-xs font-black uppercase tracking-[0.4em] text-white/50 hover:text-primary transition-colors italic flex items-center gap-3">
               My Portfolio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="absolute -bottom-20 opacity-5 pointer-events-none select-none">
           <Zap className="h-96 w-96 text-primary animate-pulse" />
        </div>
      </section>

      {/* Industrial Grid Refactor */}
      <div className="space-y-4">
         <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-black uppercase tracking-[0.4em] text-muted-foreground italic">Platform Sectors</h3>
         </div>
         <div className="grid gap-px bg-white/10 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
            <SectorRow 
              icon={isIndia ? <Library /> : <Zap />} 
              label={isIndia ? "NCERT Resource Node" : "Global Task Node"} 
              desc={isIndia ? "Access Class 1-12 Curriculum" : "High-Performance CPA Signals"} 
              href={isIndia ? "/campus" : "/earning-hub"}
            />
            <SectorRow 
              icon={<Gamepad2 />} 
              label="Skill Arcade Terminal" 
              desc="Gamified Retention Rewards" 
              href="/games"
            />
            <SectorRow 
              icon={<Trophy />} 
              label="Daily Bounty Protocol" 
              desc="Industrial Asset Loot Boxes" 
              href="/dashboard"
            />
            <SectorRow 
              icon={<ShoppingBag />} 
              label="Redemption Shop" 
              desc="Digital Voucher Liquidity" 
              href="/shop"
            />
         </div>
      </div>

      {/* Trust Signals Minimalist */}
      <section className="grid md:grid-cols-3 gap-12 pt-12 border-t border-white/10">
         <TrustBlock icon={<PlayCircle />} title="S2S Verified" desc="Real-time postback signals ensure mission integrity." />
         <TrustBlock icon={<ShieldCheck />} title="Fraud Guard" desc="Identity Gate VPN detection for ecosystem security." />
         <TrustBlock icon={<Zap />} title="Direct Payout" desc="Instant withdrawal terminal for global gateways." />
      </section>
    </div>
  );
}

function SectorRow({ icon, label, desc, href }: any) {
  return (
    <Link href={href} className="group bg-background hover:bg-white/[0.03] transition-all">
       <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-10">
             <div className="h-16 w-16 rounded-[1.5rem] bg-white/[0.05] border border-white/10 flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform duration-500">
                {icon}
             </div>
             <div className="space-y-1">
                <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white group-hover:text-primary transition-colors">{label}</h4>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{desc}</p>
             </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/[0.05] flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
             <ArrowRight className="h-5 w-5 text-primary" />
          </div>
       </div>
    </Link>
  );
}

function TrustBlock({ icon, title, desc }: any) {
  return (
    <div className="space-y-4 group">
       <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-500">
          {icon}
       </div>
       <div className="space-y-2">
          <h5 className="text-xl font-black uppercase italic tracking-tight">{title}</h5>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase tracking-tight opacity-60">{desc}</p>
       </div>
    </div>
  );
}