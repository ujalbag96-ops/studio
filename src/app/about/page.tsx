'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  Zap, 
  Globe, 
  GraduationCap, 
  Video, 
  Gamepad2, 
  ArrowRight,
  Star,
  Briefcase,
  Coins
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function PlatformOverview() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-16 pb-32">
      <header className="space-y-6 pt-12 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-xl">
          <Star className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Official Free Scholarship Protocol v12.0</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">Free <span className="text-primary">Yield</span></h1>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto leading-relaxed uppercase tracking-tight">
          CampusHub is an **Industrial Scholar-Reward Bridge**. We maintain a 100% free-to-earn model where students earn dividends via sponsored missions.
        </p>
      </header>

      {/* REVENUE POLICY SECTION */}
      <section className="space-y-8">
         <div className="flex flex-col items-center text-center space-y-2">
            <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter">Zero <span className="text-primary">Investment</span></h2>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest italic">100% Sponsor-Funded Student Model</p>
         </div>

         <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] space-y-6 shadow-2xl group hover:border-primary/20 transition-all">
               <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xl">
                  <Coins />
               </div>
               <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase italic text-white">Scholarship Payouts</h3>
                  <div className="space-y-3">
                     <RevenueRow label="Student Dividend" percent="30%" color="text-green-500" />
                     <RevenueRow label="System Operations" percent="70%" color="text-white" />
                  </div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic border-t border-white/5 pt-4">
                     *Earnings are 100% free. We never ask for money. 70% retention covers high-bandwidth global server maintenance and API costs.
                  </p>
               </div>
            </Card>

            <Card className="bg-primary/5 border-primary/20 p-10 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5"><Zap className="h-40 w-40 text-primary" /></div>
               <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xl">
                  <GraduationCap />
               </div>
               <div className="space-y-4 relative z-10">
                  <h3 className="text-2xl font-black uppercase italic text-white">Global Access</h3>
                  <div className="space-y-3">
                     <RevenueRow label="Entry Fee" percent="₹0.00" color="text-green-500" />
                     <RevenueRow label="Platform Status" percent="FREE" color="text-primary" />
                  </div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic border-t border-white/5 pt-4">
                     *All study resources and quiz battles are accessible without any deposit. Your hard work and time are the only inputs required.
                  </p>
               </div>
            </Card>
         </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<Gamepad2 />} 
          title="Free Arcade" 
          desc="50-level mastery engine funded by sponsor signals. No deposit, 100% skill-based free yield." 
          badge="ZERO COST"
        />
        <FeatureCard 
          icon={<Video />} 
          title="Bounty Node" 
          desc="Strategic analysis sessions verified by S2S logic for real-time wallet credits. Always free." 
          badge="AUTOMATED"
        />
        <FeatureCard 
          icon={<GraduationCap />} 
          title="Scholar Hub" 
          desc="Global academic repository integrated with industrial system verification rewards for students." 
          badge="CERTIFIED"
        />
      </div>

      <div className="text-center pt-10">
         <Link href="/dashboard" className="inline-flex items-center gap-3 h-20 px-16 bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase italic rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95">
            START MY FREE PORTFOLIO <ArrowRight className="h-6 w-6" />
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
            <h3 className="text-xl font-black uppercase italic text-white leading-tight">{title}</h3>
            <Badge className="bg-white/5 text-primary border-none text-[8px] font-black uppercase px-2">{badge}</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-tight opacity-70">{desc}</p>
       </div>
    </Card>
  );
}

function RevenueRow({ label, percent, color }: any) {
   return (
      <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
         <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</span>
         <span className={cn("text-xl font-black italic", color)}>{percent}</span>
      </div>
   );
}