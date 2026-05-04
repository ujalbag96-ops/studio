
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Share2, Users, Coins, CheckCircle2, LayoutDashboard, Loader2, PlayCircle, Sparkles } from 'lucide-react';
import { AppSettings } from '@/app/lib/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function RewardsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const { data: settings, isLoading: isSettingsLoading } = useDoc<AppSettings>(settingsRef);

  const handleWatchVideo = async () => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Login Required", description: "Please sign in to earn rewards." });
      return;
    }

    setIsVideoLoading(true);
    
    // Simulating Video Ad Completion
    // In a real Unity/AppLovin integration, you would trigger their SDK here
    setTimeout(async () => {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

        // 1. Update User Coins
        await updateDoc(userRef, {
          coins: increment(5)
        });

        // 2. Add Ledger Entry
        await addDoc(ledgerRef, {
          type: 'income',
          amount: 5,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: 'Rewarded Video Watch'
        });

        toast({
          title: "Coins Earned!",
          description: "You've received 5 🪙 for watching the video.",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Reward Failed",
          description: "Could not sync rewards. Please try again later.",
        });
      } finally {
        setIsVideoLoading(false);
      }
    }, 3000); // Simulated 3 second video
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12 pb-24">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="mx-auto h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Gift className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tight uppercase">Earn <span className="text-secondary">Free Coins</span></h1>
        <p className="text-muted-foreground">Boost your wallet balance by completing simple tasks. Use your coins to enter pro tournaments and win real cash.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Watch & Earn Section */}
        <Card className="border-2 border-secondary/20 bg-secondary/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PlayCircle className="h-32 w-32 text-secondary" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <PlayCircle className="h-6 w-6" />
              Watch & Earn
            </CardTitle>
            <CardDescription>Watch a short video to earn instant coins.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reward Amount</p>
                <p className="text-2xl font-black text-secondary">5 🪙</p>
              </div>
              <Sparkles className="h-8 w-8 text-secondary animate-pulse" />
            </div>
            <Button 
              onClick={handleWatchVideo} 
              disabled={isVideoLoading} 
              className="w-full bg-secondary text-secondary-foreground font-black h-14 rounded-2xl shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-transform"
            >
              {isVideoLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Streaming Ad...
                </>
              ) : (
                <>WATCH VIDEO NOW</>
              )}
            </Button>
          </CardContent>
          <CardFooter>
            <p className="text-[10px] text-muted-foreground italic">Limit: 50 videos per day.</p>
          </CardFooter>
        </Card>

        {/* Invite Friends Teaser */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Users className="h-6 w-6" />
              Refer Your Squad
            </CardTitle>
            <CardDescription>Get 100 🪙 for every friend you refer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Link</label>
                <div className="flex gap-2">
                  <Input value={`https://bracketbattles.in/ref/${user?.uid?.slice(0, 6) || '---'}`} readOnly className="bg-transparent border-white/10 font-mono text-xs" />
                  <Button size="sm" className="bg-primary font-bold">COPY</Button>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* CPA Lead Offer Wall Section */}
      <section className="space-y-6 pt-12">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-black uppercase tracking-tight">Offer Wall</h2>
        </div>
        <Card className="border-2 border-primary/10 overflow-hidden bg-card/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>High Value Tasks</CardTitle>
            <CardDescription>Complete surveys and app installs for major rewards.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t border-white/5 min-h-[500px] flex items-center justify-center">
            {isSettingsLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Loading Offers...</p>
              </div>
            ) : settings?.cpaLeadUrl ? (
              <iframe 
                src={settings.cpaLeadUrl} 
                className="w-full h-[600px] border-none"
                title="CPA Lead Offer Wall"
              />
            ) : (
              <div className="text-center p-12 space-y-4">
                <LayoutDashboard className="h-16 w-16 text-muted-foreground/20 mx-auto" />
                <p className="text-muted-foreground font-medium">Offer wall is temporarily unavailable.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
