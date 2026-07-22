
'use client';

import Link from 'next/link';
import { Home, Zap, Wallet, User, LogOut, Shield, GraduationCap, Library, Bell, Trophy, Gamepad2, ShoppingBag } from 'lucide-react';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import WalletModal from './WalletModal';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/app/lib/types';
import { doc } from 'firebase/firestore';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function Navbar() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: "Session Terminated" });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Termination Error" });
    }
  };

  const isAdmin = user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isIndia = profile?.country === 'India';

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-md border-b border-white/5 h-16 hidden md:block shadow-2xl">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase italic">Campus<span className="text-primary">Hub</span></span>
          </Link>

          <div className="flex items-center gap-6">
            <NavLink href="/" label="Arena" active={pathname === '/'} />
            {isIndia && <NavLink href="/campus" label="Library" active={pathname.startsWith('/campus')} />}
            <NavLink href="/earning-hub" label="Income" active={pathname === '/earning-hub'} />
            <NavLink href="/games" label="Arcade" active={pathname === '/games'} />
            <NavLink href="/shop" label="Withdraw" active={pathname === '/shop'} />
            {isAdmin && <Link href="/admin" className="text-[11px] font-black uppercase text-amber-500 flex items-center gap-1.5 italic"><Shield className="h-3.5 w-3.5" /> Admin</Link>}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/inbox" className="relative group">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/40 transition-all">
                    <Bell className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary" />
                  </div>
                </Link>
                <WalletModal />
                <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
              </>
            ) : (
              <Button asChild className="bg-primary hover:bg-primary/90 font-black rounded-xl px-6 h-9 uppercase text-[10px] tracking-widest italic shadow-xl shadow-primary/20">
                <Link href="/login">Identity Gate</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] h-16 bg-card border-t border-white/10 flex items-center justify-around px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <MobileNavItem active={pathname === '/'} icon={<Home className="w-5 h-5" />} label="Home" href="/" />
        {isIndia ? (
          <MobileNavItem active={pathname.startsWith('/campus')} icon={<Library className="w-5 h-5" />} label="Library" href="/campus" />
        ) : (
          <MobileNavItem active={pathname === '/shop'} icon={<ShoppingBag className="w-5 h-5" />} label="Withdraw" href="/shop" />
        )}
        <MobileNavItem active={pathname === '/earning-hub'} icon={<Zap className="w-5 h-5" />} label="Income" href="/earning-hub" />
        <MobileNavItem active={pathname === '/dashboard'} icon={<User className="w-5 h-5" />} label="Profile" href="/dashboard" />
      </nav>
    </>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={cn(
      "text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-lg italic",
      active ? "text-primary bg-primary/10 shadow-inner" : "text-muted-foreground hover:text-white hover:bg-white/5"
    )}>
      {label}
    </Link>
  );
}

function UserMenu({ user, onLogout }: any) {
  const initial = user?.email?.[0] || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-9 rounded-lg border border-white/10 bg-card font-black uppercase text-xs text-primary shadow-xl hover:border-primary/40">
          {initial}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#0a0a0f] border-white/10 text-white rounded-2xl w-56 shadow-2xl p-2">
        <DropdownMenuLabel className="px-4 py-3 text-[9px] font-black uppercase text-muted-foreground tracking-widest italic">Master Identity</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5 mx-2" />
        <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary rounded-xl h-11 cursor-pointer">
          <Link href="/dashboard" className="w-full flex items-center gap-3 font-black uppercase text-[9px] italic"><User className="h-4 w-4" /> Portfolio</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary rounded-xl h-11 cursor-pointer">
          <Link href="/ledger" className="w-full flex items-center gap-3 font-black uppercase text-[9px] italic"><Wallet className="h-4 w-4" /> Transactions</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/5 mx-2" />
        <DropdownMenuItem onSelect={onLogout} className="h-11 text-red-500 focus:bg-red-500/10 focus:text-red-500 font-black uppercase text-[9px] cursor-pointer rounded-xl px-4 italic">
          <LogOut className="h-4 w-4 mr-3" /> Terminate Session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNavItem({ active, icon, label, href }: { active: boolean; icon: any; label: string; href: string }) {
  return (
    <Link href={href} className={cn(
      "flex flex-col items-center justify-center gap-1 w-14 transition-all duration-500",
      active ? "text-primary -translate-y-1" : "text-muted-foreground"
    )}>
      <div className={cn(
        "p-2.5 rounded-2xl transition-all duration-500",
        active ? "bg-primary/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : ""
      )}>
        {icon}
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest italic">{label}</span>
    </Link>
  );
}
