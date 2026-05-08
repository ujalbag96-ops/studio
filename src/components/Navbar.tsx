'use client';

import Link from 'next/link';
import { Trophy, Home, Zap, Wallet, Settings, LogIn, User, LogOut, Shield, Crown, Activity, IndianRupee } from 'lucide-react';
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
        toast({ title: "Session Terminated" });
        router.push('/login');
      } catch (error: any) {
        toast({ variant: "destructive", title: "Termination Error" });
      }
    }
  };

  const isAdmin = user && user.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();

  return (
    <>
      {/* Top Bar for Desktop */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0F172A] border-b border-white/10 h-16 hidden md:block">
        <div className="max-w-7xl mx-auto h-full px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black italic text-white uppercase tracking-tighter">WINZO<span className="text-primary">PRO</span></span>
          </Link>

          <div className="flex items-center gap-8">
            <Link href="/" className={cn("text-xs font-black uppercase tracking-widest transition-colors", pathname === '/' ? "text-primary" : "text-white/60 hover:text-white")}>Home</Link>
            <Link href="/dashboard" className={cn("text-xs font-black uppercase tracking-widest transition-colors", pathname === '/dashboard' ? "text-primary" : "text-white/60 hover:text-white")}>My Battles</Link>
            <Link href="/earning-hub" className={cn("text-xs font-black uppercase tracking-widest transition-colors", pathname === '/earning-hub' ? "text-primary" : "text-white/60 hover:text-white")}>Refer & Earn</Link>
            {isAdmin && <Link href="/admin" className="text-xs font-black uppercase tracking-widest text-accent">Command</Link>}
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <WalletModal />
                <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
              </>
            ) : (
              <Button asChild className="bg-primary text-white font-black rounded-xl px-8 h-10 winzo-button-glow">
                <Link href="/login">LOGIN</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Top Branding */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[100] h-16 bg-[#0F172A] border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black italic text-white">WINZO</span>
        </div>
        <div className="flex items-center gap-3">
          {user && <WalletModal />}
          <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
        </div>
      </div>

      {/* Mobile Bottom Navigation (WinZO APK Style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] h-20 bg-[#1E1B4B] border-t border-white/10 flex items-center justify-around px-2">
        <MobileNavItem active={pathname === '/'} icon={<Home />} label="HOME" href="/" />
        <MobileNavItem active={pathname === '/dashboard'} icon={<Activity />} label="BATTLES" href="/dashboard" />
        <MobileNavItem active={pathname === '/earning-hub'} icon={<Zap />} label="REFER" href="/earning-hub" />
        <MobileNavItem active={pathname === '/levels'} icon={<Crown />} label="VIP" href="/levels" />
        <MobileNavItem active={pathname === '/ledger'} icon={<Wallet />} label="WALLET" href="/ledger" />
      </nav>
    </>
  );
}

function UserMenu({ user, isAdmin, onLogout }: any) {
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-9 rounded-lg p-0 border border-white/10 bg-white/5 overflow-hidden">
          <div className="h-full w-full flex items-center justify-center text-primary font-black uppercase">
            {user.email?.[0] || 'U'}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1E1B4B] border-white/10 text-white p-2 rounded-2xl w-56">
        <DropdownMenuLabel className="p-4">
          <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Signed In As</p>
          <p className="text-xs font-black truncate">{user.email || user.phoneNumber}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem asChild className="rounded-xl h-11 focus:bg-white/5 cursor-pointer">
          <Link href="/dashboard" className="w-full flex items-center gap-3 font-bold uppercase text-[10px] tracking-widest"><User className="h-4 w-4" /> My Profile</Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild className="rounded-xl h-11 focus:bg-primary/20 cursor-pointer">
            <Link href="/admin" className="w-full flex items-center gap-3 font-bold uppercase text-[10px] tracking-widest text-primary"><Shield className="h-4 w-4" /> Command Hub</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem onSelect={onLogout} className="rounded-xl h-11 text-destructive font-bold uppercase text-[10px] tracking-widest cursor-pointer focus:bg-destructive focus:text-white px-4">
          <LogOut className="h-4 w-4 mr-3" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNavItem({ active, icon, label, href }: any) {
  return (
    <Link href={href} className={cn("flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all", active ? "text-primary scale-110" : "text-muted-foreground opacity-60")}>
      <span className={cn("h-5 w-5", active && "animate-pulse")}>{icon}</span>
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
      {active && <div className="mt-1 h-1 w-4 bg-primary rounded-full shadow-[0_0_10px_#FF7B00]" />}
    </Link>
  );
}