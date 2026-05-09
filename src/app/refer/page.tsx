'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  Users, 
  Copy, 
  Share2, 
  Gift, 
  Zap, 
  Loader2,
  Trophy,
  Crown,
  CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, AppSettings } from '@/app/lib/types';
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
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);

  const { data: profile } = useDoc<UserProfile>(userProfileRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  // Fallback for missing referral code
  useEffect(() => {
    if (profile && !profile.referralCode && userProfileRef) {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      setDoc(userProfileRef, { referralCode: newCode }, { merge: true });
    }
  }, [profile, userProfileRef]);

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/login?ref=${profile?.referralCode || ''}` 
    : '';

  const copyToClipboard = async () => {
    if (!profile?.referralCode) {
      toast({ variant: "destructive", title: "Please wait", description: "Loading your code..." });
      return;
    }
    
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({ title: "Link Copied!", description: "Share it with your friends." });
    } catch (err) {
      toast({ variant: "destructive", title: "Copy Failed" });
    } finally {
      setTimeout(() => setIsCopying(false), 2000);
    }
  };

  const handleShare = () => {
    if (!profile?.referralCode) return;
    const shareText = `Play games and win real cash! Join using my link: ${referralLink}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Refer & Earn',
        text: shareText,
        url: referralLink,
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
            <Badge className="bg-primary/20 text-primary uppercase font-black px-4 py-1 tracking-widest text-[10px]">REFER & EARN</Badge>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none">
              Invite <br />
              <span className="text-primary">& Earn</span>
            </h1>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-md mx-auto lg:mx-0">
              Invite your friends and earn <span className="text-white font-black">{reward} Coins</span> on every successful sign-up!
            </p>
            
            <Card className="bg-white/5 border-white/10 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-3xl shadow-2xl">
              <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Your Referral Code</p>
                 <div className="flex items-center gap-4">
                    <div className="flex-1 bg-black/60 border border-white/10 h-16 rounded-2xl flex items-center justify-center text-3xl font-black tracking-[0.2em] text-primary uppercase">
                       {profile?.referralCode || '...'}
                    </div>
                    <Button onClick={copyToClipboard} size="icon" className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary/20 transition-all">
                       {isCopying ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <Copy className="h-6 w-6" />}
                    </Button>
                 </div>
              </div>
              <Button onClick={handleShare} className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl font-black text-lg uppercase italic shadow-2xl">
                 <Share2 className="h-5 w-5 mr-3" /> SHARE ON WHATSAPP
              </Button>
            </Card>
          </div>

          <div className="hidden lg:flex flex-col gap-6">
             <Step icon={<Zap />} num="01" title="Share Link" desc="Send your link to friends." />
             <Step icon={<Users />} num="02" title="Friend Joins" desc="They sign up using your link." />
             <Step icon={<Gift />} num="03" title="Get Rewards" desc={`You instantly get ${reward} coins!`} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <StatsCard title="Total Invites" value="0" icon={<Users />} />
         <StatsCard title="Total Earned" value="0 Coins" icon={<Trophy />} />
         <StatsCard title="Referral Status" value="Active" icon={<Crown />} />
      </div>
    </div>
  );
}

function Step({ icon, num, title, desc }: any) {
  return (
    <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-white/5 border border-white/5 group hover:border-primary/40 transition-all">
       <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20 group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <div className="space-y-1">
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-primary italic">{num}</span>
             <h4 className="text-xl font-black uppercase italic">{title}</h4>
          </div>
          <p className="text-xs text-muted-foreground font-medium">{desc}</p>
       </div>
    </div>
  );
}

function StatsCard({ title, value, icon }: any) {
  return (
    <Card className="bg-[#1a1a1a] border-white/5 rounded-[2.5rem] p-10 flex items-center justify-between group hover:border-primary/20 transition-all shadow-xl">
       <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{title}</p>
          <h4 className="text-3xl font-black italic">{value}</h4>
       </div>
       <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all">
          {icon}
       </div>
    </Card>
  );
}
