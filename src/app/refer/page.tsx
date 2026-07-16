
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
  Info
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
    const shareText = `Play & Learn! Get free notes and earn pocket money on CampusCompanion. Join using my link: ${referralLink}`;
    
    if (navigator.share) {
      await navigator.share({ title: 'CampusCompanion', text: shareText, url: referralLink }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(referralLink);
      toast({ title: "Link Copied!" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 max-w-sm mx-auto md:mx-0">
         <button onClick={() => setActiveTab('invite')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'invite' ? "bg-primary text-white" : "text-muted-foreground hover:text-white")}>Invite & Earn</button>
         <button onClick={() => setActiveTab('network')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'network' ? "bg-primary text-white" : "text-muted-foreground hover:text-white")}>My Network</button>
      </div>

      {activeTab === 'invite' ? (
        <>
          <section className="relative overflow-hidden rounded-[3rem] bg-[#0a0a0f] border border-white/5 p-8 md:p-16 shadow-2xl animate-in fade-in duration-700">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48" />
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8 text-center lg:text-left">
                <Badge className="bg-primary/20 text-primary uppercase font-black px-4 py-1 tracking-widest text-[10px]">REWARD MILESTONES ACTIVE</Badge>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none text-white">
                  Share <br />
                  <span className="text-primary">& Unlock</span>
                </h1>
                
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Next Milestone: {nextMilestone.name}</p>
                          <p className="text-2xl font-black text-white italic">{totalShares} / {nextMilestone.count} Shares</p>
                        </div>
                        <Badge className="bg-green-500/10 text-green-500 border-none uppercase font-black text-[9px] px-3 py-1">BONUS: {nextMilestone.reward} 🪙</Badge>
                    </div>
                    <Progress value={progress} className="h-3 bg-white/5" />
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                        {nextMilestone.count - totalShares} more shares for the {nextMilestone.name} reward!
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 bg-black/60 border border-white/10 h-16 rounded-2xl flex items-center justify-center text-3xl font-black tracking-[0.2em] text-primary uppercase">
                        {profile?.referralCode || '...'}
                    </div>
                    <Button onClick={() => { navigator.clipboard.writeText(referralLink); toast({ title: "Copied!" }); }} size="icon" className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary/20 transition-all text-white">
                        <Copy className="h-6 w-6" />
                    </Button>
                  </div>
                  <Button onClick={handleShare} className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl font-black text-lg uppercase italic shadow-2xl">
                    <Share2 className="h-5 w-5 mr-3" /> BROADCAST INVITE
                  </Button>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Award className="text-primary" /> Achievement Tiers</h3>
                <div className="grid gap-4">
                    {milestones.map((m) => (
                      <div key={m.name} className={cn(
                        "p-5 rounded-2xl flex items-center justify-between transition-all",
                        totalShares >= m.count ? "bg-green-500/10 border border-green-500/20" : "bg-white/5 border border-white/5 opacity-40"
                      )}>
                          <div className="flex items-center gap-4">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", totalShares >= m.count ? "text-green-500" : "text-muted-foreground")}>
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase italic">{m.name} Milestone</p>
                                <p className="text-[9px] font-bold uppercase text-muted-foreground">{m.count} Total Shares Required</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-primary">+{m.reward} 🪙</p>
                            {totalShares >= m.count && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto mt-1" />}
                          </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <NetworkCard label="Total Network" value={(profile?.totalNetworkReferrals || 0)} icon={<Users />} color="primary" />
              <NetworkCard label="Active Downline" value={level1Users?.filter(u => !u.isSuspended).length || 0} icon={<Activity />} color="green" />
              <NetworkCard label="Total Team Income" value={(profile?.totalNetworkRevenue || 0).toLocaleString()} icon={<Zap />} color="amber" unit="🪙" />
           </div>

           <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Network <span className="text-primary">Breakdown</span></h3>
                    <Badge variant="outline" className="border-white/10 uppercase text-[9px] font-black py-1.5 px-3">L1: 5% | L2: 2%</Badge>
                 </div>
                 
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
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter">Revenue <span className="text-primary">Policy</span></h3>
                 <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-8 space-y-6">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl">
                       <Info className="h-6 w-6 text-primary" />
                    </div>
                    <ul className="space-y-4">
                       <PolicyItem text="5% Commission on all L1 mission completions" />
                       <PolicyItem text="2% Commission on all L2 mission completions" />
                       <PolicyItem text="Commissions are credited instantly to Winning Balance" />
                       <PolicyItem text="VIP Level 3+ required for L2 payout eligibility" />
                    </ul>
                 </Card>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function DownlineList({ users, loading, level }: any) {
   if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
   if (!users || users.length === 0) return (
      <div className="p-20 text-center space-y-4">
         <Users className="h-12 w-12 text-muted-foreground opacity-10 mx-auto" />
         <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">Sector {level} is empty</p>
      </div>
   );

   return (
      <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto no-scrollbar">
         {users.map((u: any) => (
            <div key={u.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary text-sm">
                     {u.email?.[0] || 'U'}
                  </div>
                  <div>
                     <p className="text-xs font-black uppercase text-white truncate max-w-[120px]">{u.email?.split('@')[0] || 'Warrior'}</p>
                     <p className="text-[8px] font-bold text-muted-foreground uppercase">{u.country || 'Global'}</p>
                  </div>
               </div>
               <div className="text-right space-y-1">
                  <p className="text-xs font-black text-green-500">{u.tasksCompletedCount || 0} Missions</p>
                  <Badge className={cn("text-[7px] font-black uppercase px-2", u.isSuspended ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary")}>
                     {u.isSuspended ? 'PENDING AUDIT' : 'ACTIVE'}
                  </Badge>
               </div>
            </div>
         ))}
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
      <Card className={cn("p-8 rounded-[2.5rem] border-2 relative overflow-hidden group", colors[color as keyof typeof colors])}>
         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            {icon}
         </div>
         <div className="space-y-4 relative z-10">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", colors[color as keyof typeof colors])}>
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

function PolicyItem({ text }: { text: string }) {
   return (
      <li className="flex items-start gap-3">
         <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
         <p className="text-[9px] font-black uppercase text-muted-foreground leading-relaxed tracking-widest">{text}</p>
      </li>
   );
}
