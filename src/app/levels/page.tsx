
'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { 
  Trophy, 
  Zap, 
  Gift, 
  Loader2,
  PlayCircle,
  X,
  Badge
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, AppSettings } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function LevelsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);
  const [pendingReward, setPendingReward] = useState<{ id: string, amount: number } | null>(null);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  
  const { data: profile } = useDoc<UserProfile>(userRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  useEffect(() => {
    let timer: any;
    if (showAd && adCountdown > 0) {
      timer = setInterval(() => setAdCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showAd, adCountdown]);

  const initiateClaim = (id: string, amount: number) => {
    if (!user) return;
    setPendingReward({ id, amount });
    setShowAd(true);
    setAdCountdown(10);
  };

  const handleClaimFinalize = async () => {
    if (!user || !firestore || !pendingReward || adCountdown > 0) return;

    setIsClaiming(pendingReward.id);
    try {
      await updateDoc(doc(firestore, 'users', user.uid), {
        coins: increment(pendingReward.amount),
        bonusBalance: increment(pendingReward.amount)
      });

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'income',
        amount: pendingReward.amount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Level Reward: ${pendingReward.id}`
      });

      if (settings?.globalRewardSoundUrl) {
        const audio = new Audio(settings.globalRewardSoundUrl);
        audio.play().catch(() => {});
      }
      
      toast({ title: "REWARD DEPLOYED" });
      setShowAd(false);
      setPendingReward(null);
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILURE" });
    } finally {
      setIsClaiming(null);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 shadow-2xl p-8 md:p-16">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-white">Arena <span className="text-primary">Levels</span></h1>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <LevelRewardCard title="Starter Pack" value="10.00" icon={<Zap />} onClaim={() => initiateClaim('Starter', 10)} />
        <LevelRewardCard title="Veteran Drop" value="25.00" icon={<Trophy />} onClaim={() => initiateClaim('Veteran', 25)} />
        <LevelRewardCard title="Elite Bounty" value="50.00" icon={<Gift />} onClaim={() => initiateClaim('Elite', 50)} />
      </div>

      {showAd && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="max-w-md w-full text-center space-y-10">
              <p className="text-6xl font-black text-white italic tabular-nums">{adCountdown}s</p>
              <Button disabled={adCountdown > 0 || !!isClaiming} onClick={handleClaimFinalize} className="w-full h-20 rounded-2xl font-black text-xl uppercase italic bg-primary shadow-xl">
                 {isClaiming ? <Loader2 className="animate-spin" /> : adCountdown === 0 ? "CLAIM ASSET" : "SYNCING..."}
              </Button>
           </div>
        </div>
      )}
    </div>
  );
}

function LevelRewardCard({ title, value, icon, onClaim }: any) {
  return (
    <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[400px] shadow-2xl group overflow-hidden">
      <div className="space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-xl">{icon}</div>
        <h3 className="text-2xl font-black uppercase italic text-white">{title}</h3>
      </div>
      <div className="space-y-6">
        <p className="text-6xl font-black tracking-tighter text-white italic">{value} 🪙</p>
        <Button onClick={onClaim} className="w-full bg-white/5 hover:bg-primary border border-white/10 text-white font-black uppercase h-16 rounded-2xl">CLAIM</Button>
      </div>
    </Card>
  );
}
