
'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, query, collection, where, orderBy, limit } from 'firebase/firestore';
import { 
  Users, 
  Copy, 
  Share2, 
  Zap, 
  Loader2,
  Trophy,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Award,
  Network,
  Activity,
  History,
  Info,
  Crown,
  Star,
  Flame,
  Layout,
  Coins,
  Globe
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/app/lib/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ViralLeaderboard from '@/components/ViralLeaderboard';

export default function ReferPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'invite' | 'network'>('invite');

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  
  const l1Query = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), where('referredBy', '==', user.uid), limit(50));
  }, [firestore, user]);

  const l2Query = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), where('referredByL2', '==', user.uid), limit(50));
  }, [firestore, user]);

  const { data: profile } = useDoc<UserProfile>(userProfileRef);
  const { data: level1Users, isLoading: l1Loading } = useCollection<UserProfile>(l1Query);
  const { data: level2Users, isLoading: l2Loading } = useCollection<UserProfile>(l2Query);

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/login?ref=${profile?.referralCode || ''}` 
    : '';

  const totalShares = profile?.totalPagesShared || 0;
  const totalNetwork = (level1Users?.length || 0) + (level2Users?.length || 0);
  
  // Milestone Definitions
  const milestones = [
    { count: 10, reward: 10, name: 'Bronze' },
    { count: 25, reward: 25, name: 'Silver' },
    { count: 50, reward: 50, name: 'Gold' },
    { count: 100, reward: 100, name: 'Elite' }
  ];

  const nextMilestone = milestones.find(m => totalShares < m.count) || milestones[milestones.length - 1];
  const progress = Math.min((totalShares / nextMilestone.count) * 100, 100);

  const handleShare = async () => {
    if (!profile?.referralCode) return;
    const shareText = `Play & Learn! Get free notes and earn scholarship rewards on Bracket Battles. Join using my link: ${referralLink}`;
    
    if (navigator.share) {
      await navigator.share({ title: 'Bracket Battles', text: shareText, url: referralLink }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(referralLink);
      toast({ title: "Link Copied!" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="space-y-6 pt-12 text-center md:text-left">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-4">
               <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Globe className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Global Warrior Recruitment Node</span>
               </div>
               <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">Refer <span className="text-primary">& Earn</span></h1>
               <p className="text-muted-foreground font-medium text-lg max-w-2xl">
                  Build an industrial network of students. Earn 30% combined commission (L1 + L2) from every mission your team completes.
               </p>
            </div>
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 max-w-sm">
               <button onClick={() => setActiveTab('invite')} className={cn("px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'invite' ? "bg-primary text-white" : "text-muted-foreground hover:text-white")}>Invite Hub</button>
               <button onClick={() => setActiveTab('network')} className={cn("px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'network' ? "bg-primary text-white" : "text-muted-foreground hover:text-white")}>My Team</button>
            </div>
         </div>
      </header>

      {activeTab === 'invite' ? (
        <div className="grid lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 space-y-10">
              <section className="relative overflow-hidden rounded-[3rem] bg-[#0a0a0f] border border-white/5 p-8 md:p-12 shadow-2xl animate-in fade-in duration-700">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48" />
                
                <div className="relative z-10 space-y-8">
                  <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-8">
                     <div className="space-y-3 text-center">
                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">My Personal Access Signal</p>
                        <div className="flex items-center justify-between gap-4">
                           <div className="flex-1 bg-black/60 border border-white/10 h-20 rounded-2xl flex items-center justify-center text-4xl font-black tracking-[0.2em] text-primary uppercase shadow-inner">
                              {profile?.referralCode || '...'}
                           </div>
                           <Button onClick={() => { navigator.clipboard.writeText(referralLink); toast({ title: "Copied!" }); }} size="icon" className="h-20 w-20 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary/20 transition-all text-white">
                              <Copy className="h-8 w-8" />
                           </Button>
                        </div>
                     </div>
                     
                     <Button onClick={handleShare} className="w-full h-20 bg-primary hover:bg-primary/90 rounded-2xl font-black text-2xl uppercase italic shadow-2xl shadow-primary/20">
                        <Share2 className="h-6 w-6 mr-4" /> BROADCAST INVITE
                     </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center space-y-1">
                        <p className="text-[8px] font-black text-muted-foreground uppercase">Direct (L1)</p>
                        <p className="text-xl font-black text-white italic">{level1Users?.length || 0}</p>
                     </div>
                     <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center space-y-1">
                        <p className="text-[8px] font-black text-muted-foreground uppercase">Indirect (L2)</p>
                        <p className="text-xl font-black text-white italic">{level2Users?.length || 0}</p>
                     </div>
                     <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center space-y-1">
                        <p className="text-[8px] font-black text-muted-foreground uppercase">Rate L1</p>
                        <p className="text-xl font-black text-green-500 italic">20%</p>
                     </div>
                     <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center space-y-1">
                        <p className="text-[8px] font-black text-muted-foreground uppercase">Rate L2</p>
                        <p className="text-xl font-black text-green-500 italic">10%</p>
                     </div>
                  </div>
                </div>
              </section>

              <Card className="bg-[#121212] border-white/5 p-10 rounded-[3rem] space-y-8">
                 <h3 className="text-2xl font-black uppercase italic flex items-center gap-4"><Info className="text-primary" /> Operational Briefing</h3>
                 <div className="space-y-6">
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase tracking-tight">
                       Every time your recruit completes a mission, video analysis, or quiz, the industrial settlement engine calculates your shared commission and credits it instantly. 
                    </p>
                    <div className="grid gap-4">
                       <BenefitItem icon={<Coins />} text="Direct 20% Joining Bonus" />
                       <BenefitItem icon={<Activity />} text="30% Lifetime Mission Share" />
                       <BenefitItem icon={<ShieldCheck />} text="Anti-Fraud Integrity Shield" />
                    </div>
                 </div>
              </Card>
           </div>

           <div className="space-y-10">
              <ViralLeaderboard />
              <Card className="bg-primary/5 border-primary/20 p-10 rounded-[3rem] text-center space-y-6">
                 <Crown className="h-12 w-12 text-primary mx-auto animate-bounce" />
                 <div className="space-y-2">
                    <h4 className="text-xl font-black uppercase italic">Elite Affiliate Status</h4>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                       Recruit 50 active students to unlock VIP 7 status and +5% priority commission.
                    </p>
                 </div>
                 <Button variant="outline" className="w-full border-white/10 h-12 rounded-xl text-[10px] font-black uppercase">Check Eligibility</Button>
              </Card>
           </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <NetworkCard label="Total Network" value={totalNetwork} icon={<Users />} color="primary" />
              <NetworkCard label="Active Downline" value={level1Users?.filter(u => !u.isSuspended).length || 0} icon={<Activity />} color="green" />
              <NetworkCard label="Recruitment Yield" value={(profile?.referralCommissionBalance || 0).toLocaleString()} icon={<Zap />} color="amber" unit="🪙" />
           </div>

           <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6">
                 <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <Tabs defaultValue="l1">
                       <TabsList className="grid grid-cols-2 bg-white/5 p-1 rounded-none border-b border-white/5 h-14">
                          <TabsTrigger value="l1" className="font-black text-[10px] uppercase data-[state=active]:bg-primary">Level 1 (Direct)</TabsTrigger>
                          <TabsTrigger value="l2" className="font-black text-[10px] uppercase data-[state=active]:bg-primary">Level 2 (Indirect)</TabsTrigger>
                       </TabsList>
                       <TabsContent value="l1" className="mt-0">
                          <DownlineList users={level1Users} loading={l1Loading} level={1} />
                       </TabsContent>
                       <TabsContent value="l2" className="mt-0">
                          <DownlineList users={level2Users} loading={l2Loading} level={2} />
                       </TabsContent>
                    </Tabs>
                 </Card>
              </div>

              <div className="space-y-6">
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter">Growth <span className="text-primary">Node</span></h3>
                 <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center space-y-6">
                    <TrendingUp className="h-16 w-16 text-primary animate-pulse" />
                    <div className="space-y-2">
                       <h4 className="text-xl font-black uppercase italic">Network Scaling</h4>
                       <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed">
                          Your network is expanding at a factor of 1.4x this week. Keep broadcasting the signal.
                       </p>
                    </div>
                 </Card>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function BenefitItem({ icon, text }: any) {
   return (
      <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary/40 transition-all">
         <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            {icon}
         </div>
         <span className="text-[10px] font-black uppercase text-white tracking-widest">{text}</span>
      </div>
   );
}

function NetworkCard({ label, value, icon, color, unit }: any) {
   const colors = {
      primary: "bg-primary/5 border-primary/20 text-primary",
      green: "bg-green-500/5 border-green-500/20 text-green-500",
      amber: "bg-amber-500/5 border-amber-500/20 text-amber-500"
   };

   return (
      <Card className={cn("p-10 rounded-[3rem] border-2 relative overflow-hidden group", colors[color as keyof typeof colors])}>
         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            {icon}
         </div>
         <div className="space-y-4 relative z-10">
            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border", colors[color as keyof typeof colors])}>
               {icon}
            </div>
            <div>
               <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">{label}</p>
               <h4 className="text-4xl font-black italic tracking-tighter text-white">{value} <span className="text-sm opacity-40">{unit}</span></h4>
            </div>
         </div>
      </Card>
   );
}

function DownlineList({ users, loading, level }: any) {
   if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
   if (!users || users.length === 0) return (
      <div className="p-20 text-center space-y-4">
         <Users className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
         <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">Recruitment Signal Empty for Level {level}</p>
      </div>
   );

   return (
      <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto no-scrollbar">
         {users.map((u: any) => (
            <div key={u.id} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all">
               <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary text-xl">
                     {u.email?.[0] || 'U'}
                  </div>
                  <div>
                     <p className="text-sm font-black uppercase text-white truncate max-w-[150px]">{u.email?.split('@')[0] || 'Warrior'}</p>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{u.country || 'Global'}</p>
                  </div>
               </div>
               <div className="text-right space-y-2">
                  <Badge className={cn("text-[8px] font-black uppercase px-3", u.vipLevel > 0 ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary")}>
                     {u.vipLevel > 0 ? `VIP ${u.vipLevel}` : 'INITIATE'}
                  </Badge>
                  <p className="text-[7px] font-bold text-muted-foreground uppercase italic">Enlisted: {new Date(u.joinedAt).toLocaleDateString()}</p>
               </div>
            </div>
         ))}
      </div>
   );
}
