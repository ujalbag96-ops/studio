
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Loader2, 
  Zap, 
  X, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  School,
  Maximize2,
  GraduationCap,
  Camera,
  ShieldCheck,
  Info,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { askHumanTutor, type AskHumanTutorOutput } from '@/ai/flows/ask-human-tutor-flow';
import { UserProfile } from '@/app/lib/types';

type ReaderTheme = 'white' | 'sepia' | 'dark';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const url = searchParams.get('url') || 'https://ncert.nic.in/textbook/pdf/hemh101.pdf';
  
  const [theme, setTheme] = useState<ReaderTheme>('white');
  const [isPageTurning, setIsPageTurning] = useState(false);

  const [showTutor, setShowTutor] = useState(false);
  const [tutorQuery, setTutorQuery] = useState('');
  const [tutorImage, setTutorImage] = useState<string | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorResponse, setTutorResponse] = useState<AskHumanTutorOutput | null>(null);
  const [showAdInter, setShowAdInter] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handlePageTurn = (direction: 'next' | 'prev') => {
    setIsPageTurning(true);
    setTimeout(() => setIsPageTurning(false), 500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTutorImage(reader.result as string);
        toast({ title: "IMAGE SIGNAL CAPTURED" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTutorSubmit = () => {
    if (!tutorQuery.trim() && !tutorImage) return;
    setShowAdInter(true);
    setAdCountdown(10); 
  };

  useEffect(() => {
    let interval: any;
    if (showAdInter && adCountdown > 0) {
      interval = setInterval(() => setAdCountdown(p => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showAdInter, adCountdown]);

  const callTutorAi = async () => {
    if (adCountdown > 0) return;
    setShowAdInter(false);
    setTutorLoading(true);
    setTutorResponse(null);
    try {
      const res = await askHumanTutor({
        query: tutorQuery,
        photoDataUri: tutorImage || undefined,
        context: `Book: ${url}. Region: ${profile?.geo_region}.`,
        preferredLanguage: profile?.preferredLanguage || 'en'
      });
      setTutorResponse(res);
    } catch (e) {
      toast({ variant: "destructive", title: "TUTOR NODE ERROR" });
    } finally {
      setTutorLoading(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      theme === 'white' ? "bg-[#f4f4f5]" : theme === 'sepia' ? "bg-[#f4ecd8]" : "bg-[#09090b]"
    )}>
      {/* DISTRACTION-FREE HEADER */}
      <header className="h-14 border-b border-black/5 bg-background/40 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-[100]">
         <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="h-9 rounded-lg text-[10px] font-black uppercase text-muted-foreground">
               <ArrowLeft className="h-3 w-3 mr-2" /> EXIT
            </Button>
            <div className="h-4 w-px bg-black/10" />
            <h1 className="text-[10px] font-black uppercase text-primary italic truncate max-w-[140px]">SECURE STUDY SIGNAL</h1>
         </div>

         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/5">
               <ThemeButton active={theme === 'white'} color="#ffffff" onClick={() => setTheme('white')} />
               <ThemeButton active={theme === 'sepia'} color="#f4ecd8" onClick={() => setTheme('sepia')} />
               <ThemeButton active={theme === 'dark'} color="#1a1a1a" onClick={() => setTheme('dark')} />
            </div>
         </div>
      </header>

      {/* IMMERSIVE CANVAS */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-12 relative">
         <div className={cn(
           "relative max-w-5xl w-full aspect-[1.4/1] shadow-2xl rounded-lg transition-all duration-700",
           isPageTurning ? "scale-[0.98] blur-sm" : "scale-100 blur-0",
           theme === 'dark' ? "border-white/5" : "border-white"
         )}>
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 bg-gradient-to-r from-transparent via-black/10 to-transparent z-20 pointer-events-none hidden md:block" />
            
            <div className="flex h-full w-full bg-white overflow-hidden rounded-lg">
               <div className={cn(
                 "flex-1 relative hidden md:block",
                 theme === 'white' ? "bg-white" : theme === 'sepia' ? "bg-[#fcf5e5]" : "bg-[#18181b]"
               )}>
                  <div className="absolute inset-0 bg-black/5 opacity-20" />
               </div>

               <div className={cn(
                 "flex-[1.5] relative",
                 theme === 'white' ? "bg-white" : theme === 'sepia' ? "bg-[#fcf5e5]" : "bg-[#18181b]"
               )}>
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} 
                    className={cn(
                      "w-full h-full border-none transition-all",
                      theme === 'dark' && "filter invert-[0.9] grayscale brightness-90"
                    )}
                  />
               </div>
            </div>

            <button onClick={() => handlePageTurn('prev')} className="absolute left-[-20px] top-1/2 -translate-y-1/2 h-20 w-8 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center transition-all">
               <ChevronLeft className="h-6 w-6 text-muted-foreground" />
            </button>
            <button onClick={() => handlePageTurn('next')} className="absolute right-[-20px] top-1/2 -translate-y-1/2 h-20 w-8 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center transition-all">
               <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </button>
         </div>
      </main>

      {/* CLEAN FLOATING TOOLBAR */}
      <div className="fixed bottom-8 inset-x-0 flex justify-center z-[150] px-4 pointer-events-none">
         <Card className="pointer-events-auto bg-black/90 backdrop-blur-xl border-white/10 rounded-2xl h-16 flex items-center px-6 gap-6 shadow-2xl animate-in slide-in-from-bottom-8">
            <button onClick={() => setShowTutor(true)} className="flex items-center gap-3 text-primary hover:text-white transition-all group">
               <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <School className="h-5 w-5" />
               </div>
               <div className="text-left hidden sm:block">
                  <p className="text-[10px] font-black uppercase italic tracking-widest leading-none">AI Tutor</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Sponsored</p>
               </div>
            </button>

            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-6">
               <div className="flex flex-col items-center">
                  <p className="text-[7px] font-black text-muted-foreground uppercase italic">Pulse</p>
                  <div className="flex items-center gap-1.5">
                     <span className="text-sm font-black text-white italic">{profile?.scholarPoints || 0}</span>
                     <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  </div>
               </div>
               <Button className="h-10 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-primary text-white font-black text-[9px] uppercase italic">
                  <BookOpen className="h-3 w-3 mr-2" /> Index
               </Button>
            </div>
         </Card>
      </div>

      {/* NON-INTRUSIVE BOTTOM BANNER */}
      <div className="h-10 bg-black/5 border-t border-black/5 flex items-center justify-center overflow-hidden">
         <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.6em] italic animate-pulse">
            INDUSTRIAL BANNER SLOT v11.0 • SPONSORED CONTENT ZONE
         </p>
      </div>

      {/* TUTOR DIALOG */}
      <Dialog open={showTutor} onOpenChange={setShowTutor}>
        <DialogContent className="bg-[#0a0a0f] border-primary/20 text-white max-w-xl rounded-[2rem] p-8 overflow-hidden shadow-2xl">
           <DialogHeader className="text-center space-y-2">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                 <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Tuition <span className="text-primary">Node</span></DialogTitle>
           </DialogHeader>

           <div className="space-y-6 py-4">
              {tutorResponse ? (
                <div className="space-y-6 animate-in fade-in duration-500 max-h-[350px] overflow-y-auto no-scrollbar">
                   <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-sm text-white font-medium italic">"{tutorResponse.explanation}"</p>
                   </div>
                   {tutorResponse.steps && (
                     <div className="space-y-3">
                        {tutorResponse.steps.map((step, i) => (
                          <div key={i} className="flex gap-4 items-start p-4 bg-black/40 rounded-xl border border-white/5">
                             <span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary italic shrink-0">{i+1}</span>
                             <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">{step}</p>
                          </div>
                        ))}
                     </div>
                   )}
                   <Button onClick={() => { setTutorResponse(null); setTutorQuery(''); }} className="w-full h-14 bg-white/5 border border-white/10 hover:bg-primary rounded-xl font-black uppercase italic text-xs">
                      NEW QUERY
                   </Button>
                </div>
              ) : tutorLoading ? (
                <div className="py-20 flex flex-col items-center gap-6">
                   <Loader2 className="h-12 w-12 animate-spin text-primary" />
                   <p className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">DECRYPTING VISUAL LOGIC...</p>
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="relative">
                      <textarea 
                        value={tutorQuery} 
                        onChange={e => setTutorQuery(e.target.value)} 
                        placeholder="ASK ANY PROBLEM OR UPLOAD PHOTO..."
                        className="w-full h-32 bg-black border border-white/10 rounded-2xl p-6 font-bold text-sm text-white focus:border-primary/40 outline-none uppercase resize-none"
                      />
                      <div className="absolute bottom-3 right-3">
                         <button onClick={() => fileInputRef.current?.click()} className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground hover:text-primary">
                            <Camera className="h-5 w-5" />
                         </button>
                         <input ref={fileInputRef} type="file" className="hidden" onChange={handleImageUpload} />
                      </div>
                   </div>
                   <Button onClick={handleTutorSubmit} disabled={!tutorQuery.trim()} className="w-full h-16 bg-primary font-black uppercase italic text-lg rounded-2xl shadow-xl">
                      <Zap className="mr-3 h-6 w-6" /> START TUITION
                   </Button>
                   <p className="text-[8px] font-bold text-muted-foreground uppercase text-center italic">
                      100% of ad revenue from this node is retained by Admin.
                   </p>
                </div>
              )}
           </div>
        </DialogContent>
      </Dialog>

      {/* REWARDED AD GATE */}
      {showAdInter && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="max-w-md w-full text-center space-y-10">
              <div className="h-24 w-24 mx-auto relative flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                 <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" style={{ animationDuration: '3s' }} />
                 <Zap className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <div className="space-y-4">
                 <h3 className="text-3xl font-black uppercase italic text-white leading-none">Syncing Signal...</h3>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                    Analyzing partner data stream. Tuition node will activate after the 10s countdown.
                 </p>
              </div>
              <p className="text-6xl font-black text-white italic tabular-nums">{adCountdown}s</p>
              <Button disabled={adCountdown > 0} onClick={callTutorAi} className="w-full h-16 rounded-2xl font-black text-lg uppercase italic bg-primary shadow-xl">
                 {adCountdown === 0 ? "START TUITION" : "WAITING..."}
              </Button>
           </div>
        </div>
      )}
    </div>
  );
}

function ThemeButton({ active, color, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "h-4 w-4 rounded-full border transition-all",
        active ? "ring-2 ring-primary ring-offset-1 scale-110" : "border-white/10"
      )}
      style={{ backgroundColor: color }}
    />
  );
}

export default function PdfViewScreen() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <ViewerContent />
    </Suspense>
  );
}
