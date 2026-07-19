
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Book, Library, Search, Globe, Languages } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Suspense } from 'react';

const SUBJECTS_EN = [
  { id: 'maths', name: 'Mathematics', icon: '📐', count: 15 },
  { id: 'science', name: 'Science', icon: '🧪', count: 22 },
  { id: 'social', name: 'Social Science', icon: '🌍', count: 18 },
  { id: 'english', name: 'English', icon: '📖', count: 12 },
  { id: 'hindi', name: 'Hindi', icon: '🇮🇳', count: 10 },
  { id: 'computer', name: 'IT & Computer', icon: '💻', count: 8 },
];

const SUBJECTS_OR = [
  { id: 'maths', name: 'ଗଣିତ (Math)', icon: '📐', count: 15 },
  { id: 'science', name: 'ବିଜ୍ଞାନ (Science)', icon: '🧪', count: 22 },
  { id: 'social', name: 'ସାମାଜିକ ବିଜ୍ଞାନ', icon: '🌍', count: 18 },
  { id: 'english', name: 'English', icon: '📖', count: 12 },
  { id: 'odia', name: 'ସାହିତ୍ୟ (Odia)', icon: '🖋️', count: 15 },
  { id: 'computer', name: 'IT & Computer', icon: '💻', count: 8 },
];

function SubjectSelectionContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classId = params.dept as string;
  const source = searchParams.get('source') || 'NCERT';
  const lang = searchParams.get('lang') || 'en';
  
  const className = classId.replace('class-', 'Class ');
  const subjects = lang === 'or' ? SUBJECTS_OR : SUBJECTS_EN;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12 pb-32">
      <div className="flex items-center justify-between">
         <Button variant="ghost" asChild className="text-[10px] font-black uppercase text-muted-foreground hover:text-white">
            <Link href="/campus"><ArrowLeft className="h-3 w-3 mr-2" /> Back to Library</Link>
         </Button>
         <div className="flex gap-3">
            <Badge variant="outline" className="border-white/10 uppercase font-black px-4 py-1.5 shadow-xl text-[9px]">{source} NODE</Badge>
            <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1.5 shadow-xl text-[9px]">{className} {lang === 'or' ? 'ଶ୍ରେଣୀ' : ''}</Badge>
         </div>
      </div>

      <header className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
           <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-white leading-none">
                Select <br /><span className="text-primary">Subject Terminal</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg uppercase tracking-tight">
                {lang === 'or' ? `ବିଷୟ ଚୟନ କରନ୍ତୁ - ${className}` : `Accessing official ${source} Subject streams for ${className}.`}
              </p>
           </div>
           <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="SEARCH SUBJECTS..." className="h-14 bg-[#0a0a0f] border-white/5 rounded-2xl pl-12 font-black uppercase text-[10px] tracking-widest focus:border-primary/40" />
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {subjects.map((sub) => (
          <Link key={sub.id} href={`/campus/${classId}/${sub.id}?source=${source}&lang=${lang}`}>
            <Card className="p-10 rounded-[2.5rem] bg-[#0a0a0f] border-white/5 hover:border-primary/40 transition-all hover:scale-[1.02] shadow-2xl group relative overflow-hidden flex flex-col justify-between h-full">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="space-y-6 relative z-10">
                 <div className="h-20 w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-xl group-hover:scale-110 transition-transform group-hover:border-primary/20">
                    {sub.icon}
                 </div>
                 <div>
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white leading-tight">{sub.name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-3">
                       {lang === 'or' ? `${sub.count} ଅଧ୍ୟାୟ` : `${sub.count} Full Chapters`}
                    </p>
                 </div>
              </div>
              
              <div className="mt-10 flex items-center justify-between relative z-10">
                 <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase px-3 py-1 italic">{source} Verified</Badge>
                 <Button className="h-12 w-12 p-0 rounded-2xl bg-white/5 group-hover:bg-primary transition-all border border-white/10">
                    <ArrowLeft className="rotate-180 h-5 w-5 text-white" />
                 </Button>
              </div>

              <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                 <Book className="h-40 w-40" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SubjectSelectionScreen() {
  return (
    <Suspense fallback={<div className="p-20 text-center uppercase font-black italic">Loading subjects...</div>}>
      <SubjectSelectionContent />
    </Suspense>
  );
}
