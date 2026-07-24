
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  AlertTriangle,
  User,
  Globe2,
  Sparkles,
  MapPin,
  Book
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserProfile, BookMetadata, LanguageCode } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { fetchCollegeBooks } from '@/services/libraryApi';

const FALLBACK_DATABASE: BookMetadata[] = [
  { id: 'ncert-math-10', title: 'Class 10 Mathematics', class: 'Class 10', subject: 'Math', source: 'NCERT', lang: 'en', chapters: 15, coverUrl: '' },
  { id: 'osepa-odia-10', title: 'ସାହିତ୍ୟ ସିନ୍ଧୁ (Literature)', class: 'Class 10', subject: 'Language', source: 'OdiaMedium', lang: 'or', chapters: 14, coverUrl: '' },
  { id: 'ncert-sci-9', title: 'Class 9 Science', class: 'Class 9', subject: 'Science', source: 'NCERT', lang: 'hi', chapters: 12, coverUrl: '' }
];

const LANGUAGES = [
  { value: 'all', label: 'All Languages' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi (हिंदी)' },
  { value: 'or', label: 'Odia (ଓଡ଼ିଆ)' },
  { value: 'bn', label: 'Bengali (বাংলা)' },
];

export default function CampusHomeScreen() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const [eduSource, setEduSource] = useState<string>('all');
  const [language, setLanguage] = useState<string>('all');
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile) {
      if (language === 'all') {
        const initialLang = profile.preferredLanguage || (profile.geo_region === 'India' ? 'or' : 'en');
        setLanguage(initialLang);
      }
      if (eduSource === 'all') {
        const initialSource = profile.geo_region === 'India' ? 'NCERT' : 'OpenLibrary';
        setEduSource(initialSource);
      }
    }
  }, [profile]);

  useEffect(() => {
    async function fetchVaultData() {
      if (!profile) return;
      setLoading(true);

      if (eduSource === 'OpenLibrary') {
         const externalBooks = await fetchCollegeBooks(searchTerm || "academic textbooks");
         setBooks(externalBooks as BookMetadata[]);
         setLoading(false);
         return;
      }

      try {
        const sourceQuery = eduSource === 'all' ? '' : `&source=${eduSource}`;
        const res = await fetch(`/api/curriculum?region=${profile.geo_region || 'Global'}&lang=${language}${sourceQuery}`);
        const data = await res.json();
        
        if (data.success && data.books) {
           setBooks(data.books);
        } else {
           setBooks(FALLBACK_DATABASE);
        }
      } catch (e) {
        setBooks(FALLBACK_DATABASE);
      } finally {
        setLoading(false);
      }
    }
    fetchVaultData();
  }, [profile, language, eduSource, searchTerm]);

  const updateLanguage = async (lang: string) => {
    setLanguage(lang);
    if (userRef && lang !== 'all') {
      await updateDoc(userRef, { preferredLanguage: lang as LanguageCode });
    }
  };

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    let list = [...books];
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      list = list.filter(b => b.title.toLowerCase().includes(query) || b.subject.toLowerCase().includes(query));
    }
    
    return list.sort((a, b) => {
       const aMatches = a.lang === profile?.preferredLanguage ? 1 : 0;
       const bMatches = b.lang === profile?.preferredLanguage ? 1 : 0;
       return bMatches - aMatches;
    });
  }, [books, searchTerm, profile]);

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-12 space-y-12 pb-32">
      <header className="space-y-10 pt-12">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
           <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                 <Badge className="bg-primary/10 text-primary border-primary/20 uppercase font-black px-4 py-1.5 text-[9px] flex items-center gap-2 backdrop-blur-md">
                    <MapPin className="h-3 w-3" /> Region Node: {profile?.geo_region || 'Global'}
                 </Badge>
                 <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest italic animate-pulse">
                    <Sparkles className="h-3.5 w-3.5" /> High-Accuracy Tuition Teacher Node Active
                 </div>
              </div>
              <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase italic text-white leading-[0.8]">
                Scholar <br /><span className="text-primary">Vault Hub</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg max-w-xl uppercase tracking-tight opacity-70">
                Books calibrated to your region ({profile?.geo_region || 'Global'}). Read any global lesson signal instantly.
              </p>
           </div>
           
           <div className="glass-panel p-6 rounded-[2rem] flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto border-2 border-primary/20">
              <div className="space-y-2 flex-1 sm:w-64">
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Universal Source</p>
                 <Select value={eduSource} onValueChange={setEduSource}>
                    <SelectTrigger className="h-12 bg-white/[0.05] border-white/10 font-bold text-[10px] uppercase rounded-xl">
                       <Library className="h-3.5 w-3.5 mr-2 text-primary" />
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-white/10 text-white">
                       <SelectItem value="all">All Global Boards</SelectItem>
                       <SelectItem value="NCERT">NCERT (India)</SelectItem>
                       <SelectItem value="OdiaMedium">OSEPA (Odisha)</SelectItem>
                       <SelectItem value="OpenLibrary">Open Library (Live)</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2 flex-1 sm:w-56">
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Native Language</p>
                 <Select value={language} onValueChange={updateLanguage}>
                    <SelectTrigger className="h-12 bg-white/[0.05] border-white/10 font-bold text-[10px] uppercase rounded-xl">
                       <Languages className="h-3.5 w-3.5 mr-2 text-primary" />
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-white/10 text-white">
                       {LANGUAGES.map(lang => (
                         <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                       ))}
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
             placeholder="Search any subject, formula, or textbook across all languages..." 
             className="h-20 bg-white/[0.02] border-white/10 rounded-[1.5rem] pl-16 text-xl font-bold uppercase tracking-tight focus:border-primary/40 focus:ring-0"
           />
        </div>
      </header>

      {loading ? (
        <div className="py-40 flex flex-col items-center gap-6">
           <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
           <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.4em] italic animate-pulse">Syncing worldwide knowledge signals...</p>
        </div>
      ) : (
        <div className="space-y-12">
           <div className="flex items-center justify-between px-2 border-l-4 border-primary pl-6">
              <div>
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Resource Stream</h3>
                 <p className="text-[9px] font-bold text-muted-foreground uppercase">Showing {filteredBooks.length} High-Accuracy Nodes</p>
              </div>
           </div>
           
           {filteredBooks.length > 0 ? (
             <div className="grid gap-6">
               {filteredBooks.map((book) => (
                 <Link key={book.id} href={`/campus/viewer?url=${encodeURIComponent(book.id.includes('http') ? book.id : `https://ncert.nic.in/textbook/pdf/hemh101.pdf`)}`} className="group">
                   <Card className="p-8 bg-[#0a0a0f] border-white/5 hover:border-primary/30 transition-all rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-8 group shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-8 relative z-10">
                         <div className="h-24 w-20 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform overflow-hidden">
                            {book.coverUrl ? (
                              <img src={book.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                            ) : (
                              <BookOpen className="h-8 w-8" />
                            )}
                         </div>
                         <div className="space-y-1 text-left">
                            <div className="flex items-center gap-3 mb-1">
                               {book.lang === profile?.preferredLanguage && <Badge className="bg-green-500/20 text-green-500 text-[7px] font-black uppercase italic">Recommended for You</Badge>}
                               <Badge variant="outline" className="border-primary/20 text-primary text-[7px] font-black uppercase px-2">{book.source}</Badge>
                            </div>
                            <h4 className="text-3xl font-black uppercase italic tracking-tighter text-white group-hover:text-primary transition-colors">{book.title}</h4>
                            <div className="flex items-center gap-4 text-muted-foreground">
                               <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"><User className="h-3 w-3" /> {book.class} • {book.subject}</p>
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-6 relative z-10">
                         <Badge variant="outline" className="border-white/10 text-[9px] font-bold uppercase py-1.5 px-6 italic text-white group-hover:bg-primary group-hover:text-black transition-all">READ LESSON</Badge>
                         <div className="h-14 w-14 rounded-2xl bg-white/[0.05] flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
                            <ChevronRight className="h-6 w-6 text-primary" />
                         </div>
                      </div>
                   </Card>
                 </Link>
               ))}
             </div>
           ) : (
             <div className="py-40 text-center border-2 border-dashed border-white/10 rounded-[3rem] space-y-4">
                <BookOpen className="h-16 w-16 text-muted-foreground opacity-20 mx-auto" />
                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest italic">No matching scholarly nodes detected.</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
