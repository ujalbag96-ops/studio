
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, GraduationCap, Library, FlaskConical, Palette, Landmark, Pill, Briefcase, Sparkles, AlertCircle, Globe, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/app/lib/types';
import { Button } from '@/components/ui/button';

const DEPARTMENTS = [
  { id: 'engineering', name: 'Engineering', icon: <GraduationCap />, color: 'from-blue-500/20', desc: 'B.Tech / M.Tech Notes & PYQs' },
  { id: 'science', name: 'Science', icon: <FlaskConical />, color: 'from-emerald-500/20', desc: 'B.Sc / M.Sc Lab & Theory' },
  { id: 'arts', name: 'Arts & Humanities', icon: <Palette />, color: 'from-purple-500/20', desc: 'Syllabus & Research Papers' },
  { id: 'commerce', name: 'Commerce', icon: <Landmark />, color: 'from-amber-500/20', desc: 'B.Com / M.Com Finance' },
  { id: 'management', name: 'Management', icon: <Briefcase />, color: 'from-indigo-500/20', desc: 'MBA / BBA Case Studies' },
  { id: 'pharmacy', name: 'Pharmacy', icon: <Pill />, color: 'from-pink-500/20', desc: 'B.Pharm Notes & Charts' },
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
             <ShieldAlert className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-4">
             <h2 className="text-4xl font-black uppercase italic tracking-tighter">Sector <span className="text-primary">Restricted</span></h2>
             <p className="text-muted-foreground font-medium text-lg uppercase tracking-tight max-w-lg mx-auto leading-relaxed">
                The Resource Locker contains regional academic content currently exclusive to students in <span className="text-white font-bold">India</span>.
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
              <ShieldCheck className="h-3 w-3" /> 100% FREE KNOWLEDGE LOCKER
           </Badge>
           <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest italic justify-center">
              <AlertCircle className="h-3 w-3" /> Zero Investment Educational Node
           </div>
        </div>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic text-white leading-none">
          Resource <span className="text-primary">Sectors</span>
        </h1>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl">
          Access curated industrial notes and previous year questions. <span className="text-white font-bold italic underline decoration-primary underline-offset-4">Always 100% free for students.</span>
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {DEPARTMENTS.map((dept) => (
          <Link key={dept.id} href={`/campus/${dept.id}`}>
            <Card className={cn(
              "p-10 rounded-[2.5rem] bg-gradient-to-br border-white/5 hover:border-primary/40 transition-all hover:scale-[1.02] shadow-2xl group relative overflow-hidden",
              dept.color, "to-transparent"
            )}>
              <div className="relative z-10 space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
                  {dept.icon}
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">{dept.name}</h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-2">{dept.desc}</p>
                </div>
                <div className="pt-2">
                   <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase px-3 py-1">FREE ACCESS ENABLED</Badge>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Library className="h-40 w-40" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
