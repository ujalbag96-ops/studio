
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { MessageCircle, X, Send, Loader2, User, Bot, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { supportChat } from '@/ai/flows/support-chat-flow';
import { SupportMessage } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function SupportChat() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !firestore || !isOpen) return;

    const q = query(
      collection(firestore, 'support'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'asc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SupportMessage)));
    });

    return () => unsubscribe();
  }, [user, firestore, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !firestore) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    try {
      const aiResult = await supportChat({ message: userMessage });
      
      await addDoc(collection(firestore, 'support'), {
        userId: user.uid,
        message: userMessage,
        aiResponse: aiResult.response,
        isFlagged: aiResult.shouldFlag,
        status: 'open',
        timestamp: new Date().toISOString()
      });
      
      if (aiResult.shouldFlag) {
         toast({ title: "Priority Support Ticket Created", description: "Admin has been notified of your query." });
      }
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen ? (
        <Card className="w-[350px] md:w-[400px] h-[500px] bg-[#1a1a1a] border-white/5 flex flex-col shadow-2xl rounded-[2rem] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="p-6 bg-primary/10 border-b border-white/5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
               <Bot className="h-5 w-5 text-primary" />
               <div>
                  <CardTitle className="text-sm font-black uppercase italic">Arena Support</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Tactical Helpdesk</p>
               </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-white/5 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-white/5 p-4 rounded-2xl text-[10px] text-muted-foreground border border-white/5 leading-relaxed font-bold uppercase tracking-widest">
              Identify your issue, Warrior. Our AI analyst is standing by.
            </div>
            {messages.map((m) => (
              <div key={m.id} className="space-y-3">
                <div className="flex justify-end">
                   <div className="bg-primary text-white p-4 rounded-2xl rounded-tr-none text-xs max-w-[80%] font-black italic shadow-lg">
                      {m.message}
                   </div>
                </div>
                {m.aiResponse && (
                  <div className="flex justify-start gap-2">
                     <div className={cn("p-4 rounded-2xl rounded-tl-none text-xs max-w-[80%] font-medium shadow-lg", m.isFlagged ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-[#2a2a2a] text-muted-foreground")}>
                        <p className="font-bold italic">"{m.aiResponse}"</p>
                        {m.isFlagged && <div className="mt-2 pt-2 border-t border-red-500/10 flex items-center gap-1.5 text-[8px] font-black uppercase"><AlertCircle className="h-3 w-3" /> Priority Manual Review Active</div>}
                        {m.status === 'resolved' && <div className="mt-2 pt-2 border-t border-green-500/10 flex items-center gap-1.5 text-[8px] font-black uppercase text-green-500"><CheckCircle2 className="h-3 w-3" /> Resolved</div>}
                     </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
          </CardContent>

          <CardFooter className="p-6 border-t border-white/5">
            <form onSubmit={handleSend} className="flex gap-2 w-full">
               <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Brief your issue..." 
                className="bg-black/40 border-white/10 rounded-xl h-12 focus:ring-primary text-[11px] font-bold"
               />
               <Button type="submit" size="icon" className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 flex-shrink-0">
                 <Send className="h-4 w-4" />
               </Button>
            </form>
          </CardFooter>
        </Card>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 flex items-center justify-center p-0 transition-all hover:scale-110 active:scale-95"
        >
          <div className="relative">
            <MessageCircle className="h-8 w-8 text-white" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-[#050508]" />
          </div>
        </Button>
      )}
    </div>
  );
}
