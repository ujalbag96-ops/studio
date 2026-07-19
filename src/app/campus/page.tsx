
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
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const CLASSES = [
  { id: 'class-1', name: 'Class 1', desc: 'NCERT Foundation' },
  { id: 'class-2', name: 'Class 2', desc: 'NCERT Foundation' },
  { id: 'class-3', name: 'Class 3', desc: 'Primary Core' },
  { id: 'class-4', name: 'Class 4', desc: 'Primary Core' },
  { id: 'class-5', name: 'Class 5', desc: 'Primary Core' },
  { id: 'class-6', name: 'Class 6', desc: 'Upper Primary' },
  { id: 'class-7', name: 'Class 7', desc: 'Upper Primary' },
  { id: 'class-8', name: 'Class 8', desc: 'Upper Primary' },
  { id: 'class-9', name: 'Class 9', desc: 'Secondary Education' },
  { id: 'class-10', name: 'Class 10', desc: 'Secondary Education' },
  { id: 'class-11', name: 'Class 11', desc: 'Higher Secondary' },
  { id: 'class-12', name: 'Class 12', desc: 'Board Preparation' },
];

export default function CampusHomeScreen() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading } = useDoc<UserProfile>(userRef);

  const isIndia = profile?.country === 'India';

  if (!isLoading && profile && !isIndia) {
    return (
       <div className="max-w-4xl mx-auto p-12 text-center space-y-8 pt-40">
          <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] border border-primary/20 flex items-center justify-center mx-auto shadow-2xl">
             <Globe className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-4">
             <h2 className="text-4xl font-black uppercase italic tracking-tighter">Regional <span className="text-primary">Restriction</span></h2>
             <p className="text-muted-foreground font-medium text-lg uppercase tracking-tight max-w-lg mx-auto leading-relaxed">
                The NCERT Education Hub is currently exclusive to students in <span className="text-white font-bold">India</span>.
             </p>
          </div>
          <Button asChild variant="outline" className="h-14 px-10 rounded-xl border-white/10 text-white font-black uppercase italic">
             <Link href="/">Back to Dashboard</Link>
          </Button>
       </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12 pb-32">
      <header className="space-y-6 pt-12 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-4">
           <Badge className="bg-green-500/20 text-green-500 border-none uppercase font-black tracking-widest px-4 py-1 text-[9px] flex items-center gap-1.5 w-fit mx-auto md:mx-0 shadow-xl">
              <ShieldCheck className="h-3 w-3" /> 100% FREE NCERT HUB
           </Badge>
           <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest italic justify-center">
              <AlertCircle className="h-3 w-3" /> Official Digital Library Sync
           </div>
        </div>
        <div className="flex flex-col xl:flex-row justify-between items-end gap-8">
           <div className="space-y-2">
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic text-white leading-none">
                Indian <br /><span className="text-primary">Education Hub</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg max-w-2xl">
                Access Class 1-12 NCERT textbooks. Read for 30 minutes daily to earn <span className="text-white font-bold italic underline decoration-primary underline-offset-4">Scholar Points.</span>
              </p>
           </div>
           
           <Card className="bg-gradient-to-br from-[#1a1a24] to-black border-primary/20 border-2 rounded-[2rem] p-6 min-w-[300px] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                 <Trophy className="h-20 w-20 text-primary" />
              </div>
              <div className="relative z-10 space-y-3">
                 <p className="text-[10px] font-black uppercase text-muted-foreground">My Academic Standing</p>
                 <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-white tabular-nums">{profile?.scholarPoints || 0}</span>
                    <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase px-2">Scholar Points</Badge>
                 </div>
                 <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">30 Min Reading = +10 Points</p>
              </div>
           </Card>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {CLASSES.map((cls) => (
          <Link key={cls.id} href={`/campus/${cls.id}`}>
            <Card className="p-8 rounded-[2rem] bg-[#0a0a0f] border-white/5 hover:border-primary/40 transition-all hover:scale-105 group text-center space-y-4 shadow-xl">
              <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase italic text-white">{cls.name}</h3>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{cls.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 mx-auto text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all" />
            </Card>
          </Link>
        ))}
      </div>

      {/* Indian Career Hub Widget */}
      <section className="pt-10">
         <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-xl">
               <BrainCircuit className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Career <span className="text-amber-500">Guidance Node</span></h2>
         </div>
         <div className="grid md:grid-cols-3 gap-6">
            <CareerCard exam="UPSC" tip="Focus on daily current affairs from official nodes." color="blue" />
            <CareerCard exam="JEE Main" tip="Master NCERT Chemistry to boost your score by 40%." color="orange" />
            <CareerCard exam="NEET" tip="Biology diagrams are the key to high-bandwidth retention." color="emerald" />
         </div>
      </section>
    </div>
  );
}

function CareerCard({ exam, tip, color }: any) {
  const colors = {
    blue: "border-blue-500/20 bg-blue-500/5",
    orange: "border-orange-500/20 bg-orange-500/5",
    emerald: "border-emerald-500/20 bg-emerald-500/5"
  };
  return (
    <Card className={cn("p-8 rounded-[2.5rem] border-2 space-y-4 group hover:scale-[1.02] transition-all shadow-xl", colors[color as keyof typeof colors])}>
       <div className="flex justify-between items-center">
          <Badge className="bg-black/40 text-white border-none text-[8px] font-black uppercase px-3">{exam} PREP</Badge>
          <Sparkles className="h-4 w-4 text-white opacity-20 group-hover:opacity-100 transition-opacity" />
       </div>
       <p className="text-xs font-bold text-white/80 uppercase leading-relaxed tracking-tight">"{tip}"</p>
       <div className="pt-4 flex items-center gap-2 text-[8px] font-black uppercase text-white/40 italic">
          <ChevronRight className="h-2 w-2" /> DAILY ANALYTICS TIP
       </div>
    </Card>
  );
}
