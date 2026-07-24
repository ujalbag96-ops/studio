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
  ChevronRight, 
  ShieldCheck, 
  LogOut,
  LayoutDashboard,
  Zap,
  Settings
} from 'lucide-react';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { AppSettings } from '@/app/lib/types';
import { MODULE_REGISTRY, ModuleCategory } from '@/app/lib/module-registry';

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

  const categories: ModuleCategory[] = ['Learning', 'Skills', 'Earning', 'Productivity', 'System'];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 transition-all">
          <Menu className="h-6 w-6 text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-[#050508] border-r border-white/5 text-white p-0 w-80 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
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
                  <div className="flex items-center gap-2 mt-1">
                     <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Signal Active</span>
                  </div>
               </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 no-scrollbar">
             
             <div className="space-y-2">
                <Link href="/dashboard">
                   <div className={cn(
                     "flex items-center justify-between p-4 rounded-2xl transition-all group",
                     pathname === '/dashboard' ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-white/5 hover:bg-white/10"
                   )}>
                      <div className="flex items-center gap-4">
                         <LayoutDashboard className={cn("h-4.5 w-4.5", pathname === '/dashboard' ? "text-white" : "text-primary")} />
                         <span className="text-[11px] font-black uppercase tracking-widest italic">My Portfolio</span>
                      </div>
                      <ChevronRight className={cn("h-3 w-3 opacity-20", pathname === '/dashboard' && "opacity-100")} />
                   </div>
                </Link>
             </div>

             {categories.map((cat) => {
                const catModules = MODULE_REGISTRY.filter(m => m.category === cat && (settings ? (settings as any)?.[m.visibilityKey] : true));
                if (catModules.length === 0) return null;

                return (
                   <div key={cat} className="space-y-3">
                      <div className="px-4 flex items-center gap-3">
                         <div className="h-px flex-1 bg-white/5" />
                         <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em] italic">{cat} SECTOR</span>
                         <div className="h-px flex-1 bg-white/5" />
                      </div>
                      <div className="grid gap-2">
                         {catModules.map((item) => (
                           <Link key={item.id} href={item.route}>
                              <div className={cn(
                                "flex items-center justify-between p-4 rounded-xl transition-all group",
                                pathname === item.route ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5"
                              )}>
                                 <div className="flex items-center gap-4">
                                    <span className={cn("text-muted-foreground group-hover:text-primary transition-colors", pathname === item.route && "text-primary")}>
                                       <item.icon size={16} />
                                    </span>
                                    <span className={cn("text-[11px] font-black uppercase tracking-widest italic", pathname === item.route ? "text-primary" : "text-muted-foreground group-hover:text-white")}>
                                       {item.label}
                                    </span>
                                 </div>
                                 <ChevronRight className="h-3 w-3 opacity-10 group-hover:opacity-100 transition-opacity" />
                              </div>
                           </Link>
                         ))}
                      </div>
                   </div>
                );
             })}
          </div>

          <div className="p-8 border-t border-white/5 space-y-6 bg-black/40">
             <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-[9px] font-black text-muted-foreground uppercase italic opacity-40">
                   <ShieldCheck className="h-3 w-3" /> Bracket Battles Industrial v1.0
                </div>
                {user?.email?.toLowerCase() === 'ujalbag96@gmail.com' && (
                  <Link href="/admin" className="flex items-center gap-3 text-[9px] font-black text-primary uppercase italic hover:underline">
                     <Settings className="h-3 w-3" /> Admin Command Hub
                  </Link>
                )}
             </div>
             
             <button 
               onClick={handleLogout}
               className="w-full h-14 rounded-2xl bg-red-600/10 hover:bg-red-600 hover:text-white text-red-600 font-black uppercase text-[10px] italic border border-red-600/20 flex items-center justify-center transition-all shadow-lg active:scale-95"
             >
                <LogOut className="h-4 w-4 mr-3" /> Terminate Session
             </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
