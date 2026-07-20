
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, addDoc, query, where, doc, updateDoc, increment } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Globe, 
  Search, 
  Zap, 
  ArrowRight, 
  Loader2, 
  MessageSquare, 
  UserCheck, 
  Star,
  BrainCircuit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UserProfile, StudyBuddySession } from '../lib/types';
import Link from 'next/link';

export default function PeerConnectHub() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [topic, setTopic] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const activeSessionsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'study_sessions'), where('status', '==', 'searching'), limit(20)) : null, 
    [firestore]
  );
  
  const { data: sessions, isLoading: sessionsLoading } = useCollection<StudyBuddySession>(activeSessionsQuery);
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const createRequest = async () => {
    if (!user || !firestore || !topic.trim()) return;
    setIsSearching(true);
    try {
      await addDoc(collection(firestore, 'study_sessions'), {
        topic,
        studentId: user.uid,
        studentEmail: user.email?.split('@')[0],
        teacherId: null,
        status: 'searching',
        timestamp: new Date().toISOString()
      });
      toast({ title: "SIGNAL BROADCASTED", description: "Waiting for a global study-buddy to connect." });
      setTopic('');
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSearching(false);
    }
  };

  const joinAsTeacher = async (sessionId: string) => {
    if (!user || !firestore || !userRef) return;
    try {
      const sessionRef = doc(firestore, 'study_sessions', sessionId);
      await updateDoc(sessionRef, {
        teacherId: user.uid,
        status: 'active'
      });
      
      // Reward Teacher instantly for accepting signal
      await updateDoc(userRef, {
        teacherPoints: increment(5),
        coins: increment(5)
      });

      toast({ title: "PEER LINKED", description: "Teacher points credited. Open session chat now." });
    } catch (e) {
      toast({ variant: "destructive", title: "Link Failed" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12 pb-32">
      <header className="space-y-6 pt-12 text-center md:text-left">
         <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Globe className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Global Student Matching Node</span>
         </div>
         <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white">Peer <span className="text-primary">Connect</span></h1>
         <p className="text-muted-foreground font-medium text-lg max-w-2xl">
            Collaborate with students globally. Help others understand topics and earn **Teacher Points** convertible to cash.
         </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-10">
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5"><BrainCircuit className="h-48 w-48 text-primary" /></div>
               <div className="space-y-2 relative z-10">
                  <h3 className="text-3xl font-black uppercase italic">Request <span className="text-primary">Buddy</span></h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Broadcast your study signal globally.</p>
               </div>
               <div className="flex gap-4 relative z-10">
                  <input 
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="E.G. HELP WITH QUANTUM PHYSICS OR ODIA GRAMMAR..." 
                    className="flex-1 h-20 bg-black border-white/10 rounded-2xl px-8 font-black uppercase text-sm focus:border-primary/40 focus:ring-0 outline-none"
                  />
                  <Button onClick={createRequest} disabled={isSearching || !topic.trim()} className="h-20 px-10 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase italic text-xl shadow-xl shadow-primary/20">
                    {isSearching ? <Loader2 className="animate-spin" /> : <Zap className="fill-white" />}
                  </Button>
               </div>
            </Card>

            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black uppercase italic flex items-center gap-3"><Activity className="text-primary h-6 w-6" /> Live Signals</h3>
                  <Badge variant="outline" className="border-white/10 uppercase text-[8px] font-black py-1.5 px-3">Active Peers: {sessions?.length || 0}</Badge>
               </div>
               <div className="grid gap-6">
                  {sessions?.map((session) => (
                    <Card key={session.id} className="bg-[#0f0f15] border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-primary/20 transition-all shadow-xl">
                       <div className="flex items-center gap-6">
                          <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 font-black text-primary text-xl">
                             {session.studentEmail?.[0].toUpperCase()}
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase text-primary italic mb-1 tracking-widest">Signal from: {session.studentEmail}</p>
                             <h4 className="text-xl font-black uppercase italic text-white leading-tight">{session.topic}</h4>
                          </div>
                       </div>
                       <Button onClick={() => joinAsTeacher(session.id)} className="h-14 px-8 bg-white/5 border border-white/10 hover:bg-primary text-white font-black uppercase italic rounded-xl transition-all">
                          HELP BUDDY <ArrowRight className="ml-2 h-4 w-4" />
                       </Button>
                    </Card>
                  ))}
                  {(!sessions || sessions.length === 0) && (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20">
                       <Users className="h-16 w-16 mx-auto mb-4" />
                       <p className="text-xs font-black uppercase tracking-widest">No Study Signals Detected</p>
                    </div>
                  )}
               </div>
            </div>
         </div>

         <div className="space-y-10">
            <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5"><Star className="h-32 w-32 text-primary" /></div>
               <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><UserCheck className="text-primary" /> Teacher Nodes</h3>
               <div className="space-y-6 relative z-10">
                  <div className="p-6 bg-black/40 rounded-2xl border border-white/5 text-center">
                     <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">My Teacher Points</p>
                     <p className="text-4xl font-black text-white italic">{profile?.teacherPoints || 0}</p>
                     <p className="text-[8px] font-bold text-primary uppercase mt-2 italic">100 Pts = ₹100 Reward</p>
                  </div>
                  <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest">
                     <li className="flex items-start gap-3"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Help others to earn instantly.</li>
                     <li className="flex items-start gap-3"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Verified study time adds points.</li>
                     <li className="flex items-start gap-3"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Fraud matching = Account Lock.</li>
                  </ul>
               </div>
            </Card>

            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
               <h4 className="text-sm font-black uppercase italic">Top Mentors</h4>
               <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-[10px]">#{i}</div>
                          <p className="text-[10px] font-black italic">MENTOR_{i}X</p>
                       </div>
                       <span className="text-xs font-black text-green-500">{50 - (i*10)} Pts</span>
                    </div>
                  ))}
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
