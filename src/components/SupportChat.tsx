
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { MessageCircle, X, Send, Loader2, User, Bot, AlertCircle, FileText, CheckCircle2, LifeBuoy, CreditCard, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Dispute Form State
  const [disputeData, setDisputeData] = useState({ utr: '', amount: '', receipt: '' });

  // Find or create active ticket for the user
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

  // Listen for messages in active ticket
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
  }, [messages, view]);

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

      await addDoc(collection(firestore, 'support_tickets', ticketId, 'messages'), {
        senderId: user.uid,
        text,
        timestamp: new Date().toISOString()
      });
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

      // Also notify chat
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
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen ? (
        <Card className="w-[350px] md:w-[400px] h-[600px] bg-[#1a1a1a] border-white/5 flex flex-col shadow-2xl rounded-[2rem] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="p-6 bg-primary/10 border-b border-white/5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
               {view === 'chat' ? <LifeBuoy className="h-5 w-5 text-primary" /> : <CreditCard className="h-5 w-5 text-primary" />}
               <div>
                  <CardTitle className="text-sm font-black uppercase italic">{view === 'chat' ? 'Live Helpdesk' : 'UPI Dispute'}</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Signal Integrity Active</p>
               </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-white/5 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {view === 'chat' ? (
              <>
                <Button onClick={() => setView('dispute')} variant="outline" className="w-full border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] h-12 rounded-xl mb-4">
                   <CreditCard className="h-3 w-3 mr-2" /> Deposit Not Credited / UPI Issue
                </Button>
                
                {!activeTicket && messages.length === 0 && (
                  <div className="bg-white/5 p-4 rounded-2xl text-[10px] text-muted-foreground border border-white/5 leading-relaxed font-bold uppercase tracking-widest text-center">
                    Send a message to start a real-time conversation with our support team.
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.senderId === user.uid ? "justify-end" : "justify-start")}>
                     <div className={cn(
                       "p-4 rounded-2xl text-xs max-w-[80%] font-medium shadow-lg",
                       m.senderId === user.uid ? "bg-primary text-white rounded-tr-none" : "bg-[#2a2a2a] text-muted-foreground rounded-tl-none"
                     )}>
                        {m.text}
                     </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                 <button onClick={() => setView('chat')} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white mb-2">
                    <ArrowLeft className="h-3 w-3" /> Back to Intelligence
                 </button>
                 
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Transaction UTR (12 Digits)</Label>
                    <Input value={disputeData.utr} onChange={e => setDisputeData({...disputeData, utr: e.target.value})} maxLength={12} className="bg-black border-white/10" placeholder="e.g. 412588..." />
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Amount Paid (₹)</Label>
                    <Input type="number" value={disputeData.amount} onChange={e => setDisputeData({...disputeData, amount: e.target.value})} className="bg-black border-white/10" placeholder="e.g. 500" />
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Payment Receipt / Screenshot</Label>
                    <div className="relative group">
                       <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="receipt-upload" />
                       <label htmlFor="receipt-upload" className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-2xl bg-black/40 cursor-pointer group-hover:border-primary/40 transition-all">
                          {disputeData.receipt ? (
                             <img src={disputeData.receipt} className="h-32 w-full object-contain rounded-lg" alt="Receipt Preview" />
                          ) : (
                             <>
                                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Tap to Capture Signal</span>
                             </>
                          )}
                       </label>
                    </div>
                 </div>

                 <Button onClick={handleSubmitDispute} disabled={isLoading || !disputeData.utr || !disputeData.receipt} className="w-full h-14 bg-primary font-black uppercase italic rounded-2xl shadow-xl">
                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "DISPATCH DISPUTE"}
                 </Button>
              </div>
            )}
            {isLoading && view === 'chat' && <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
          </CardContent>

          {view === 'chat' && (
            <CardFooter className="p-6 border-t border-white/5">
              <form onSubmit={handleSend} className="flex gap-2 w-full">
                 <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Identify your issue..." 
                  className="bg-black/40 border-white/10 rounded-xl h-12 focus:ring-primary text-[11px] font-bold"
                 />
                 <Button type="submit" size="icon" className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 flex-shrink-0">
                   <Send className="h-4 w-4" />
                 </Button>
              </form>
            </CardFooter>
          )}
        </Card>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 flex items-center justify-center p-0 transition-all hover:scale-110 active:scale-95"
        >
          <div className="relative">
            <LifeBuoy className="h-8 w-8 text-white" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-[#050508]" />
          </div>
        </Button>
      )}
    </div>
  );
}
