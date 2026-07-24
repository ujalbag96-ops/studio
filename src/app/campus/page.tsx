'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Library, 
  ChevronRight, 
  Loader2, 
  BookOpen, 
  Search,
  Zap,
  MapPin,
  Sparkles,
  Languages,
  Book,
  User
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserProfile, BookMetadata, LanguageCode } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { fetchCollegeBooks } from '@/services/libraryApi';

const INTERNAL_DATABASE: BookMetadata[] = [
  { id: 'https://ncert.nic.in/textbook/pdf/hemh101.pdf', title: 'Mathematics (NCERT)', class: 'Class 10', subject: 'Math', source: 'NCERT', lang: 'en', chapters: 15, coverUrl: 'https://picsum.photos/seed/math10/200/300' },
  { id: 'https://ncert.nic.in/textbook/pdf/hesc101.pdf', title: 'Science (NCERT)', class: 'Class 10', subject: 'Science', source: 'NCERT', lang: 'en', chapters: 12, coverUrl: 'https://picsum.photos/seed/sci10/200/300' },
  { id: 'https://ncert.nic.in/textbook/pdf/hime101.pdf', title: 'History: India & World', class: 'Class 10', subject: 'Social', source: 'NCERT', lang: 'en', chapters: 8, coverUrl: 'https://picsum.photos/seed/hist10/200/300' },
  { id: 'osepa-odia-10', title: 'ସାହିତ୍ୟ ସିନ୍ଧୁ (Odia)', class: 'Class 10', subject: 'Language', source: 'OdiaMedium', lang: 'or', chapters: 14, coverUrl: 'https://picsum.photos/seed/odia10/200/300' },
  { id: 'https://ncert.nic.in/textbook/pdf/jhmh101.pdf', title: 'गणित Class 10', class: 'Class 10', subject: 'Math', source: 'NCERT', lang: 'hi', chapters: 15, coverUrl: 'https://picsum.photos/seed/mathhi10/200/300' },
  { id: 'https://ncert.nic.in/textbook/pdf/jhsc101.pdf', title: 'विज्ञान Class 10', class: 'Class 10', subject: 'Science', source: 'NCERT', lang: 'hi', chapters: 12, coverUrl: 'https://picsum.photos/seed/scihi10/200/300' }
];

const LANGUAGES = [
  { value: 'all', label: 'All Global Signals' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi (हिंदी)' },
  { value: 'or', label: 'Odia (ଓଡ଼ିଆ)' },
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
    async function fetchVaultData() {
      setLoading(true);

      if (eduSource === 'OpenLibrary') {
         const externalBooks = await fetchCollegeBooks(searchTerm || "curriculum");
         setBooks(externalBooks as BookMetadata[]);
         setLoading(false);
         return;
      }

      try {
        let filtered = [...INTERNAL_DATABASE];
        if (eduSource !== 'all') {
          filtered = filtered.filter(b => b.source === eduSource);
        }
        if (language !== 'all') {
          filtered = filtered.filter(b => b.lang === language);
        }
        setBooks(filtered);
      } catch (e) {
        setBooks(INTERNAL_DATABASE);
      } finally {
        setLoading(false);
      }
    }
    fetchVaultData();
  }, [language, eduSource, searchTerm]);

  const updateLanguage = async (lang: string) => {
    setLanguage(lang);
    if (userRef && lang !== 'all') {
      updateDoc(userRef, { preferredLanguage: lang as LanguageCode });
    }
  };

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    if (!searchTerm) return books;
    const query = searchTerm.toLowerCase();
    return books.filter(b => 
      b.title.toLowerCase().includes(query) || 
      b.subject.toLowerCase().includes(query)
    );
  }, [books, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-12 space-y-12 pb-32">
      <header className="space-y-10 pt-12">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
           <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                 <Badge className="bg-primary/10 text-primary border-primary/20 uppercase font-black px-4 py-1.5 text-[9px] flex items-center gap-2 backdrop-blur-md">
                    <MapPin className="h-3 w-3" /> Region Node: {profile?.geo_region || 'Analyzing...'}
                 </Badge>
                 <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest italic animate-pulse">
                    <Sparkles className="h-3.5 w-3.5" /> Scholar API Node Active
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
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Source Select</p>
                 <Select value={eduSource} onValueChange={setEduSource}>
                    <SelectTrigger className="h-12 bg-white/[0.05] border-white/10 font-bold text-[10px] uppercase rounded-xl">
                       <Library className="h-3.5 w-3.5 mr-2 text-primary" />
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-white/10 text-white">
                       <SelectItem value="all">All Boards</SelectItem>
                       <SelectItem value="NCERT">NCERT (India)</SelectItem>
                       <SelectItem value="OdiaMedium">OSEPA (Odisha)</SelectItem>
                       <SelectItem value="OpenLibrary">Open Library (Global)</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2 flex-1 sm:w-56">
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Medium</p>
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
             placeholder="Search subjects, topics, or textbooks..." 
             className="h-20 bg-white/[0.02] border-white/10 rounded-[1.5rem] pl-16 text-xl font-bold uppercase tracking-tight focus:border-primary/40 focus:ring-0"
           />
        </div>
      </header>

      {loading ? (
        <div className="py-40 flex flex-col items-center gap-6">
           <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
           <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.4em] italic">Synchronizing Scholarship Signals...</p>
        </div>
      ) : (
        <div className="space-y-12">
           <div className="flex items-center justify-between px-2 border-l-4 border-primary pl-6">
              <div>
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Resource Stream</h3>
                 <p className="text-[9px] font-bold text-muted-foreground uppercase">Found {filteredBooks.length} High-Accuracy Nodes</p>
              </div>
           </div>
           
           {filteredBooks.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               {filteredBooks.map((book) => (
                 <Link key={book.id} href={`/campus/viewer?url=${encodeURIComponent(book.id.includes('http') ? book.id : `https://ncert.nic.in/textbook/pdf/hemh101.pdf`)}`} className="group">
                   <Card className="bg-[#0a0a0f] border-white/5 hover:border-primary/30 transition-all rounded-[2.5rem] overflow-hidden group shadow-2xl relative flex flex-col h-full">
                      <div className="aspect-[3/4] bg-white/5 relative overflow-hidden">
                         {book.coverUrl ? (
                           <img src={book.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={book.title} />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-primary/20">
                              <BookOpen className="h-20 w-20" />
                           </div>
                         )}
                         <div className="absolute top-4 left-4">
                            <Badge variant="outline" className="bg-black/60 backdrop-blur-md border-white/10 text-white text-[7px] font-black uppercase px-2">{book.source}</Badge>
                         </div>
                      </div>
                      <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                         <div className="space-y-1">
                            <h4 className="text-lg font-black uppercase italic tracking-tight text-white group-hover:text-primary transition-colors leading-tight line-clamp-2">{book.title}</h4>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1.5"><User className="h-3 w-3" /> {book.class} • {book.subject}</p>
                         </div>
                         <Button className="w-full h-11 bg-white/5 border border-white/10 group-hover:bg-primary group-hover:text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all">
                            OPEN LESSON <ChevronRight className="ml-2 h-3 w-3" />
                         </Button>
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