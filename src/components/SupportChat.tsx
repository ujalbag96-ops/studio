'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { MessageCircle, X, Send, Loader2, User, Bot, AlertCircle, FileText, CheckCircle2, LifeBuoy, CreditCard, Image as ImageIcon, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supportChat } from '@/ai/flows/support-chat-flow';

export default function SupportChat() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'chat' | 'dispute'>('chat');
  const [input, setInput] = useState('');
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Dispute Form State
  const [disputeData, setDisputeData] = useState({ utr: '', amount: '', receipt: '' });

  useEffect(() => {
    if (!user || !firestore || !isOpen) return;

    const q = query(
      collection(firestore, 'support_tickets'),
      where('userId', '==', user.uid),
      where('status', '==', 'open'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActiveTicket({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setActiveTicket(null);
      }
    });

    return () => unsubscribe();
  }, [user, firestore, isOpen]);

  useEffect(() => {
    if (!firestore || !activeTicket) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(firestore, 'support_tickets', activeTicket.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    return () => unsubscribe();
  }, [firestore, activeTicket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view, isAiTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !firestore) return;

    const text = input;
    setInput('');
    setIsLoading(true);

    try {
      let ticketId = activeTicket?.id;

      if (!ticketId) {
        const newTicket = await addDoc(collection(firestore, 'support_tickets'), {
          userId: user.uid,
          userContact: user.email || user.uid,
          description: text,
          status: 'open',
          priority: 'medium',
          timestamp: new Date().toISOString()
        });
        ticketId = newTicket.id;
      }

      // 1. Add User Message
      await addDoc(collection(firestore, 'support_tickets', ticketId, 'messages'), {
        senderId: user.uid,
        text,
        timestamp: new Date().toISOString()
      });

      // 2. Trigger AI Response
      setIsAiTyping(true);
      try {
        const aiResult = await supportChat({
          message: text,
          userHistory: messages.slice(-5).map(m => m.text)
        });

        await addDoc(collection(firestore, 'support_tickets', ticketId, 'messages'), {
          senderId: 'ai-bot',
          text: aiResult.response,
          timestamp: new Date().toISOString(),
          isAi: true
        });

        if (aiResult.shouldFlag) {
          await updateDoc(doc(firestore, 'support_tickets', ticketId), {
            priority: 'high',
            needsHuman: true
          });
        }
      } catch (err) {
        console.error("AI Node Failure", err);
      } finally {
        setIsAiTyping(false);
      }

    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDisputeData({ ...disputeData, receipt: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitDispute = async () => {
    if (!user || !firestore || !disputeData.utr || !disputeData.amount || !disputeData.receipt) return;
    setIsLoading(true);
    try {
      const disputeRef = await addDoc(collection(firestore, 'payment_disputes'), {
        userId: user.uid,
        userEmail: user.email,
        utrId: disputeData.utr,
        amount: parseFloat(disputeData.amount),
        receiptDataUri: disputeData.receipt,
        status: 'pending',
        timestamp: new Date().toISOString()
      });

      const ticketId = activeTicket?.id;
      if (ticketId) {
        await addDoc(collection(firestore, 'support_tickets', ticketId, 'messages'), {
          senderId: user.uid,
          text: `[SYSTEM] UPI Dispute Logged: UTR ${disputeData.utr}, Amount ₹${disputeData.amount}. Receipt attached.`,
          timestamp: new Date().toISOString(),
          disputeId: disputeRef.id
        });
      }

      toast({ title: "DISPUTE LOGGED", description: "Admin will verify your receipt shortly." });
      setView('chat');
      setDisputeData({ utr: '', amount: '', receipt: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Logging Failed" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-[100]">
      {isOpen ? (
        <Card className="w-[320px] sm:w-[380px] h-[550px] bg-[#0d0d12] border-white/10 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="p-6 bg-primary/10 border-b border-white/5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
               {view === 'chat' ? <Sparkles className="h-5 w-5 text-primary animate-pulse" /> : <CreditCard className="h-5 w-5 text-primary" />}
               <div>
                  <CardTitle className="text-sm font-black uppercase italic tracking-widest">{view === 'chat' ? 'AI Assistant' : 'UPI Dispute'}</CardTitle>
                  <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-[0.3em]">Operational 24/7</p>
               </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-white/5 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-black/20">
            {view === 'chat' ? (
              <>
                <Button onClick={() => setView('dispute')} variant="outline" className="w-full border-primary/20 bg-primary/5 text-primary font-black uppercase text-[9px] h-10 rounded-xl mb-4">
                   <CreditCard className="h-3.5 w-3.5 mr-2" /> Payout / UPI Problem?
                </Button>
                
                {messages.length === 0 && !isAiTyping && (
                  <div className="bg-white/5 p-5 rounded-2xl text-[10px] text-muted-foreground border border-white/5 leading-relaxed font-bold uppercase tracking-widest text-center italic">
                    "Namaste! I am your CampusHub AI. How can I help you earn or study today?"
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex flex-col space-y-1", m.senderId === user.uid ? "items-end" : "items-start")}>
                     <div className={cn(
                       "p-4 rounded-2xl text-[11px] max-w-[85%] font-medium shadow-md leading-relaxed",
                       m.senderId === user.uid 
                        ? "bg-primary text-white rounded-tr-none" 
                        : "bg-white/5 text-muted-foreground border border-white/5 rounded-tl-none"
                     )}>
                        {m.text}
                     </div>
                     <span className="text-[7px] font-black uppercase text-white/20 px-1">
                        {m.senderId === 'ai-bot' ? 'AI INTEL' : 'USER'} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase text-primary italic animate-pulse">
                     <Bot className="h-3 w-3" /> AI is decrypting response...
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                 <button onClick={() => setView('chat')} className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground hover:text-white mb-2">
                    <ArrowLeft className="h-3 w-3" /> Back to AI Chat
                 </button>
                 
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">UTR (12 Digits)</Label>
                    <Input value={disputeData.utr} onChange={e => setDisputeData({...disputeData, utr: e.target.value})} maxLength={12} className="h-12 bg-black border-white/10 rounded-xl" placeholder="e.g. 412588..." />
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Amount (₹)</Label>
                    <Input type="number" value={disputeData.amount} onChange={e => setDisputeData({...disputeData, amount: e.target.value})} className="h-12 bg-black border-white/10 rounded-xl" placeholder="e.g. 500" />
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Screenshot</Label>
                    <div className="relative group">
                       <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="receipt-upload" />
                       <label htmlFor="receipt-upload" className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-2xl bg-black/40 cursor-pointer group-hover:border-primary/40 transition-all">
                          {disputeData.receipt ? (
                             <img src={disputeData.receipt} className="h-32 w-full object-contain rounded-lg" alt="Preview" />
                          ) : (
                             <>
                                <ImageIcon className="h-6 w-6 text-muted-foreground mb-2" />
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">Upload Receipt Signal</span>
                             </>
                          )}
                       </label>
                    </div>
                 </div>

                 <Button onClick={handleSubmitDispute} disabled={isLoading || !disputeData.utr || !disputeData.receipt} className="w-full h-16 bg-primary font-black uppercase italic rounded-2xl shadow-xl">
                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "DISPATCH DISPUTE"}
                 </Button>
              </div>
            )}
          </CardContent>

          {view === 'chat' && (
            <CardFooter className="p-6 border-t border-white/5 bg-black/40">
              <form onSubmit={handleSend} className="flex gap-2 w-full">
                 <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..." 
                  className="bg-black/60 border-white/10 rounded-xl h-12 focus:ring-primary text-[11px] font-bold"
                 />
                 <Button type="submit" size="icon" disabled={isLoading || isAiTyping || !input.trim()} className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 flex-shrink-0 shadow-lg shadow-primary/20">
                   <Send className="h-4 w-4" />
                 </Button>
              </form>
            </CardFooter>
          )}
        </Card>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-[0_10px_30px_rgba(99,102,241,0.4)] flex items-center justify-center p-0 transition-all hover:scale-110 active:scale-95 group"
        >
          <div className="relative">
            <Sparkles className="h-8 w-8 text-white group-hover:animate-pulse" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-[#050508] animate-bounce" />
          </div>
        </Button>
      )}
    </div>
  );
}
