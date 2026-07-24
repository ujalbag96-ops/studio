'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Menu, 
  User, 
  ChevronRight, 
  ShieldCheck, 
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { AppSettings } from '@/app/lib/types';
import { MODULE_REGISTRY } from '@/app/lib/module-registry';

export default function NavigationDrawer() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  // Filter modules based on Admin Toggle states
  const activeModules = MODULE_REGISTRY.filter(m => (settings as any)?.[m.visibilityKey]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5">
          <Menu className="h-6 w-6 text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-[#0a0a0f] border-r border-white/5 text-white p-0 w-80 shadow-2xl">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-8 border-b border-white/5 bg-primary/5">
            <div className="flex items-center gap-4">
               <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                  <span className="text-2xl font-black italic">{user?.email?.[0].toUpperCase() || 'U'}</span>
               </div>
               <div className="text-left">
                  <SheetTitle className="text-lg font-black uppercase italic tracking-tighter text-white">
                    {user?.email?.split('@')[0] || 'Warrior_Node'}
                  </SheetTitle>
                  <Badge className="bg-primary/20 text-primary text-[8px] font-black uppercase px-2 border-none">Active Signal</Badge>
               </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 no-scrollbar">
             <Link href="/dashboard" key="drawer-dashboard-link">
                <div className={cn(
                  "flex items-center justify-between p-4 rounded-xl transition-all group",
                  pathname === '/dashboard' ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5"
                )}>
                   <div className="flex items-center gap-4">
                      <LayoutDashboard className={cn("h-4.5 w-4.5 text-muted-foreground group-hover:text-primary", pathname === '/dashboard' && "text-primary")} />
                      <span className={cn("text-[11px] font-black uppercase tracking-widest italic", pathname === '/dashboard' ? "text-white" : "text-muted-foreground group-hover:text-white")}>Portfolio Hub</span>
                   </div>
                   <ChevronRight className="h-3 w-3 opacity-20" />
                </div>
             </Link>

             {activeModules.map((item) => (
               <Link key={item.id} href={item.route}>
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl transition-all group",
                    pathname === item.route ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5"
                  )}>
                     <div className="flex items-center gap-4">
                        <span className={cn("text-muted-foreground group-hover:text-primary transition-colors", pathname === item.route && "text-primary")}>
                           <item.icon size={18} />
                        </span>
                        <span className={cn("text-[11px] font-black uppercase tracking-widest italic", pathname === item.route ? "text-white" : "text-muted-foreground group-hover:text-white")}>
                           {item.label}
                        </span>
                     </div>
                     <ChevronRight className="h-3 w-3 opacity-20" />
                  </div>
               </Link>
             ))}
          </div>

          <div className="p-8 border-t border-white/5 space-y-6">
             <div className="flex items-center gap-3 text-[9px] font-black text-muted-foreground uppercase italic opacity-40">
                <ShieldCheck className="h-3 w-3" /> CampusHub Industrial v50.0
             </div>
             <button 
               onClick={handleLogout}
               className="w-full h-12 rounded-xl bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 font-black uppercase text-[10px] italic border border-red-500/10 flex items-center justify-center transition-all"
             >
                <LogOut className="h-4 w-4 mr-3" /> Terminate Session
             </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
