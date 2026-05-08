
'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  Users, 
  Copy, 
  Share2, 
  TrendingUp, 
  Gift, 
  Zap, 
  ShieldCheck, 
  Loader2,
  Trophy,
  Crown,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, AppSettings } from '@/app/lib/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ReferPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);

  const { data: profile } = useDoc<UserProfile>(userProfileRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const copyToClipboard = () => {
    if (!profile?.referralCode) return;
    const shareUrl = `${window.location.origin}/login?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({ title: "Link Copied!", description: "Share it with your squad to earn rewards." });
    }).catch(() => {
      toast({ variant: "destructive", title: "Copy Failed" });
    });
  };

  const handleShare = () => {
    if (!profile?.referralCode) return;
    const shareUrl = `${window.location.origin}/login?ref=${profile.referralCode}`;
    const shareText = `Join me in the Arena! Use my link to enlist in Bracket Battles and start winning rewards: ${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Bracket Battles Enlistment',
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      copyToClipboard();
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  const reward = settings?.referralRewardCoins || 10;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#1a1a1a] to-[#050508] border border-white/5 shadow-2xl p-8 md:p-16">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse" />
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <Badge className="bg-primary/20 text-primary uppercase font-black px-4 py-1 tracking-widest">Protocol: Referral</Badge>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none">
              Refer <br />
              <span className="text-primary">& Earn</span>
            </h1>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-md mx-auto lg:mx-0">
              Enlist your squad to the arena. Earn <span className="text-white font-black">{reward} 🪙</span> for every verified warrior you bring into the battle.
            </p>
            
            <Card className="bg-white/5 border-white/10 rounded-[2rem] p-8 space-y-6 backdrop-blur-3xl">
              <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Your Tactical Code</p>
                 <div className="flex items-center gap-4">
                    <div className="flex-1 bg-black/60 border border-white/10 h-16 rounded-2xl flex items-center justify-center text-3xl font-black tracking-[0.2em] text-primary italic uppercase">
                       {profile?.referralCode || '------'}
                    </div>
                    <Button onClick={copyToClipboard} size="icon" className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10">
                       <Copy className="h-6 w-6" />
                    </Button>
                 </div>
              </div>
              <Button onClick={handleShare} className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl font-black text-lg tracking-widest uppercase italic shadow-2xl shadow-primary/20">
                 <Share2 className="h-5 w-5 mr-3" /> SHARE PROTOCOL
              </Button>
            </Card>
          </div>

          <div className="hidden lg:flex flex-col gap-6">
             <ReferenceStep icon={<Zap />} label="01" title="Share Link" description="Send your referral link to your friends and team members." />
             <ReferenceStep icon={<Users />} label="02" title="They Enlist" description="They register with your code and verify their tactical ID." />
             <ReferenceStep icon={<Gift />} label="03" title="Get Credit" description={`Instantly receive ${reward} coins in your Winning Balance.`} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <StatsCard title="Total Recruits" value="0" icon={<Users />} />
         <StatsCard title="Reward Earnings" value="0 🪙" icon={<Trophy />} />
         <StatsCard title="Bonus Tier" value="Iron Warrior" icon={<Crown />} />
      </div>
    </div>
  );
}

function ReferenceStep({ icon, label, title, description }: any) {
  return (
    <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-white/5 border border-white/5 group hover:border-primary/40 transition-all">
       <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
          {icon}
       </div>
       <div className="space-y-1">
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-primary italic">{label}</span>
             <h4 className="text-xl font-black uppercase tracking-tight">{title}</h4>
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">{description}</p>
       </div>
    </div>
  );
}

function StatsCard({ title, value, icon }: any) {
  return (
    <Card className="bg-[#1a1a1a] border-white/5 rounded-[2.5rem] p-10 flex items-center justify-between group hover:border-primary/20 transition-all shadow-xl">
       <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{title}</p>
          <h4 className="text-3xl font-black italic tracking-tighter">{value}</h4>
       </div>
       <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
       </div>
    </Card>
  );
}
