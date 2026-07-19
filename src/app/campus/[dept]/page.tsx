
'use client';

import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Book, Library, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

const SUBJECTS = [
  { id: 'maths', name: 'Mathematics', icon: '📐', count: 15 },
  { id: 'science', name: 'Science', icon: '🧪', count: 22 },
  { id: 'social', name: 'Social Science', icon: '🌍', count: 18 },
  { id: 'english', name: 'English', icon: '📖', count: 12 },
  { id: 'hindi', name: 'Hindi', icon: '🇮🇳', count: 10 },
  { id: 'computer', name: 'IT & Computer', icon: '💻', count: 8 },
];

export default function SubjectSelectionScreen() {
  const params = useParams();
  const classId = params.dept as string;
  const className = classId.replace('class-', 'Class ');

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12 pb-32">
      <div className="flex items-center justify-between">
         <Button variant="ghost" asChild className="text-[10px] font-black uppercase text-muted-foreground hover:text-white">
            <Link href="/campus"><ArrowLeft className="h-3 w-3 mr-2" /> Back to Classes</Link>
         </Button>
         <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1.5 shadow-xl">{className} Terminal</Badge>
      </div>

      <header className="space-y-6 text-center md:text-left">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
           <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-white leading-none">
                Select <br /><span className="text-primary">Subject Node</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg uppercase tracking-tight">Accessing official NCERT Subject streams for {className}.</p>
           </div>
           <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="SEARCH SUBJECTS..." className="h-14 bg-[#0a0a0f] border-white/5 rounded-2xl pl-12 font-black uppercase text-[10px] tracking-widest focus:border-primary/40" />
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {SUBJECTS.map((sub) => (
          <Link key={sub.id} href={`/campus/${classId}/${sub.id}`}>
            <Card className="p-10 rounded-[2.5rem] bg-[#0a0a0f] border-white/5 hover:border-primary/40 transition-all hover:scale-[1.02] shadow-2xl group relative overflow-hidden flex flex-col justify-between h-full">
              <div className="space-y-6 relative z-10">
                 <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-xl group-hover:scale-110 transition-transform">
                    {sub.icon}
                 </div>
                 <div>
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">{sub.name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">{sub.count} Full Chapters</p>
                 </div>
              </div>
              
              <div className="mt-10 flex items-center justify-between relative z-10">
                 <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase px-3 py-1 italic">NCERT Verified</Badge>
                 <Button className="h-10 w-10 p-0 rounded-xl bg-white/5 group-hover:bg-primary transition-all">
                    <ArrowLeft className="rotate-180 h-4 w-4 text-white" />
                 </Button>
              </div>

              <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Book className="h-40 w-40" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
