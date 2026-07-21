
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { 
  Library, 
  ShieldCheck, 
  ChevronRight, 
  Globe, 
  Languages, 
  Loader2, 
  BookOpen, 
  Search,
  Filter,
  Zap,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserProfile, EduSource, BookMetadata } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const FALLBACK_DATABASE: BookMetadata[] = [
  { id: 'fb-1', title: 'Standard Mathematics', class: 'Class 10', subject: 'Math', source: 'NCERT', lang: 'en', chapters: 12, coverUrl: '' },
  { id: 'fb-2', title: 'Global Science Node', class: 'Higher Ed', subject: 'Science', source: 'OpenStax', lang: 'en', chapters: 15, coverUrl: '' }
];

export default function CampusHomeScreen() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const [eduSource, setEduSource] = useState<string>('all');
  const [language, setLanguage] = useState<'en' | 'or' | 'hi' | 'es'>('en');
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-assignment based on geo_region
  useEffect(() => {
    if (profile) {
      setLanguage(profile.preferredLanguage || (profile.geo_region === 'India' ? 'or' : 'en'));
    }
  }, [profile]);

  useEffect(() => {
    async function fetchVaultData() {
      if (!profile) return;
      setLoading(true);
      setIsFallback(false);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setBooks(FALLBACK_DATABASE);
        setIsFallback(true);
        setLoading(false);
      }, 2000); // 2-second industrial timeout

      try {
        const sourceQuery = eduSource === 'all' ? '' : `&source=${eduSource}`;
        const res = await fetch(`/api/curriculum?region=${profile.geo_region || 'Global'}&lang=${language}${sourceQuery}`, {
          signal: controller.signal
        });
        const data = await res.json();
        clearTimeout(timeoutId);
        if (data.success) {
          setBooks(data.books);
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error("Vault Signal Lost, using cache.");
          setBooks(FALLBACK_DATABASE);
          setIsFallback(true);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchVaultData();
  }, [profile, language, eduSource]);

  const updatePreference = async (source: string) => {
    setEduSource(source);
  };

  const updateLanguage = async (lang: string) => {
    setLanguage(lang as any);
    if (userRef) await updateDoc(userRef, { preferredLanguage: lang });
  };

  // Universal Search Filter Logic
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const query = searchTerm.toLowerCase();
      return (
        book.title.toLowerCase().includes(query) ||
        book.subject.toLowerCase().includes(query) ||
        book.class.toLowerCase().includes(query) ||
        book.source.toLowerCase().includes(query)
      );
    });
  }, [books, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-12 space-y-16 pb-32">
      <header className="space-y-10 pt-12">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
           <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                 <Badge className="bg-primary/10 text-primary border-primary/20 uppercase font-bold px-4 py-1.5 text-[9px] flex items-center gap-2 backdrop-blur-md">
                    <ShieldCheck className="h-3 w-3" /> {isFallback ? 'Local Vault Offline' : 'Global Vault Online'}
                 </Badge>
                 <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest italic">
                    <Globe className="h-3 w-3" /> Node: {profile?.geo_region || 'Global'}
                 </div>
              </div>
              <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase italic text-white leading-[0.8]">
                Academic <br /><span className="text-primary">Global Vault</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg max-w-xl uppercase tracking-tight opacity-70">
                Unlock worldwide curricula signals. Optimized for international students and verified warriors.
              </p>
           </div>
           
           <div className="glass-panel p-6 rounded-[2rem] flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
              <div className="space-y-2 flex-1 sm:w-64">
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Curriculum Node</p>
                 <Select value={eduSource} onValueChange={updatePreference}>
                    <SelectTrigger className="h-12 bg-white/[0.05] border-white/10 font-bold text-[10px] uppercase rounded-xl">
                       <Library className="h-3.5 w-3.5 mr-2 text-primary" />
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-white/10 text-white">
                       <SelectItem value="all">All Available Signals</SelectItem>
                       <SelectItem value="NCERT">NCERT (India)</SelectItem>
                       <SelectItem value="CBSE">CBSE Board</SelectItem>
                       <SelectItem value="ICSE">ICSE Board</SelectItem>
                       <SelectItem value="OdiaMedium">Odia Medium (OSEPA)</SelectItem>
                       <SelectItem value="OpenStax">OpenStax (Global)</SelectItem>
                       <SelectItem value="CommonCore">US Common Core</SelectItem>
                       <SelectItem value="UKNational">UK National Curriculum</SelectItem>
                       <SelectItem value="IB">IB Diploma Program</SelectItem>
                       <SelectItem value="Cambridge">Cambridge IGCSE</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2 flex-1 sm:w-44">
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Terminal Language</p>
                 <Select value={language} onValueChange={(v) => updateLanguage(v)}>
                    <SelectTrigger className="h-12 bg-white/[0.05] border-white/10 font-bold text-[10px] uppercase rounded-xl">
                       <Languages className="h-3.5 w-3.5 mr-2 text-primary" />
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-white/10 text-white">
                       <SelectItem value="en">English</SelectItem>
                       <SelectItem value="hi">Hindi</SelectItem>
                       <SelectItem value="or">Odia</SelectItem>
                       <SelectItem value="es">Spanish</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
           </div>
        </div>

        <div className="relative group">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
           <Input 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             placeholder="Search books, subjects, or boards across the globe..." 
             className="h-20 bg-white/[0.02] border-white/10 rounded-[1.5rem] pl-16 text-xl font-bold uppercase tracking-tight focus:border-primary/40 focus:ring-0"
           />
        </div>
      </header>

      {isFallback && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in duration-500">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest italic">
            Network latency detected. Displaying verified local cache material.
          </p>
        </div>
      )}

      {loading ? (
        <div className="py-40 flex flex-col items-center gap-6">
           <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
           <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.4em] italic animate-pulse">Establishing Worldwide Connection...</p>
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold uppercase italic tracking-widest"><Filter className="h-4 w-4 mr-2 inline" /> Resource Stream</h3>
              <p className="text-[9px] font-bold text-muted-foreground uppercase">{filteredBooks.length} Nodes Identified</p>
           </div>
           
           <div className="grid gap-px bg-white/10 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
             {filteredBooks.map((book) => (
               <Link key={book.id} href={`/campus/${book.id}?source=${book.source}&lang=${book.lang}`} className="group bg-background hover:bg-white/[0.03] transition-all">
                 <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                       <div className="h-14 w-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform">
                          <BookOpen className="h-6 w-6" />
                       </div>
                       <div className="space-y-1">
                          <div className="flex items-center gap-3">
                             <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white group-hover:text-primary transition-colors">{book.title}</h4>
                             <Badge variant="outline" className="border-primary/20 text-primary text-[7px] font-black uppercase px-2">{book.source}</Badge>
                          </div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{book.class} • {book.subject} • {book.chapters} Chapters</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <Badge variant="outline" className="border-white/10 text-[8px] font-bold uppercase py-1 px-4 italic">{book.lang.toUpperCase()}</Badge>
                       <div className="h-10 w-10 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
                          <ChevronRight className="h-5 w-5 text-primary" />
                       </div>
                    </div>
                 </div>
               </Link>
             ))}
           </div>
        </div>
      ) : (
        <div className="py-40 text-center space-y-6 glass-panel rounded-[3rem] border-dashed">
           <Zap className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
           <p className="text-sm font-bold uppercase text-muted-foreground tracking-[0.4em] italic">No Curricula Signal Matching "{searchTerm}"</p>
           <Button variant="outline" onClick={() => setSearchTerm('')} className="border-white/10 font-black uppercase text-[10px] rounded-xl h-10 px-8">Clear Search</Button>
        </div>
      )}
    </div>
  );
}
