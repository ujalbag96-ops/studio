'use client';

import Link from 'next/link';
import { Trophy, Home, Zap, Wallet, Settings, LogIn, User, LogOut, Shield, Crown, Activity } from 'lucide-react';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import { UserProfile } from '@/app/lib/types';
import WalletModal from './WalletModal';
import { cn } from '@/lib/utils';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function Navbar() {
  const { user } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  const { data: profile } = useDoc<UserProfile>(userProfileRef);

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        toast({ title: "Session Terminated", description: "Identity sector closed." });
        localStorage.removeItem('last_video_watch_time');
        router.refresh();
        router.push('/login');
      } catch (error: any) {
        toast({ variant: "destructive", title: "Termination Error" });
      }
    }
  };

  const isAdmin = user && user.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();

  return (
    <>
      {/* Mobile Top Branding - Elite APK Look */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[100] h-20 glass-morphism border-b border-white/10 flex items-center justify-between px-6 shadow-2xl">
        <Link href="/" className="flex items-center gap-4">
          <div className="h-11 w-11 bg-primary rounded-[1rem] flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3 transition-transform active:rotate-0">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic text-white">ARENA</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <WalletModal />
              <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
            </>
          ) : (
            <Button asChild size="sm" className="h-11 px-8 font-black uppercase tracking-widest rounded-2xl bg-primary shadow-xl shadow-primary/20 transition-transform active:scale-90">
              <Link href="/login">LOG IN</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Global Bottom-Bar / Top-Bar Navigation */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-[100] glass-morphism md:top-0 md:bottom-auto border-t md:border-t-0 md:border-b border-white/10",
        "h-24 md:h-20"
      )}>
        <div className="mx-auto flex h-full max-w-7xl items-center justify-around px-4 md:px-10 md:justify-between">
          <Link href="/" className="hidden items-center gap-5 md:flex group">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-primary text-white shadow-2xl shadow-primary/50 transition-all group-hover:rotate-12 group-hover:scale-110">
              <Trophy className="h-6 w-6" />
            </div>
            <span className="text-3xl font-black tracking-tighter text-white uppercase italic">BRACKET<span className="text-primary">BATTLES</span></span>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-12 w-full md:w-auto justify-around md:justify-start">
            <NavLink href="/" icon={<Home className="h-6 w-6" />} label="Home" active={pathname === '/'} />
            <NavLink href="/dashboard" icon={<Shield className="h-6 w-6" />} label="HQ" active={pathname === '/dashboard'} />
            <NavLink href="/earning-hub" icon={<Zap className="h-6 w-6" />} label="Earn" active={pathname === '/earning-hub'} />
            <NavLink href="/levels" icon={<Crown className="h-6 w-6" />} label="Tier" active={pathname === '/levels'} />
            <NavLink href="/ledger" icon={<Wallet className="h-6 w-6" />} label="Vault" active={pathname === '/ledger'} />
            {isAdmin && <NavLink href="/admin" icon={<Settings className="h-6 w-6" />} label="Admin" active={pathname === '/admin'} />}
          </div>

          <div className="hidden items-center gap-8 md:flex">
            {user ? (
              <>
                <WalletModal />
                <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
              </>
            ) : (
              <Button asChild className="font-black uppercase tracking-widest rounded-[1.25rem] px-12 h-14 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 transition-transform hover:scale-105">
                <Link href="/login">
                  <LogIn className="h-5 w-5 mr-3" /> LOGIN
                </Link>
              </Button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

function UserMenu({ user, isAdmin, onLogout }: any) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-12 w-12 rounded-[1.25rem] p-0 border-2 border-primary/40 bg-primary/10 overflow-hidden shadow-2xl transition-transform active:scale-90">
          <div className="h-full w-full flex items-center justify-center bg-primary text-white font-black text-lg italic">
            {user.email?.[0].toUpperCase() || 'U'}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-[#1a1a24] border-white/10 rounded-[2rem] p-3 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
        <DropdownMenuLabel className="p-5">
          <p className="font-black text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-2">Verified Warrior</p>
          <p className="text-base truncate font-black italic text-white">{user.email || user.phoneNumber}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5 mx-3" />
        <DropdownMenuItem asChild className="rounded-2xl h-14 focus:bg-primary/20 mb-1 px-4 cursor-pointer">
          <Link href="/dashboard" className="w-full flex items-center gap-3 font-black uppercase text-[11px] tracking-widest">
            <Activity className="h-4 w-4 text-primary" /> COMMAND HQ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-2xl h-14 focus:bg-secondary/20 mb-1 px-4 cursor-pointer">
          <Link href="/earning-hub" className="w-full flex items-center gap-3 font-black uppercase text-[11px] tracking-widest text-secondary">
            <Zap className="h-4 w-4" /> GLOBAL HUB
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild className="rounded-2xl h-14 focus:bg-primary/20 mb-1 px-4 cursor-pointer">
            <Link href="/admin" className="w-full flex items-center gap-3 text-primary font-black uppercase text-[11px] tracking-widest">
              <Shield className="h-4 w-4" /> ADMIN SECTOR
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-white/5 mx-3" />
        <DropdownMenuItem onSelect={onLogout} className="rounded-2xl h-14 text-destructive font-black uppercase text-[11px] tracking-widest cursor-pointer flex items-center gap-3 px-4 focus:bg-destructive focus:text-white">
          <LogOut className="h-4 w-4" /> TERMINATE SESSION
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link href={href} className={cn(
      "flex flex-col items-center gap-2 transition-all duration-500 md:flex-row md:gap-4 px-4 py-3 rounded-2xl relative group",
      active ? "text-primary bg-primary/10 font-black" : "text-muted-foreground hover:text-white hover:bg-white/5"
    )}>
      <span className={cn("transition-transform duration-500", active && "scale-125 rotate-6")}>{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.3em] md:text-sm italic">{label}</span>
      {active && <div className="hidden md:block absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-6 rounded-full bg-primary shadow-[0_0_15px_rgba(147,69,255,0.8)]" />}
    </Link>
  );
}