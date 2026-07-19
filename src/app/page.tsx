'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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
  Loader2,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { Tournament, UserProfile } from './lib/types';
import { cn } from '@/lib/utils';
import LivePrizePool from '@/components/LivePrizePool';

export default function Home() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const isIndia = profile?.country === 'India' || !profile?.country; 
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 pb-32">
      {/* Bounty Status Widget */}
      <section className="animate-in fade-in slide-in-from-top-4 duration-1000">
         <LivePrizePool />
      </section>

      {/* Hero Section: Clean & Professional */}
      <section className="grid lg:grid-cols-2 gap-12 items-center bg-card border border-white/5 rounded-[3rem] p-10 md:p-16 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -mr-40 -mt-40" />
        
        <div className="space-y-10 relative z-10">
          <div className="flex flex-wrap gap-4">
             <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20">
               <ShieldCheck className="h-4 w-4 text-primary" />
               <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Zero Investment Node</span>
             </div>
             <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10">
               <Globe className="h-4 w-4 text-muted-foreground" />
               <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{profile?.country || 'Analyzing Location...'}</span>
             </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-white uppercase">
            Industrial <br />
            <span className="text-primary italic">Yield Hub</span>
          </h1>
          
          <p className="text-lg text-muted-foreground font-medium max-w-lg leading-relaxed uppercase tracking-tight">
            The standard platform for student resources and micro-earning missions. Verified via industrial S2S signals.
          </p>
          
          <div className="flex flex-wrap gap-6 pt-4">
            <Button asChild size="lg" className="h-16 bg-primary hover:bg-primary/90 text-white font-bold px-10 rounded-2xl shadow-xl shadow-primary/20 text-lg uppercase transition-all hover:scale-[1.02]">
              <Link href={isIndia ? "/campus" : "/earning-hub"}>
                 {isIndia ? "Access Library" : "Start Missions"}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-16 border-white/10 hover:bg-white/5 text-white font-bold px-10 rounded-2xl text-lg uppercase transition-all">
              <Link href="/dashboard">My Portfolio</Link>
            </Button>
          </div>
        </div>
        
        <div className="hidden lg:flex justify-center relative">
           <div className="relative w-80 h-80 animate-float">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-[80px]" />
              {isIndia ? (
                 <Library className="w-full h-full text-primary opacity-80 drop-shadow-[0_0_40px_rgba(0,122,255,0.4)]" />
              ) : (
                 <ShoppingBag className="w-full h-full text-primary opacity-80 drop-shadow-[0_0_40px_rgba(0,122,255,0.4)]" />
              )}
           </div>
        </div>
      </section>

      {/* Industrial Grid: 16dp spacing ensure */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
         <CategoryCard 
            icon={isIndia ? <Library /> : <Zap />} 
            label={isIndia ? "NCERT Hub" : "Global Tasks"} 
            desc={isIndia ? "Classes 1-12" : "High-Pay CPA"}
            color="hover:border-primary/40"
         />
         <CategoryCard 
            icon={<Gamepad2 />} 
            label="Free Arcade" 
            desc="Skill Rewards"
            color="hover:border-blue-400/40"
         />
         <CategoryCard 
            icon={<Trophy />} 
            label="Daily Bounty" 
            desc="Loot Drops"
            color="hover:border-green-400/40"
         />
         <CategoryCard 
            icon={isIndia ? <GraduationCap /> : <ShoppingBag />} 
            label={isIndia ? "Career Tips" : "Gift Shop"} 
            desc={isIndia ? "UPSC/JEE/NEET" : "Voucher Vault"}
            color="hover:border-purple-400/40"
         />
      </section>

      {/* Trust Signals */}
      <section className="pt-10 grid md:grid-cols-3 gap-8">
         <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <h3 className="text-xl font-bold uppercase italic">S2S Verified</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
              Real-time postback signals ensure every mission is credited instantly.
            </p>
         </div>
         <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
            <h3 className="text-xl font-bold uppercase italic">Fraud Shield</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
              Proprietary VPN and proxy detection node for ecosystem integrity.
            </p>
         </div>
         <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
            <Zap className="h-10 w-10 text-primary" />
            <h3 className="text-xl font-bold uppercase italic">Direct Payout</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
              Instant withdrawal terminal supporting UPI and Global Gateways.
            </p>
         </div>
      </section>
    </div>
  );
}

function CategoryCard({ icon, label, desc, color }: { icon: any, label: string, desc: string, color: string }) {
  return (
    <div className={cn(
      "p-10 rounded-[2.5rem] bg-card border border-white/10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl hover:shadow-black group",
      color
    )}>
       <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-300">
          {icon}
       </div>
       <div className="text-center space-y-1">
          <span className="font-bold uppercase text-[12px] tracking-[0.2em] italic text-white group-hover:text-primary transition-colors">{label}</span>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{desc}</p>
       </div>
    </div>
  );
}