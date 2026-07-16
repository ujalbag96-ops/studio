
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, Film, Sparkles, TrendingUp, Search } from 'lucide-react';
import Link from 'next/link';
import { Movie } from '@/app/lib/types';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function MovieLibrary() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const moviesQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'movies'), orderBy('createdAt', 'desc')) : null, 
    [firestore]
  );
  
  const { data: movies, isLoading } = useCollection<Movie>(moviesQuery);

  const filteredMovies = movies?.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="space-y-6 pt-12 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-4">
           <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-4 py-1 text-[9px]">Elite Cinema Hub</Badge>
           <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" /> 4K Ultra Streams Active
           </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-2">
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic text-white">Movie <span className="text-primary">Arena</span></h1>
              <p className="text-muted-foreground font-medium text-lg max-w-xl">Premium cinematic library with high-bandwidth industrial signals.</p>
           </div>
           
           <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="SEARCH SIGNALS..." 
                className="h-14 bg-[#0a0a0f] border-white/5 rounded-2xl pl-12 font-black uppercase text-[10px] tracking-widest focus:border-primary/40 focus:ring-0"
              />
           </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center py-32 gap-4">
           <Loader2 className="animate-spin h-10 w-10 text-primary" />
           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] italic">Buffering Intelligence...</p>
        </div>
      ) : filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
           {filteredMovies.map((movie) => (
             <Link key={movie.id} href={`/movies/${movie.id}`} className="group">
                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden group hover:border-primary/40 transition-all shadow-2xl relative">
                   <div className="aspect-[2/3] relative overflow-hidden">
                      <img 
                        src={movie.poster || 'https://picsum.photos/seed/movie/400/600'} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={movie.title} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                         <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(255,123,0,0.5)]">
                            <PlayCircle className="h-8 w-8 text-white fill-white" />
                         </div>
                      </div>

                      <div className="absolute top-4 right-4">
                         <Badge className="bg-black/60 backdrop-blur-md text-white border-none text-[8px] font-black uppercase px-2 py-1 italic">
                           {movie.category}
                         </Badge>
                      </div>
                   </div>
                   <CardContent className="p-5 space-y-1">
                      <h4 className="text-sm font-black uppercase italic text-white group-hover:text-primary transition-colors truncate">{movie.title}</h4>
                      <div className="flex items-center justify-between">
                         <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Industrial Stream</p>
                         <div className="flex items-center gap-1 text-primary">
                            <TrendingUp className="h-2 w-2" />
                            <span className="text-[8px] font-black">POPULAR</span>
                         </div>
                      </div>
                   </CardContent>
                </Card>
             </Link>
           ))}
        </div>
      ) : (
        <div className="py-40 text-center space-y-6 border-2 border-dashed border-white/5 rounded-[3rem]">
           <Film className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
           <p className="text-muted-foreground italic font-black uppercase text-[12px] tracking-[0.4em]">Zero Movie Signals Found</p>
        </div>
      )}

      {/* Persistence Hook */}
      <section className="pt-10">
         <Card className="bg-gradient-to-r from-[#121212] to-black border-white/5 p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-4 text-center md:text-left">
               <h3 className="text-3xl font-black uppercase italic tracking-tighter">Unlimited <span className="text-primary">Access</span></h3>
               <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Watch more to earn VIP Credits</p>
            </div>
            <Button asChild className="h-16 px-10 bg-white/5 border border-white/10 hover:bg-primary rounded-2xl font-black uppercase italic shadow-xl transition-all">
               <Link href="/watch-earn">GO TO EARNING HUB</Link>
            </Button>
         </Card>
      </section>
    </div>
  );
}
