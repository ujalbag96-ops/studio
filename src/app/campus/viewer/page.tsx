'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ShieldCheck, Zap, AlertTriangle, Eye, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get('url');
  
  const [showSolution, setShowSolution] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);

  const handleRewardedAd = () => {
    setIsProcessing(true);
    setAdCountdown(10);
    const interval = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const confirmReward = () => {
    setShowSolution(true);
    setIsProcessing(false);
  };

  if (!url) return <div className="p-20 text-center">Invalid Resource URL</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 pb-32">
      <div className="flex items-center justify-between">
         <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase text-muted-foreground">
            <ArrowLeft className="h-3 w-3 mr-2" /> Back
         </Button>
         <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-white/10 text-primary font-black uppercase text-[9px] italic">Industrial PDF Viewer v4.1</Badge>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
         </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3 space-y-6">
            <Card className="bg-[#0a0a0f] border-2 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
               <div className="aspect-[3/4] bg-white">
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                    className="w-full h-full border-none"
                    title="Resource Viewer"
                  />
               </div>

               {/* Locked Solution Overlay */}
               {!showSolution && (
                 <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center justify-end p-12 space-y-6 z-10">
                    <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 shadow-2xl">
                       <Lock className="h-8 w-8" />
                    </div>
                    <div className="text-center space-y-2">
                       <h3 className="text-2xl font-black uppercase italic text-white">Full Solution Locked</h3>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Watch industrial ad signal to unlock detailed analysis</p>
                    </div>
                    <Button 
                      onClick={handleRewardedAd}
                      className="h-16 px-10 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase italic rounded-2xl shadow-xl shadow-amber-500/20"
                    >
                       UNLOCK SOLUTIONS (AD) <Zap className="ml-3 h-5 w-5 fill-black" />
                    </Button>
                 </div>
               )}
            </Card>
         </div>

         <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20 p-8 rounded-[2.5rem] space-y-6 shadow-2xl overflow-hidden relative">
               <div className="absolute -top-10 -right-10 opacity-5">
                  <ShieldCheck className="h-40 w-40 text-primary" />
               </div>
               <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary" /> Viewer Intel
               </h3>
               <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest relative z-10">
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Anti-Print Protocol Active</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Dynamic Watermarking</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Industrial PDF Rendering</li>
               </ul>
            </Card>

            <Card className="bg-amber-500/5 border-amber-500/20 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
               <div className="h-12 w-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <AlertTriangle className="h-6 w-6" />
               </div>
               <div className="space-y-2">
                  <h4 className="text-sm font-black uppercase italic text-white">Academic Integrity</h4>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase leading-relaxed">
                     Materials are for educational reference only. Commercial distribution is strictly prohibited under industrial academic policies.
                  </p>
               </div>
            </Card>
         </div>
      </div>

      {/* REWARDED AD MODAL SIMULATION */}
      {isProcessing && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500">
           <Card className="max-w-md w-full bg-[#0d0d12] border-amber-500/20 border-2 rounded-[3rem] overflow-hidden relative shadow-[0_0_100px_rgba(245,158,11,0.2)]">
              <div className="p-12 text-center space-y-10">
                 <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-amber-500/10" />
                    <div 
                      className="absolute inset-0 rounded-full border-t-4 border-amber-500 transition-all duration-1000 ease-linear" 
                      style={{ transform: `rotate(${(10 - adCountdown) * 36}deg)` }}
                    />
                    <Eye className="h-12 w-12 text-amber-500 animate-pulse" />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Decrypting <span className="text-amber-500">Solutions...</span></h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                       Watching sponsor signal to finalize unlock protocol.
                    </p>
                 </div>

                 <div className="space-y-6">
                    <p className="text-5xl font-black text-white italic tabular-nums">{adCountdown}s</p>
                    <Button 
                      disabled={adCountdown > 0} 
                      onClick={confirmReward}
                      className={cn(
                        "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                        adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce" : "bg-white/5 text-white/20 border border-white/10"
                      )}
                    >
                       {adCountdown === 0 ? "CONFIRM UNLOCK" : "WATCHING SIGNAL..."}
                    </Button>
                 </div>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}

export default function PdfViewScreen() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <ViewerContent />
    </Suspense>
  );
}