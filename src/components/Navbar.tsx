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
        toast({ title: "Signed Out", description: "Arena session terminated." });
        localStorage.removeItem('last_video_watch_time');
        router.refresh();
        router.push('/login');
      } catch (error: any) {
        toast({ variant: "destructive", title: "Logout Error" });
      }
    }
  };

  const isAdmin = user && user.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();

  return (
    <>
      {/* Mobile Top Branding */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 glass-morphism border-b border-white/5 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic">Arena</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <WalletModal />
              <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
            </>
          ) : (
            <Button asChild size="sm" className="h-9 px-6 font-black uppercase tracking-widest rounded-xl bg-primary">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Modern Navigation (Mobile Bottom / Desktop Top) */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 glass-morphism md:top-0 md:bottom-auto md:border-t-0 md:border-b",
        "h-20 md:h-20"
      )}>
        <div className="mx-auto flex h-full max-w-7xl items-center justify-around px-6 md:justify-between">
          <Link href="/" className="hidden items-center gap-4 md:flex group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30 transition-transform group-hover:rotate-12">
              <Trophy className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-foreground uppercase italic">Bracket<span className="text-primary">Battles</span></span>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-10 w-full md:w-auto justify-around md:justify-start">
            <NavLink href="/" icon={<Home className="h-5 w-5" />} label="Home" active={pathname === '/'} />
            <NavLink href="/dashboard" icon={<Shield className="h-5 w-5" />} label="HQ" active={pathname === '/dashboard'} />
            <NavLink href="/earning-hub" icon={<Zap className="h-5 w-5" />} label="Earn" active={pathname === '/earning-hub'} />
            <NavLink href="/levels" icon={<Crown className="h-5 w-5" />} label="Tier" active={pathname === '/levels'} />
            <NavLink href="/ledger" icon={<Wallet className="h-5 w-5" />} label="Vault" active={pathname === '/ledger'} />
            {isAdmin && <NavLink href="/admin" icon={<Settings className="h-5 w-5" />} label="Admin" active={pathname === '/admin'} />}
          </div>

          <div className="hidden items-center gap-6 md:flex">
            {user ? (
              <>
                <WalletModal />
                <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
              </>
            ) : (
              <Button asChild className="font-black uppercase tracking-widest rounded-2xl px-10 h-12 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" /> Login
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
        <Button variant="ghost" className="h-10 w-10 rounded-2xl p-0 border border-primary/20 bg-primary/10 overflow-hidden shadow-xl">
          <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground font-black text-sm italic">
            {user.email?.[0].toUpperCase() || 'U'}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-[#1a1a24] border-white/10 rounded-[1.5rem] p-2 shadow-2xl">
        <DropdownMenuLabel className="p-4">
          <p className="font-black text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Identity Confirmed</p>
          <p className="text-sm truncate font-black italic">{user.email || user.phoneNumber}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5 mx-2" />
        <DropdownMenuItem asChild className="rounded-xl h-11 focus:bg-primary/10">
          <Link href="/dashboard" className="cursor-pointer font-black uppercase text-[10px] tracking-widest">Arena Command</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-xl h-11 focus:bg-secondary/10">
          <Link href="/earning-hub" className="cursor-pointer font-black uppercase text-[10px] tracking-widest text-secondary">Global Hub</Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild className="rounded-xl h-11 focus:bg-primary/10">
            <Link href="/admin" className="cursor-pointer text-primary font-black uppercase text-[10px] tracking-widest">Admin Sector</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-white/5 mx-2" />
        <DropdownMenuItem onSelect={onLogout} className="rounded-xl h-11 text-destructive font-black uppercase text-[10px] tracking-widest cursor-pointer flex items-center gap-2 focus:bg-destructive focus:text-destructive-foreground">
          <LogOut className="h-4 w-4" /> Terminate Session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link href={href} className={cn(
      "flex flex-col items-center gap-1.5 transition-all duration-300 md:flex-row md:gap-3 px-3 py-2 rounded-xl",
      active ? "text-primary bg-primary/5 font-black" : "text-muted-foreground hover:text-white hover:bg-white/5"
    )}>
      <span className={cn("transition-transform", active && "scale-110")}>{icon}</span>
      <span className="text-[9px] font-black uppercase tracking-widest md:text-xs italic">{label}</span>
      {active && <div className="hidden md:block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
    </Link>
  );
}