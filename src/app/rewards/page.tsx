
'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Share2, Users, Coins, CheckCircle2, LayoutDashboard, Loader2 } from 'lucide-react';
import { AppSettings } from '@/app/lib/types';

export default function RewardsPage() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const { data: settings, isLoading } = useDoc<AppSettings>(settingsRef);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12 pb-24">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="mx-auto h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Gift className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tight uppercase">Earn <span className="text-secondary">Free Coins</span></h1>
        <p className="text-muted-foreground">Boost your wallet balance by completing simple tasks. Use your coins to enter pro tournaments and win real cash.</p>
      </div>

      {/* CPA Lead Offer Wall Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-black uppercase tracking-tight">Offer Wall</h2>
        </div>
        <Card className="border-2 border-primary/10 overflow-hidden bg-card/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Earn Instant Coins</CardTitle>
            <CardDescription>Install apps, watch videos, or complete surveys to earn coins.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t border-white/5 min-h-[500px] flex items-center justify-center">
            {isLoading ? (
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
          <CardFooter className="bg-black/20 p-4">
             <p className="text-[10px] text-muted-foreground italic text-center w-full">Note: Rewards may take up to 24 hours to reflect in your ledger.</p>
          </CardFooter>
        </Card>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StepCard 
          step="1" 
          title="Share Link" 
          description="Copy your unique referral code and send it to your friends." 
          icon={<Share2 className="text-primary" />} 
        />
        <StepCard 
          step="2" 
          title="They Register" 
          description="Your friends join Bracket Battles using your link or code." 
          icon={<Users className="text-secondary" />} 
        />
        <StepCard 
          step="3" 
          title="Both Get Paid" 
          description="Earn 100 🪙 as soon as they join a paid tournament." 
          icon={<Coins className="text-yellow-500" />} 
        />
      </div>

      <Card className="max-w-xl mx-auto border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
          <CardDescription>Share this code with others to link them to your downline.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input defaultValue="BATTLE-X-99" readOnly className="font-mono font-bold text-lg text-center bg-black/20" />
          <Button className="bg-primary hover:bg-primary/90 font-bold px-6">COPY</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StepCard({ step, title, description, icon }: { step: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="relative p-6 rounded-2xl bg-card border border-white/5 space-y-4 shadow-xl">
      <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-lg">
        {step}
      </div>
      <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
        {icon}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
