'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, ArrowLeft, ShieldCheck, Sparkles, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function ChapterListContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [adCountdown, setAdCountdown] = useState(8);
  const [pendingUrl, setPendingUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const classId = params?.dept as string || 'class-10';
  const subjectId = params?.sem as string || 'maths';

  const chapters = [
    { id: 'ch1', title: 'Chapter 1: Rational Numbers', type: 'PDF Textbook', url: 'https://ncert.nic.in/textbook/pdf/hemh101.pdf', duration: '20 Mins' },
    { id: 'ch2', title: 'Chapter 2: Linear Equations', type: 'PDF Textbook', url: 'https://ncert.nic.in/textbook/pdf/hemh102.pdf', duration: '25 Mins' },
    { id: 'ch3', title: 'Chapter 3: Understanding Quadrilaterals', type: 'PDF Textbook', url: 'https://ncert.nic.in/textbook/pdf/hemh103.pdf', duration: '30 Mins' },
  ];

  useEffect(() => {
    let timer: any;
    if (showInterstitial && adCountdown > 0) {
      timer = setInterval(() => setAdCountdown(p => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showInterstitial, adCountdown]);

  const handleMaterialClick = (url: string) => {
    setPendingUrl(url);
    setShowInterstitial(true);
    setAdCountdown(8);
  };

  const proceedToViewer = async () => {
    if (!user || isSyncing) return;
    setIsSyncing(true);

    try {
      await fetch('/api/ad-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, reward: 10, type: 'lesson_unlock' })
      });
      
      toast({ title: "BOUNTY UNLOCKED", description: "10 Scholar Coins synced to wallet." });
      router.push(`/campus/viewer?url=${encodeURIComponent(pendingUrl)}`);
    } catch (e) {
      toast({ variant: "destructive", title: "SIGNAL FAILURE" });
      setShowInterstitial(false);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-12 pb-32">
      <div className="flex items-center justify-between">
         <Button variant="ghost" asChild className="text-[10px] font-black uppercase text-muted-foreground hover:text-white">
            <Link href={`/campus/${classId}`}><ArrowLeft className="h-3 w-3 mr-2" /> Back to Subjects</Link>
         </Button>
         <div className="flex gap-2">
            <Badge variant="outline" className="border-white/10 uppercase text-[9px] font-black">{classId.replace('class-', 'CLASS ')}</Badge>
            <Badge className="bg-primary/20 text-primary border-none uppercase text-[9px] font-black">{subjectId.toUpperCase()}</Badge>
         </div>
      </div>

      <header className="space-y-4 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-2">
           <Sparkles className="h-3 w-3 text-green-500" />
           <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Scholar Dividend Enabled</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-white leading-none">
          Chapter <span className="text-primary">Stream</span>
        </h1>
        <p className="text-muted-foreground font-medium text-lg uppercase tracking-tight">Complete chapters to trigger the industrial Skill Reward.</p>
      </header>

      <div className="grid gap-6">
        {chapters.map((ch) => (
          <Card key={ch.id} className="p-8 bg-[#0a0a0f] border-white/5 hover:border-primary/20 transition-all rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 group shadow-xl">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all shadow-xl">
                 <FileText className="h-8 w-8" />
              </div>
              <div className="text-left">
                 <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase">SKILL NODE</Badge>
                    <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground font-bold uppercase ml-2"><Clock className="h-2 w-2" /> {ch.duration} Read</div>
                 </div>
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">{ch.title}</h3>
                 <p className="text-[8px] text-primary font-black uppercase tracking-[0.3em] mt-1 italic">+10 Scholar Coins Bounty</p>
              </div>
            </div>
            <Button 
              onClick={() => handleMaterialClick(ch.url)}
              className="w-full md:w-auto h-16 px-10 bg-primary hover:bg-primary/90 font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20"
            >
              INITIALIZE UNLOCK <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        ))}
      </div>

      {showInterstitial && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500">
           <Card className="max-w-md w-full bg-[#0d0d12] border-primary/20 border-2 rounded-[3rem] overflow-hidden relative shadow-2xl">
              <div className="p-12 text-center space-y-10">
                 <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                    <div 
                      className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" 
                      style={{ animationDuration: '3s' }}
                    />
                    <ShieldCheck className="h-12 w-12 text-primary animate-pulse" />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">System <span className="text-primary">Verification</span></h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                       Establishing high-bandwidth signal to Scholar Repository. Resource signal will lock after verification.
                    </p>
                 </div>

                 <div className="space-y-6">
                    <p className="text-5xl font-black text-white italic tabular-nums">{adCountdown}s</p>
                    <Button 
                      disabled={adCountdown > 0 || isSyncing} 
                      onClick={proceedToViewer}
                      className={cn(
                        "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                        adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce shadow-green-500/20" : "bg-white/5 text-white/20 border border-white/10"
                      )}
                    >
                       {isSyncing ? <Loader2 className="animate-spin" /> : adCountdown === 0 ? "CLAIM BOUNTY & READ" : "VERIFYING NODE..."}
                    </Button>
                 </div>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}
