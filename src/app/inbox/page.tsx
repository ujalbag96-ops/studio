
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, ChevronRight, Loader2, Mail } from 'lucide-react';
import { SystemNotification } from '../lib/types';
import Image from 'next/image';

export default function InboxPage() {
  const firestore = useFirestore();
  const notifQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'notifications'), orderBy('timestamp', 'desc'), limit(50)) : null, [firestore]);
  const { data: notifications, isLoading } = useCollection<SystemNotification>(notifQuery);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <div className="space-y-1">
        <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">Analytical <span className="text-primary">Inbox</span></h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">Communication Feed & System Alerts</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
      ) : notifications && notifications.length > 0 ? (
        <div className="grid gap-6">
          {notifications.map((notif) => (
            <Card key={notif.id} className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden group hover:border-primary/20 transition-all shadow-xl">
              <CardContent className="p-0">
                {notif.imageUrl && (
                  <div className="relative h-48 w-full">
                    <img src={notif.imageUrl} alt="Strategic Update" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
                  </div>
                )}
                <div className="p-8 space-y-4">
                  <div className="flex items-center justify-between">
                     <Badge className="bg-primary/10 text-primary uppercase font-black text-[8px] border-none px-3">Protocol: Broadcast</Badge>
                     <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase">
                        <Calendar className="h-3 w-3" /> {new Date(notif.timestamp).toLocaleDateString()}
                     </div>
                  </div>
                  <h3 className="text-xl font-black uppercase italic group-hover:text-primary transition-colors">{notif.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">{notif.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center space-y-4 border-2 border-dashed border-white/5 rounded-[3rem]">
           <Mail className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
           <p className="text-sm text-muted-foreground italic font-black uppercase tracking-widest">Inbox Archives are Empty</p>
        </div>
      )}
    </div>
  );
}
