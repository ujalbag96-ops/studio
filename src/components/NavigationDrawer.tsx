
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
  Library, 
  GraduationCap, 
  Zap, 
  Trophy, 
  Flame, 
  Users, 
  Wallet, 
  Settings, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

export default function NavigationDrawer() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const menuItems = [
    { label: 'Profile Node', icon: <User />, href: '/dashboard' },
    { label: 'Library & Books', icon: <Library />, href: '/campus' },
    { label: 'AI Human Tutor', icon: <GraduationCap />, href: '/campus/viewer' },
    { label: 'Pocket Money (CPA)', icon: <Zap />, href: '/earning-hub' },
    { label: 'Quiz Arena Hub', icon: <Trophy />, href: '/quiz-arena' },
    { label: 'Daily Milestones', icon: <Flame />, href: '/dashboard' },
    { label: 'Refer & Earn', icon: <Users />, href: '/refer' },
    { label: 'Wallet & Payout', icon: <Wallet />, href: '/shop' },
    { label: 'System Settings', icon: <Settings />, href: '/settings' },
  ];

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
             {menuItems.map((item) => (
               <Link key={item.label} href={item.href}>
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl transition-all group",
                    pathname === item.href ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5"
                  )}>
                     <div className="flex items-center gap-4">
                        <span className={cn("text-muted-foreground group-hover:text-primary transition-colors", pathname === item.href && "text-primary")}>
                           {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
                        </span>
                        <span className={cn("text-[11px] font-black uppercase tracking-widest italic", pathname === item.href ? "text-white" : "text-muted-foreground group-hover:text-white")}>
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
                <ShieldCheck className="h-3 w-3" /> CampusHub Industrial v11.0
             </div>
             <Button 
               onClick={handleLogout}
               variant="ghost" 
               className="w-full h-12 rounded-xl bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 font-black uppercase text-[10px] italic border border-red-500/10"
             >
                <LogOut className="h-4 w-4 mr-3" /> Terminate Session
             </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
