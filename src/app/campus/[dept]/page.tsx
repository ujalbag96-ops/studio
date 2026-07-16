'use client';

import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function SemesterScreen() {
  const params = useParams();
  const dept = params.dept as string;

  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-12 pb-32">
      <div className="flex items-center justify-between">
         <Button variant="ghost" asChild className="text-[10px] font-black uppercase text-muted-foreground hover:text-white">
            <Link href="/campus"><ArrowLeft className="h-3 w-3 mr-2" /> Back to Sectors</Link>
         </Button>
         <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4">{dept}</Badge>
      </div>

      <header className="space-y-4 text-center md:text-left">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-white leading-none">
          Select <span className="text-primary">Semester</span>
        </h1>
        <p className="text-muted-foreground font-medium text-lg uppercase tracking-tight">Leveling up the industrial knowledge base.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {semesters.map((sem) => (
          <Link key={sem} href={`/campus/${dept}/sem-${sem}`}>
            <Card className="p-8 rounded-[2rem] bg-white/5 border-white/5 hover:border-primary/40 transition-all hover:scale-105 group text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-black italic text-white">#{sem}</h3>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Semester</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}