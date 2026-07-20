
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Library, 
  ShieldCheck, 
  ChevronRight, 
  BrainCircuit,
  Globe,
  Languages,
  Loader2,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserProfile, EduSource, BookMetadata } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CampusHomeScreen() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const [eduSource, setEduSource] = useState<EduSource>('NCERT');
  const [language, setLanguage] = useState<'en' | 'or' | 'hi' | 'es'>('en');
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-assignment based on geo_region & Language Fetching
  useEffect(() => {
    if (profile) {
      setEduSource(profile.preferredEduSource || (profile.geo_region === 'India' ? 'NCERT' : 'OpenStax'));
      setLanguage(profile.preferredLanguage || (profile.geo_region === 'India' ? 'or' : 'en'));
    }
  }, [profile]);

  useEffect(() => {
    async function fetchVaultData() {
      if (!profile) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/curriculum?region=${profile.geo_region || 'Global'}&lang=${language}&source=${eduSource}`);
        const data = await res.json();
        if (data.success) {
          setBooks(data.books);
        }
      } catch (e) {
        console.error("Vault Signal Lost");
      } finally {
        setLoading(false);
      }
    }
    fetchVaultData();
  }, [profile, language, eduSource]);

  const updatePreference = async (source: EduSource) => {
    setEduSource(source);
    if (userRef) {
      await updateDoc(userRef, { preferredEduSource: source });
    }
  };

  const updateLanguage = async (lang: string) => {
    setLanguage(lang as any);
    if (userRef) {
      await updateDoc(userRef, { preferredLanguage: lang });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12 pb-32">
      <header className="space-y-8 pt-12">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
           <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                 <Badge className="bg-green-500/20 text-green-500 border-none uppercase font-black px-4 py-1 text-[9px] flex items-center gap-1.5 shadow-xl">
                    <ShieldCheck className="h-3 w-3" /> GLOBAL SMART VAULT ACTIVE
                 </Badge>
                 <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">
                    <Globe className="h-3 w-3" /> Node: {profile?.geo_region || 'Global'} Detected
                 </div>
              </div>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic text-white leading-none">
                Academic <br /><span className="text-primary">Global Vault</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg max-w-2xl">
                Master any curriculum. Regional catalogs automatically synchronized based on industrial IP detection signals.
              </p>
           </div>
           
           <div className="flex flex-col gap-4 w-full md:w-auto">
              <Card className="bg-[#0a0a0f] border-white/10 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-2xl">
                 <div className="space-y-2 flex-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground ml-1">Curriculum Node</p>
                    <Select value={eduSource} onValueChange={(v) => updatePreference(v as EduSource)}>
                       <SelectTrigger className="w-[200px] h-12 bg-black border-white/10 font-black text-xs uppercase rounded-xl">
                          <Library className="h-4 w-4 mr-2 text-primary" />
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                          <SelectItem value="NCERT">NCERT (India)</SelectItem>
                          <SelectItem value="OdiaMedium">Odia Medium (OSEPA)</SelectItem>
                          <SelectItem value="OpenStax">OpenStax (Global)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2 flex-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground ml-1">Language Terminal</p>
                    <Select value={language} onValueChange={(v) => updateLanguage(v)}>
                       <SelectTrigger className="w-[160px] h-12 bg-black border-white/10 font-black text-xs uppercase rounded-xl">
                          <Languages className="h-4 w-4 mr-2 text-primary" />
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                          <SelectItem value="en">English (US/UK)</SelectItem>
                          <SelectItem value="hi">Hindi (IN)</SelectItem>
                          <SelectItem value="or">Odia (IN)</SelectItem>
                          <SelectItem value="es">Spanish (Global)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 border-2 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                 <div className="relative z-10 space-y-2">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Scholar Signal Strength</p>
                    <div className="flex items-center justify-between">
                       <span className="text-3xl font-black text-white italic tabular-nums">{profile?.scholarPoints || 0}</span>
                       <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase px-2">MASTERED</Badge>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </header>

      {loading ? (
        <div className="py-40 flex flex-col items-center gap-6">
           <Loader2 className="h-12 w-12 animate-spin text-primary" />
           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] italic">Accessing Regional Vault...</p>
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {books.map((book) => (
            <Link key={book.id} href={`/campus/${book.id}?source=${book.source}&lang=${book.lang}`}>
              <Card className="p-8 rounded-[2.5rem] bg-[#0a0a0f] border-white/5 hover:border-primary/40 transition-all hover:scale-105 group space-y-6 shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="space-y-6 relative z-10">
                   <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-xl">
                      <BookOpen className="h-8 w-8" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase italic text-white tracking-tight leading-tight">{book.title}</h3>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{book.class} • {book.subject}</p>
                   </div>
                </div>
                <div className="relative z-10 pt-6 border-t border-white/5 flex items-center justify-between">
                   <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black px-3 py-1 uppercase">{book.chapters} Chapters</Badge>
                   <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-40 text-center space-y-6 border-2 border-dashed border-white/5 rounded-[3rem]">
           <Library className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
           <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">No matching catalogs for this terminal</p>
        </div>
      )}

      <section className="pt-10 grid md:grid-cols-2 gap-8">
         <Card className="bg-[#0a0a0f] border-dashed border-2 border-white/5 p-10 rounded-[3rem] space-y-6">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 shadow-xl">
                  <BrainCircuit className="h-5 w-5 text-amber-500" />
               </div>
               <h2 className="text-3xl font-black uppercase italic tracking-tighter">Scholar <span className="text-amber-500">Dividend</span></h2>
            </div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
               Every minute spent in the Smart Vault generates analytical value. Complete lessons to trigger your share of the platform's educational revenue pool.
            </p>
         </Card>

         <Card className="bg-primary/5 border-primary/20 border-2 p-10 rounded-[3rem] flex flex-col justify-center items-center text-center space-y-6">
            <Globe className="h-12 w-12 text-primary animate-pulse" />
            <div className="space-y-2">
               <h4 className="text-2xl font-black uppercase italic tracking-tighter">Universal <span className="text-primary">Sync Active</span></h4>
               <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">Geo-Calibration Node Fully Integrated</p>
            </div>
         </Card>
      </section>
    </div>
  );
}
