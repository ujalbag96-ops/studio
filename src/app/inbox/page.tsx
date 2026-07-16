
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, ChevronRight, Loader2, Mail, Ticket, Copy, MapPin } from 'lucide-react';
import { SystemNotification } from '../lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function InboxPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const notifQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Query both broadcast and personal notifications
    return query(
      collection(firestore, 'notifications'), 
      where('userId', 'in', [user.uid, 'broadcast', null]),
      orderBy('timestamp', 'desc'), 
      limit(50)
    );
  }, [firestore, user]);

  const { data: notifications, isLoading } = useCollection<SystemNotification>(notifQuery);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code Copied!", description: "Redeem it in your game account." });
  };

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
                     <div className="flex items-center gap-3">
                        <Badge className={cn(
                          "uppercase font-black text-[8px] border-none px-3",
                          notif.type === 'payout' ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                        )}>
                           Protocol: {notif.type === 'payout' ? 'Delivery' : 'Broadcast'}
                        </Badge>
                        {notif.localizedBody && (
                           <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black uppercase px-2 italic flex items-center gap-1">
                              <MapPin className="h-2 w-2" /> Regional
                           </Badge>
                        )}
                     </div>
                     <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase">
                        <Calendar className="h-3 w-3" /> {new Date(notif.timestamp).toLocaleDateString()}
                     </div>
                  </div>
                  <h3 className="text-xl font-black uppercase italic group-hover:text-primary transition-colors">{notif.title}</h3>
                  
                  {/* AI Localization Toggle/Display */}
                  <div className="space-y-4">
                     {notif.localizedBody && (
                        <div className="p-4 bg-primary/5 border-l-2 border-primary rounded-r-xl italic text-sm text-white font-medium leading-relaxed">
                           "{notif.localizedBody}"
                        </div>
                     )}
                     <p className={cn(
                       "text-sm text-muted-foreground leading-relaxed font-medium",
                       notif.localizedBody && "opacity-50 text-xs"
                     )}>
                       {notif.body}
                     </p>
                  </div>
                  
                  {notif.voucherCode && (
                    <div className="mt-6 p-6 bg-primary/5 border border-primary/20 rounded-2xl space-y-4">
                       <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-primary" />
                          <span className="text-[10px] font-black uppercase text-primary tracking-widest">Digital Voucher Code</span>
                       </div>
                       <div className="flex items-center justify-between bg-black p-4 rounded-xl border border-white/5">
                          <span className="font-mono text-lg font-black text-white tracking-widest">{notif.voucherCode}</span>
                          <button onClick={() => copyCode(notif.voucherCode!)} className="text-primary hover:text-primary/80 transition-colors">
                             <Copy className="h-5 w-5" />
                          </button>
                       </div>
                    </div>
                  )}
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
