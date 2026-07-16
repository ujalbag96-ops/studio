'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Loader2, ArrowLeft, Zap, Lock, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function SubjectMaterialScreen() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [adCountdown, setAdCountdown] = useState(8);
  const [pendingUrl, setPendingUrl] = useState('');

  const dept = params.dept as string;
  const sem = params.sem as string;

  const materialsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'study_materials'), where('department', '==', dept), where('semester', '==', parseInt(sem.replace('sem-', '')))) : null, 
    [firestore, dept, sem]
  );
  
  const { data: materials, isLoading } = useCollection<any>(materialsQuery);

  const handleMaterialClick = (url: string) => {
    setPendingUrl(url);
    setShowInterstitial(true);
    setAdCountdown(8);
    
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

  const proceedToViewer = () => {
    router.push(`/campus/viewer?url=${encodeURIComponent(pendingUrl)}`);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-12 pb-32">
      <div className="flex items-center justify-between">
         <Button variant="ghost" asChild className="text-[10px] font-black uppercase text-muted-foreground hover:text-white">
            <Link href={`/campus/${dept}`}><ArrowLeft className="h-3 w-3 mr-2" /> Back to Semesters</Link>
         </Button>
         <div className="flex gap-2">
            <Badge variant="outline" className="border-white/10 uppercase text-[9px] font-black">{dept}</Badge>
            <Badge className="bg-primary/20 text-primary border-none uppercase text-[9px] font-black">{sem}</Badge>
         </div>
      </div>

      <header className="space-y-4 text-center md:text-left">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-white leading-none">
          Resource <span className="text-primary">Locker</span>
        </h1>
        <p className="text-muted-foreground font-medium text-lg">Curated materials for the industrial student node.</p>
      </header>

      {isLoading ? (
        <div className="py-32 flex justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
      ) : materials && materials.length > 0 ? (
        <div className="grid gap-6">
          {materials.map((m: any) => (
            <Card key={m.id} className="p-8 bg-[#0a0a0f] border-white/5 hover:border-primary/20 transition-all rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 group shadow-xl">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-all shadow-xl">
                   <FileText className="h-8 w-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">{m.title}</h3>
                   <div className="flex gap-3 mt-1">
                      <Badge className="bg-white/5 text-muted-foreground border-none text-[8px] font-black uppercase">{m.type}</Badge>
                      {m.isPremium && <Badge className="bg-amber-500/20 text-amber-500 border-none text-[8px] font-black uppercase italic">Elite Resource</Badge>}
                   </div>
                </div>
              </div>
              <Button 
                onClick={() => handleMaterialClick(m.url)}
                className="w-full md:w-auto h-16 px-10 bg-primary hover:bg-primary/90 font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20"
              >
                OPEN RESOURCE <Download className="ml-3 h-5 w-5" />
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-40 text-center space-y-6 border-2 border-dashed border-white/5 rounded-[3rem]">
           <FileText className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
           <p className="text-muted-foreground italic font-black uppercase tracking-[0.4em]">Resource Cache is Empty</p>
        </div>
      )}

      {/* INTERSTITIAL AD MODAL SIMULATION */}
      {showInterstitial && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500">
           <Card className="max-w-md w-full bg-[#0d0d12] border-primary/20 border-2 rounded-[3rem] overflow-hidden relative shadow-[0_0_100px_rgba(99,102,241,0.2)]">
              <div className="p-12 text-center space-y-10">
                 <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                    <div 
                      className="absolute inset-0 rounded-full border-t-4 border-primary transition-all duration-1000 ease-linear" 
                      style={{ transform: `rotate(${(8 - adCountdown) * 45}deg)` }}
                    />
                    <Zap className="h-12 w-12 text-primary animate-pulse" />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Initializing <span className="text-primary">Resource...</span></h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                       Sponsor signal analysis in progress. Access granted after decryption protocol.
                    </p>
                 </div>

                 <div className="space-y-6">
                    <p className="text-5xl font-black text-white italic tabular-nums">{adCountdown}s</p>
                    <Button 
                      disabled={adCountdown > 0} 
                      onClick={proceedToViewer}
                      className={cn(
                        "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                        adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce" : "bg-white/5 text-white/20 border border-white/10"
                      )}
                    >
                       {adCountdown === 0 ? "ACCESS GRANTED" : "VERIFYING SIGNAL..."}
                    </Button>
                 </div>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}