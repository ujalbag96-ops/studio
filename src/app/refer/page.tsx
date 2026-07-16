
'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, query, collection, where } from 'firebase/firestore';
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
  Award
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/app/lib/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function ReferPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  
  const invitesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), where('referredBy', '==', user.uid));
  }, [firestore, user]);

  const { data: profile } = useDoc<UserProfile>(userProfileRef);
  const { data: invitedUsers } = useCollection<UserProfile>(invitesQuery);

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

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <section className="relative overflow-hidden rounded-[3rem] bg-[#0a0a0f] border border-white/5 p-8 md:p-16 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <Badge className="bg-primary/20 text-primary uppercase font-black px-4 py-1 tracking-widest text-[10px]">REWARD MILESTONES ACTIVE</Badge>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none text-white">
              Share <br />
              <span className="text-primary">& Unlock</span>
            </h1>
            
            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
              {/* Progress Tracker */}
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

      <div className="space-y-6">
         <h3 className="text-2xl font-black uppercase italic tracking-tighter">My <span className="text-primary">Network</span></h3>
         <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="divide-y divide-white/5">
               {invitedUsers?.map((u) => (
                 <div key={u.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary">
                          {u.email?.[0] || 'U'}
                       </div>
                       <div>
                          <p className="text-sm font-black text-white">{u.email?.split('@')[0] || 'Warrior'}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{u.country || 'India'}</p>
                       </div>
                    </div>
                    <Badge className={cn("text-[9px] font-black uppercase px-3", u.isSuspended ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                       {u.isSuspended ? 'PENDING AUDIT' : 'ACTIVE'}
                    </Badge>
                 </div>
               ))}
               {(!invitedUsers || invitedUsers.length === 0) && (
                 <div className="p-20 text-center space-y-4">
                    <Users className="h-12 w-12 text-muted-foreground opacity-10 mx-auto" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Network is currently empty.</p>
                 </div>
               )}
            </div>
         </Card>
      </div>
    </div>
  );
}
