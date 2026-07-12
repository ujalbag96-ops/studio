
'use client';

import Link from 'next/link';
import { Home, Zap, Wallet, User, LogOut, Shield, Activity, Radio, ShoppingBag, Trophy, Target } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import WalletModal from './WalletModal';
import { cn } from '@/lib/utils';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function Navbar() {
  const { user } = useUser();
  const auth = useAuth(); // Returns Auth instance directly
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: "Logout Successful" });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error Logging Out" });
    }
  };

  const isAdmin = user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0a0a0f] border-b border-white/5 h-16 hidden md:block">
        <div className="max-w-7xl mx-auto h-full px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black italic text-white uppercase tracking-tighter">WIN<span className="text-primary">ZO</span></span>
          </Link>

          <div className="flex items-center gap-8">
            <NavLink href="/" label="Home" active={pathname === '/'} />
            <NavLink href="/esports-live" label="E-Sports" active={pathname === '/esports-live'} />
            <NavLink href="/cricket" label="Cricket" active={pathname === '/cricket'} />
            <NavLink href="/predictions" label="Polls" active={pathname === '/predictions'} />
            <NavLink href="/shop" label="Redeem Shop" active={pathname === '/shop'} />
            {isAdmin && <Link href="/admin" className="text-[10px] font-bold uppercase text-amber-500 italic flex items-center gap-1.5 animate-pulse"><Shield className="h-3 w-3" /> Admin Hub</Link>}
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <WalletModal />
                <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
              </>
            ) : (
              <Button asChild className="bg-primary font-black rounded-xl px-8 h-10 uppercase text-[11px]">
                <Link href="/login">Join Arena</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[100] h-16 bg-[#0a0a0f] border-b border-white/5 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-lg font-black italic uppercase">WINZO</span>
        </Link>
        <div className="flex items-center gap-3">
          {user && <WalletModal />}
          <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] h-20 bg-[#0a0a0f] border-t border-white/5 flex items-center justify-around px-2">
        <MobileNavItem active={pathname === '/'} icon={<Home />} label="Home" href="/" />
        <MobileNavItem active={pathname === '/esports-live'} icon={<Radio />} label="E-Sports" href="/esports-live" />
        <MobileNavItem active={pathname === '/predictions'} icon={<Target />} label="Polls" href="/predictions" />
        <MobileNavItem active={pathname === '/leaderboard'} icon={<Trophy />} label="Ranks" href="/leaderboard" />
        <MobileNavItem active={pathname === '/dashboard'} icon={<Activity />} label="Profile" href="/dashboard" />
      </nav>
    </>
  );
}

function NavLink({ href, label, active }: any) {
  return (
    <Link href={href} className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", active ? "text-primary italic underline underline-offset-8" : "text-white/60 hover:text-white")}>
      {label}
    </Link>
  );
}

function UserMenu({ user, isAdmin, onLogout }: any) {
  const initial = user?.email?.[0] || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 font-black uppercase text-xs text-primary">
          {initial}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#121216] border-white/10 text-white rounded-xl w-56 shadow-2xl">
        <DropdownMenuLabel className="p-4 text-[10px] font-bold uppercase text-muted-foreground">Warrior Account</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem asChild className="focus:bg-white/5 h-11 cursor-pointer"><Link href="/dashboard" className="w-full flex items-center gap-3 font-bold uppercase text-[10px]"><User className="h-4 w-4" /> Portfolio</Link></DropdownMenuItem>
        <DropdownMenuItem asChild className="focus:bg-white/5 h-11 cursor-pointer"><Link href="/shop" className="w-full flex items-center gap-3 font-bold uppercase text-[10px] text-primary"><ShoppingBag className="h-4 w-4" /> WinZO Shop</Link></DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild className="focus:bg-primary/20 h-11 cursor-pointer"><Link href="/admin" className="w-full flex items-center gap-3 font-bold uppercase text-[10px] text-amber-500 italic"><Shield className="h-4 w-4" /> Admin Hub</Link></DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem onSelect={onLogout} className="h-11 text-red-500 font-bold uppercase text-[10px] cursor-pointer px-4"><LogOut className="h-4 w-4 mr-3" /> Terminate Session</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNavItem({ active, icon, label, href }: any) {
  return (
    <Link href={href} className={cn("flex flex-col items-center gap-1 px-4 py-2 transition-all", active ? "text-primary scale-110" : "text-muted-foreground opacity-60")}>
      <span className="h-5 w-5">{icon}</span>
      <span className="text-[8px] font-bold uppercase">{label}</span>
    </Link>
  );
}
