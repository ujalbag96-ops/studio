
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  GraduationCap, 
  Library, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck, 
  ChevronRight, 
  Trophy,
  BrainCircuit,
  Globe,
  Flag,
  Search,
  Languages
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserProfile, EduSource } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CLASSES = [
  { id: 'class-1', name: 'Class 1', desc: 'Primary Foundation' },
  { id: 'class-2', name: 'Class 2', desc: 'Primary Foundation' },
  { id: 'class-3', name: 'Class 3', desc: 'Primary Core' },
  { id: 'class-4', name: 'Class 4', desc: 'Primary Core' },
  { id: 'class-5', name: 'Class 5', desc: 'Primary Core' },
  { id: 'class-6', name: 'Class 6', desc: 'Upper Primary' },
  { id: 'class-7', name: 'Class 7', desc: 'Upper Primary' },
  { id: 'class-8', name: 'Class 8', desc: 'Upper Primary' },
  { id: 'class-9', name: 'Class 9', desc: 'Secondary Ed' },
  { id: 'class-10', name: 'Class 10', desc: 'Secondary Ed' },
  { id: 'class-11', name: 'Class 11', desc: 'Higher Secondary' },
  { id: 'class-12', name: 'Class 12', desc: 'Board Ready' },
];

export default function CampusHomeScreen() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading } = useDoc<UserProfile>(userRef);

  const [eduSource, setEduSource] = useState<EduSource>('NCERT');
  const [language, setLanguage] = useState<'en' | 'or'>('en');

  const isIndia = profile?.country === 'India';

  const updatePreference = async (source: EduSource) => {
    setEduSource(source);
    if (userRef) {
      await updateDoc(userRef, { preferredEduSource: source });
    }
  };

  if (!isLoading && profile && !isIndia && eduSource !== 'OpenStax') {
    // Force OpenStax for global users if not already set
    if (eduSource !== 'OpenStax') setEduSource('OpenStax');
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12 pb-32">
      <header className="space-y-8 pt-12">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
           <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                 <Badge className="bg-green-500/20 text-green-500 border-none uppercase font-black px-4 py-1 text-[9px] flex items-center gap-1.5 shadow-xl">
                    <ShieldCheck className="h-3 w-3" /> SMART LIBRARY ACTIVE
                 </Badge>
                 <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">
                    <AlertCircle className="h-3 w-3" /> Industrial API Sync: {eduSource}
                 </div>
              </div>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic text-white leading-none">
                Academic <br /><span className="text-primary">Resource Hub</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg max-w-2xl">
                Access official {eduSource} textbooks. Complete lessons to trigger the <span className="text-white font-bold italic border-b-2 border-primary">Scholar Dividend.</span>
              </p>
           </div>
           
           <div className="flex flex-col gap-4 w-full md:w-auto">
              <Card className="bg-[#0a0a0f] border-white/10 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-2xl">
                 <div className="space-y-2 flex-1">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Library Node</Label>
                    <Select value={eduSource} onValueChange={(v) => updatePreference(v as EduSource)}>
                       <SelectTrigger className="w-[200px] h-12 bg-black border-white/10 font-black text-xs uppercase rounded-xl">
                          <Library className="h-4 w-4 mr-2 text-primary" />
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                          <SelectItem value="NCERT">NCERT India</SelectItem>
                          <SelectItem value="OdiaMedium">Odia Medium (OSEPA)</SelectItem>
                          <SelectItem value="OpenStax">OpenStax Global</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2 flex-1">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Display Language</Label>
                    <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                       <SelectTrigger className="w-[160px] h-12 bg-black border-white/10 font-black text-xs uppercase rounded-xl">
                          <Languages className="h-4 w-4 mr-2 text-primary" />
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                          <SelectItem value="en">English (STD)</SelectItem>
                          <SelectItem value="or">Odia (ଓଡ଼ିଆ)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 border-2 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                 <div className="relative z-10 space-y-2">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Scholar Signal</p>
                    <div className="flex items-center justify-between">
                       <span className="text-3xl font-black text-white italic tabular-nums">{profile?.scholarPoints || 0}</span>
                       <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase px-2">POINTS</Badge>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {CLASSES.map((cls) => (
          <Link key={cls.id} href={`/campus/${cls.id}?source=${eduSource}&lang=${language}`}>
            <Card className="p-8 rounded-[2.5rem] bg-[#0a0a0f] border-white/5 hover:border-primary/40 transition-all hover:scale-105 group text-center space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all relative z-10 shadow-xl">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-black uppercase italic text-white">
                   {language === 'or' ? cls.name.replace('Class', 'ଶ୍ରେଣୀ') : cls.name}
                </h3>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{cls.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 mx-auto text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all relative z-10" />
            </Card>
          </Link>
        ))}
      </div>

      <section className="pt-10 grid md:grid-cols-2 gap-8">
         <Card className="bg-[#0a0a0f] border-dashed border-2 border-white/5 p-10 rounded-[3rem] space-y-6">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 shadow-xl">
                  <BrainCircuit className="h-5 w-5 text-amber-500" />
               </div>
               <h2 className="text-3xl font-black uppercase italic tracking-tighter">Career <span className="text-amber-500">Guidance</span></h2>
            </div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
               {language === 'or' ? "UPSC, JEE, NEET ପାଇଁ ଓଡ଼ିଶା ଶିକ୍ଷା ବିଭାଗରୁ ବିଶେଷ ଟିପ୍ସ |" : "Master academic foundations to unlock high-bandwidth career nodes like UPSC, JEE, and NEET."}
            </p>
            <div className="grid grid-cols-3 gap-3">
               <CareerBadge label="UPSC" />
               <CareerBadge label="NEET" />
               <CareerBadge label="JEE" />
            </div>
         </Card>

         <Card className="bg-primary/5 border-primary/20 border-2 p-10 rounded-[3rem] flex flex-col justify-center items-center text-center space-y-6">
            <Globe className="h-12 w-12 text-primary animate-pulse" />
            <div className="space-y-2">
               <h4 className="text-2xl font-black uppercase italic tracking-tighter">OSEPA Odisha <span className="text-primary">Sync</span></h4>
               <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">Official Signal Integration Active</p>
            </div>
         </Card>
      </section>
    </div>
  );
}

function CareerBadge({ label }: { label: string }) {
   return (
      <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center font-black text-[9px] uppercase tracking-widest text-white/60">
         {label}
      </div>
   );
}

function Label({ children, className }: any) {
   return <label className={cn("text-xs font-bold", className)}>{children}</label>;
}
