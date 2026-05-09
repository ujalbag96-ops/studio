
'use client';

import Link from 'next/link';
import { Home, Zap, Wallet, LogIn, User, LogOut, Shield, Activity, UserPlus, Briefcase, Bell } from 'lucide-react';
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
  const { auth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: "SESSION TERMINATED" });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: "destructive", title: "TERMINATION FAILED" });
    }
  };

  const isAdmin = user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0a0a0f] border-b border-white/5 h-16 hidden md:block">
        <div className="max-w-7xl mx-auto h-full px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-primary shadow-2xl" />
            <span className="text-xl font-black italic text-white uppercase tracking-tighter">PLATFORM<span className="text-primary">CORE</span></span>
          </Link>

          <div className="flex items-center gap-8">
            <NavLink href="/" label="PORTAL" active={pathname === '/'} />
            <NavLink href="/dashboard" label="EXECUTIVE HUB" active={pathname === '/dashboard'} />
            <NavLink href="/inbox" label="SYSTEM INBOX" active={pathname === '/inbox'} />
            <NavLink href="/refer" label="AFFILIATE" active={pathname === '/refer'} />
            {isAdmin && <Link href="/admin" className="text-[10px] font-black uppercase text-accent italic flex items-center gap-1.5"><Shield className="h-3 w-3" /> ADMINISTRATION</Link>}
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <WalletModal />
                <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
              </>
            ) : (
              <Button asChild className="bg-primary font-black rounded-xl px-8 h-10 shadow-xl shadow-primary/20 uppercase italic text-[11px] tracking-widest">
                <Link href="/login">AUTHENTICATE</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="md:hidden fixed top-0 left-0 right-0 z-[100] h-16 bg-[#0a0a0f] border-b border-white/5 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="text-lg font-black italic uppercase">CORE</span>
        </Link>
        <div className="flex items-center gap-3">
          {user && <WalletModal />}
          <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] h-20 bg-[#0a0a0f] border-t border-white/5 flex items-center justify-around px-2 backdrop-blur-xl">
        <MobileNavItem active={pathname === '/'} icon={<Home />} label="PORTAL" href="/" />
        <MobileNavItem active={pathname === '/dashboard'} icon={<Activity />} label="HUB" href="/dashboard" />
        <MobileNavItem active={pathname === '/inbox'} icon={<Bell />} label="INBOX" href="/inbox" />
        <MobileNavItem active={pathname === '/refer'} icon={<UserPlus />} label="AFFILIATE" href="/refer" />
        <MobileNavItem active={pathname === '/ledger'} icon={<Wallet />} label="FINANCE" href="/ledger" />
      </nav>
    </>
  );
}

function NavLink({ href, label, active }: any) {
  return (
    <Link href={href} className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", active ? "text-primary italic" : "text-white/60 hover:text-white")}>
      {label}
    </Link>
  );
}

function UserMenu({ user, isAdmin, onLogout }: any) {
  // Safety check for user identity during SSR/Hydration
  const initial = user?.email?.[0] || user?.uid?.[0] || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 font-black uppercase text-xs text-primary">
          {initial}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#121216] border-white/10 text-white rounded-2xl w-56 shadow-2xl">
        <DropdownMenuLabel className="p-4 text-[8px] font-black uppercase tracking-widest text-muted-foreground">Identity Profile</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem asChild className="focus:bg-white/5 h-11"><Link href="/dashboard" className="w-full flex items-center gap-3 font-bold uppercase text-[10px]"><User className="h-4 w-4" /> Portfolio Hub</Link></DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild className="focus:bg-primary/20 h-11"><Link href="/admin" className="w-full flex items-center gap-3 font-bold uppercase text-[10px] text-primary italic"><Shield className="h-4 w-4" /> Executive Suite</Link></DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem onSelect={onLogout} className="h-11 text-red-500 font-bold uppercase text-[10px] cursor-pointer px-4"><LogOut className="h-4 w-4 mr-3" /> Terminate Session</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNavItem({ active, icon, label, href }: any) {
  return (
    <Link href={href} className={cn("flex flex-col items-center gap-1 px-4 py-2 transition-all", active ? "text-primary" : "text-muted-foreground opacity-60")}>
      <span className="h-5 w-5">{icon}</span>
      <span className="text-[8px] font-black uppercase">{label}</span>
    </Link>
  );
}
