'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Loader2, 
  Zap, 
  BrainCircuit, 
  Globe, 
  X, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  School,
  Maximize2,
  GraduationCap,
  Camera,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';
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

  // Tutor Node State
  const [showTutor, setShowTutor] = useState(false);
  const [tutorQuery, setTutorQuery] = useState('');
  const [tutorImage, setTutorImage] = useState<string | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorResponse, setTutorResponse] = useState<AskHumanTutorOutput | null>(null);
  const [showAdInter, setShowAdInter] = useState(false);
  const [adCountdown, setAdCountdown] = useState(8);
  
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
        toast({ title: "IMAGE SIGNAL CAPTURED", description: "Tutor node ready for visual analysis." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTutorSubmit = () => {
    if (!tutorQuery.trim() && !tutorImage) {
      toast({ variant: "destructive", title: "INPUT REQUIRED", description: "Please enter text or upload a photo." });
      return;
    }
    setShowAdInter(true);
    setAdCountdown(8);
    
    const interval = setInterval(() => {
      setAdCountdown(p => {
        if (p <= 1) {
          clearInterval(interval);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  };

  const callTutorAi = async () => {
    setShowAdInter(false);
    setTutorLoading(true);
    setTutorResponse(null);
    try {
      const res = await askHumanTutor({
        query: tutorQuery,
        photoDataUri: tutorImage || undefined,
        context: `Student is reading: ${url}. Region: ${profile?.geo_region}`,
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
      "min-h-screen transition-colors duration-500 flex flex-col",
      theme === 'white' ? "bg-[#f4f4f5]" : theme === 'sepia' ? "bg-[#f4ecd8]" : "bg-[#09090b]"
    )}>
      <header className="h-16 border-b border-black/5 bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-[100]">
         <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary">
               <ArrowLeft className="h-3 w-3 mr-2" /> EXIT VAULT
            </Button>
            <div className="h-4 w-px bg-black/10 mx-2" />
            <h1 className="text-xs font-black uppercase italic tracking-tighter truncate max-w-[200px] text-primary">
               LIVE LESSON SIGNAL
            </h1>
         </div>

         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
               <ThemeButton active={theme === 'white'} color="#ffffff" onClick={() => setTheme('white')} />
               <ThemeButton active={theme === 'sepia'} color="#f4ecd8" onClick={() => setTheme('sepia')} />
               <ThemeButton active={theme === 'dark'} color="#1a1a1a" onClick={() => setTheme('dark')} />
            </div>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10">
               <Maximize2 className="h-4 w-4" />
            </Button>
         </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
         <div className={cn(
           "relative max-w-6xl w-full aspect-[1.4/1] shadow-[0_50px_100px_rgba(0,0,0,0.3)] rounded-lg transition-all duration-700",
           isPageTurning ? "scale-95 blur-sm" : "scale-100 blur-0",
           theme === 'dark' ? "border-white/5" : "border-white"
         )}>
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-20 bg-gradient-to-r from-transparent via-black/15 to-transparent z-20 pointer-events-none hidden md:block" />
            
            <div className="flex h-full w-full bg-white overflow-hidden rounded-lg border-8 border-white">
               <div className={cn(
                 "flex-1 relative hidden md:block",
                 theme === 'white' ? "bg-white" : theme === 'sepia' ? "bg-[#fcf5e5]" : "bg-[#18181b]"
               )}>
                  <div className="absolute inset-0 bg-black/5 opacity-40" />
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/10 to-transparent" />
               </div>

               <div className={cn(
                 "flex-[1.5] relative transition-colors duration-500",
                 theme === 'white' ? "bg-white" : theme === 'sepia' ? "bg-[#fcf5e5]" : "bg-[#18181b]"
               )}>
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} 
                    className={cn(
                      "w-full h-full border-none transition-all shadow-inner",
                      theme === 'dark' && "filter invert-[0.9] grayscale brightness-90"
                    )}
                  />
                  <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/10 to-transparent" />
               </div>
            </div>

            <button onClick={() => handlePageTurn('prev')} className="absolute left-[-40px] top-1/2 -translate-y-1/2 h-32 w-12 bg-white/5 hover:bg-primary/20 rounded-full flex items-center justify-center transition-all group">
               <ChevronLeft className="h-10 w-10 text-muted-foreground group-hover:text-primary group-hover:scale-125" />
            </button>
            <button onClick={() => handlePageTurn('next')} className="absolute right-[-40px] top-1/2 -translate-y-1/2 h-32 w-12 bg-white/5 hover:bg-primary/20 rounded-full flex items-center justify-center transition-all group">
               <ChevronRight className="h-10 w-10 text-muted-foreground group-hover:text-primary group-hover:scale-125" />
            </button>
         </div>
      </main>

      <div className="fixed bottom-12 inset-x-0 flex justify-center z-[150] px-4 pointer-events-none">
         <Card className="pointer-events-auto bg-black/90 backdrop-blur-2xl border-primary/40 border-2 rounded-full h-20 flex items-center px-10 gap-10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-8 duration-700">
            <button onClick={() => setShowTutor(true)} className="flex items-center gap-4 group text-primary hover:text-white transition-all">
               <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all shadow-lg group-hover:rotate-12">
                  <School className="h-6 w-6" />
               </div>
               <div className="text-left hidden sm:block">
                  <p className="text-[10px] font-black uppercase italic tracking-[0.2em] leading-none">Universal Tutor</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">High-Accuracy Analysis</p>
               </div>
            </button>

            <div className="h-10 w-px bg-white/10" />

            <div className="flex items-center gap-8">
               <div className="flex flex-col items-center">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest italic">Reader Pulse</p>
                  <div className="flex items-center gap-2">
                     <span className="text-lg font-black text-white italic tabular-nums">{profile?.scholarPoints || 0}</span>
                     <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  </div>
               </div>
               
               <Button className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase shadow-xl italic tracking-widest group">
                  <Zap className="h-4 w-4 mr-2 group-hover:animate-bounce" /> Lesson Audit
               </Button>
            </div>
         </Card>
      </div>

      <Dialog open={showTutor} onOpenChange={setShowTutor}>
        <DialogContent className="bg-[#0a0a0f] border-primary/30 text-white max-w-2xl rounded-[3rem] p-10 overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
           
           <DialogHeader className="text-center space-y-4 relative z-10">
              <div className="h-20 w-20 rounded-[2rem] bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-2 shadow-2xl">
                 <GraduationCap className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <DialogTitle className="text-4xl font-black uppercase italic tracking-tighter leading-none">Global <span className="text-primary">Tuition Node</span></DialogTitle>
              <DialogDescription className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Professor Persona • Visual Problem Solver</DialogDescription>
           </DialogHeader>

           <div className="space-y-8 py-8 relative z-10">
              {tutorResponse ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 max-h-[400px] overflow-y-auto no-scrollbar">
                   <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                      <p className="text-base text-white font-medium leading-relaxed italic">"{tutorResponse.explanation}"</p>
                   </div>
                   
                   {tutorResponse.steps && tutorResponse.steps.length > 0 && (
                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <div className="h-1 w-12 bg-primary rounded-full" />
                           <p className="text-[10px] font-black uppercase text-primary tracking-widest italic">Subject Logical Breakdown</p>
                        </div>
                        <div className="space-y-4">
                           {tutorResponse.steps.map((step, i) => (
                             <div key={i} className="flex gap-6 items-start p-6 bg-black/60 border border-white/5 rounded-2xl group hover:border-primary/40 transition-all shadow-inner">
                                <span className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary border border-primary/20 shrink-0 italic">{i+1}</span>
                                <p className="text-sm text-muted-foreground font-semibold leading-relaxed tracking-tight">{step}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                   <Button onClick={() => { setTutorResponse(null); setTutorQuery(''); setTutorImage(null); }} className="w-full h-20 bg-white/5 border border-white/10 hover:bg-primary text-white font-black uppercase italic rounded-2xl text-lg transition-all">
                      NEW TUITION QUERY
                   </Button>
                </div>
              ) : tutorLoading ? (
                <div className="py-24 flex flex-col items-center gap-10">
                   <Loader2 className="h-20 w-20 animate-spin text-primary" />
                   <p className="text-[12px] font-black uppercase italic text-muted-foreground tracking-[0.6em] animate-pulse">DECRYPTING VISUAL LOGIC...</p>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2 italic tracking-widest">Ask any problem via text or photo</Label>
                      
                      <div className="relative">
                        <textarea 
                          value={tutorQuery} 
                          onChange={e => setTutorQuery(e.target.value)} 
                          placeholder="EXPLAIN THE PROBLEM OR FORMULA..."
                          className="w-full h-40 bg-black border-2 border-white/10 rounded-[2rem] p-8 font-bold text-lg text-white focus:border-primary/40 focus:ring-0 outline-none uppercase resize-none shadow-inner"
                        />
                        
                        {/* Image Upload Trigger */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-3">
                           {tutorImage ? (
                             <div className="relative group/img">
                                <img src={tutorImage} className="h-16 w-16 object-cover rounded-xl border border-primary/40 shadow-xl" />
                                <button onClick={() => setTutorImage(null)} className="absolute -top-2 -right-2 h-6 w-6 bg-red-600 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity">
                                   <X className="h-3 w-3" />
                                </button>
                             </div>
                           ) : (
                             <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all shadow-xl"
                             >
                                <Camera className="h-6 w-6" />
                             </button>
                           )}
                           <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </div>
                      </div>
                   </div>

                   <Button 
                    onClick={handleTutorSubmit} 
                    disabled={!tutorQuery.trim() && !tutorImage}
                    className="w-full h-24 bg-primary hover:bg-primary/90 font-black text-2xl uppercase italic rounded-3xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group"
                   >
                      <Zap className="mr-4 h-8 w-8 group-hover:fill-white" /> START TUITION SESSION (AD)
                   </Button>
                   <p className="text-[9px] font-black text-center text-muted-foreground uppercase italic tracking-widest opacity-60">100% High-Accuracy Visual Node Active</p>
                </div>
              )}
           </div>
        </DialogContent>
      </Dialog>

      {showAdInter && (
        <div className="fixed inset-0 z-[300] bg-black/98 flex items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="max-w-md w-full text-center space-y-12">
              <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                 <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
                 <Zap className="h-14 w-14 text-primary animate-pulse" />
              </div>

              <div className="space-y-6">
                 <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">Verifying Tuition Signal...</h3>
                 <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                    Connecting to Senior Professor Network. High-accuracy visual decryption active via industrial signal.
                 </p>
              </div>

              <div className="space-y-8">
                 <p className="text-7xl font-black text-white italic tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{adCountdown}s</p>
                 <Button 
                   disabled={adCountdown > 0} 
                   onClick={callTutorAi}
                   className={cn(
                     "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                     adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce shadow-green-500/20" : "bg-white/5 text-white/20 border border-white/10"
                   )}
                 >
                    {adCountdown === 0 ? "START TUITION" : "ANALYZING SIGNAL..."}
                 </Button>
              </div>
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
        "h-6 w-6 rounded-full border transition-all",
        active ? "ring-2 ring-primary ring-offset-2 scale-110" : "border-white/10 hover:scale-105"
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
