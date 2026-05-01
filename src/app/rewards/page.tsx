import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Share2, Users, Coins, CheckCircle2 } from 'lucide-react';

export default function RewardsPage() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="mx-auto h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Gift className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tight">REFER A FRIEND, <span className="text-secondary">EARN COINS</span></h1>
        <p className="text-muted-foreground">Share your passion for competitive gaming. For every friend who enters their first paid tournament, you both get rewarded.</p>
      </div>

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
          <Input defaultValue="BATTLE-X-99" readOnly className="font-mono font-bold text-lg text-center bg-card" />
          <Button className="bg-primary hover:bg-primary/90 font-bold px-6">COPY</Button>
        </CardContent>
        <CardFooter className="justify-center pt-2">
          <p className="text-xs text-muted-foreground italic flex items-center gap-2">
             <CheckCircle2 className="h-3 w-3 text-green-500" />
             Verified accounts only. Terms & Conditions apply.
          </p>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <h2 className="text-xl font-bold">Your Referrals</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y border-t">
              <ReferralItem name="James R." status="Verified" reward="+100 🪙" />
              <ReferralItem name="Sarah K." status="Pending" reward="--" />
              <ReferralItem name="Mike D." status="Verified" reward="+100 🪙" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StepCard({ step, title, description, icon }: { step: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="relative p-6 rounded-2xl bg-card border border-border space-y-4">
      <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-lg">
        {step}
      </div>
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-2">
        {icon}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function ReferralItem({ name, status, reward }: { name: string; status: string; reward: string }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs uppercase">
          {name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="text-sm font-bold">{name}</p>
          <p className="text-[10px] text-muted-foreground uppercase">{status}</p>
        </div>
      </div>
      <span className="font-bold text-primary">{reward}</span>
    </div>
  );
}
