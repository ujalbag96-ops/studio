
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  Zap, 
  Trophy, 
  Globe, 
  GraduationCap, 
  Video, 
  Gamepad2, 
  Users, 
  Target, 
  Lock, 
  Coins, 
  ArrowRight,
  Layout,
  Star
} from 'lucide-react';
import Link from 'next/link';

export default function PlatformOverview() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-16 pb-32">
      <header className="space-y-6 pt-12 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-xl">
          <Star className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Official Industrial Category: Education & Productivity</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white">Platform <span className="text-primary">Intelligence</span></h1>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto leading-relaxed">
          CampusCompanion is a <b>Global Scholar-Reward Utility</b> that bridges the gap between official education and supplemental income through industrial-scale signal verification.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<Gamepad2 />} 
          title="Skill Arcade" 
          desc="50-level progression engine across 3 categories. Zero-wagering, 100% skill-based rewards." 
          badge="PROFITABLE"
        />
        <FeatureCard 
          icon={<Video />} 
          title="Cinema Yield" 
          desc="10-minute cinematic analysis sessions verified by S2S signals for high-yield coin credit." 
          badge="GUARANTEED"
        />
        <FeatureCard 
          icon={<GraduationCap />} 
          title="Study Locker" 
          desc="Global academic materials (NCERT/OSEPA/OpenStax) integrated with AI-powered retention quizzes." 
          badge="EXCLUSIVE"
        />
        <FeatureCard 
          icon={<Globe />} 
          title="Geo-Calibration" 
          desc="Automatic currency switching ($/£/₹) and industrial revenue share logic for global nodes." 
          badge="DYNAMIC"
        />
        <FeatureCard 
          icon={<Lock />} 
          title="Security Shield" 
          desc="VPN/Proxy detection, multi-accounting guard, and VIP 1 mandatory task verification." 
          badge="ENFORCED"
        />
        <FeatureCard 
          icon={<Users />} 
          title="MLM Network" 
          desc="Dual-level commission structure with a 1,000-user Elite Affiliate jackpot system." 
          badge="UNLIMITED"
        />
      </div>

      <section className="bg-primary/5 border border-primary/20 rounded-[3rem] p-10 md:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Zap className="h-64 w-64 text-primary" />
        </div>
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
           <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-black uppercase italic text-white leading-tight">Industry-Standard <br /><span className="text-primary">Revenue Model</span></h2>
              <p className="text-muted-foreground font-medium leading-relaxed">
                We operate as a <b>B2B2C Data Mediation Node</b>. By participating in sponsored educational and entertainment sessions, you generate marketing value which is shared back as supplemental local currency.
              </p>
              <div className="flex flex-wrap gap-4">
                 <Badge className="bg-white/10 text-white border-none font-black px-4 py-2 uppercase text-[10px]">Education Category</Badge>
                 <Badge className="bg-white/10 text-white border-none font-black px-4 py-2 uppercase text-[10px]">Productivity Node</Badge>
                 <Badge className="bg-amber-500 text-black border-none font-black px-4 py-2 uppercase text-[10px]">35% Elite Share</Badge>
              </div>
           </div>
           <div className="space-y-4 bg-black/40 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
              <h3 className="text-xl font-black uppercase italic">Operational Protocol</h3>
              <ul className="space-y-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                 <li className="flex items-start gap-3"><span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> No real money deposit required for base earnings.</li>
                 <li className="flex items-start gap-3"><span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> VIP 1 verification (5 CPA + 5 Ads + 5 Invites) required.</li>
                 <li className="flex items-start gap-3"><span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Anti-Fraud Shield audit before every withdrawal.</li>
              </ul>
           </div>
        </div>
      </section>

      <div className="text-center">
         <Link href="/dashboard" className="inline-flex items-center gap-3 h-20 px-16 bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase italic rounded-2xl shadow-2xl transition-all hover:scale-105">
            ENTER MY PORTFOLIO <ArrowRight className="h-6 w-6" />
         </Link>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, badge }: any) {
  return (
    <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:border-primary/40 transition-all group shadow-2xl">
       <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black uppercase italic text-white">{title}</h3>
            <Badge className="bg-white/5 text-primary border-none text-[8px] font-black uppercase px-2">{badge}</Badge>
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase tracking-tight">{desc}</p>
       </div>
    </Card>
  );
}
