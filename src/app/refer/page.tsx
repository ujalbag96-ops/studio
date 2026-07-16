
'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, query, collection, where } from 'firebase/firestore';
import { 
  Users, 
  Copy, 
  Share2, 
  Gift, 
  Zap, 
  Loader2,
  Trophy,
  Crown,
  CheckCircle2,
  BarChart3,
  Mail,
  Smartphone
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/app/lib/types';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

export default function ReferPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);

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
            <Badge className="bg-primary/20 text-primary uppercase font-black px-4 py-1 tracking-widest text-[10px]">VIRAL HUB</Badge>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none text-white">
              Invite <br />
              <span className="text-primary">& Prosper</span>
            </h1>
            
            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
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

          <div className="space-y-6">
             <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><BarChart3 className="text-primary" /> Invite Stats</h3>
             <div className="grid grid-cols-2 gap-4">
                <StatsMiniCard label="Total Shares" value={profile?.totalPagesShared || 0} icon={<Share2 />} />
                <StatsMiniCard label="Share Earnings" value={`${profile?.shareRewardsEarned || 0} 🪙`} icon={<Zap />} />
                <StatsMiniCard label="Active Refs" value={invitedUsers?.length || 0} icon={<Users />} />
                <StatsMiniCard label="Total Ref Earned" value="0 🪙" icon={<Trophy />} />
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

function StatsMiniCard({ label, value, icon }: any) {
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-3">
       <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">{icon}</div>
       <div>
          <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
          <p className="text-lg font-black text-white italic">{value}</p>
       </div>
    </div>
  );
}
