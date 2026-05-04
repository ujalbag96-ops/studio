
'use client';

import Link from 'next/link';
import { Trophy, Home, Gift, Wallet, Settings, LogIn, User, LogOut, LayoutDashboard, Crown, Zap } from 'lucide-react';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import { UserProfile } from '@/app/lib/types';
import WalletModal from './WalletModal';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function Navbar() {
  const { user } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
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
        toast({
          title: "Signed Out",
          description: "Session cleared successfully.",
        });
        // Clear local storage if any specific session data was stored
        localStorage.removeItem('last_video_watch_time');
        
        // Force refresh to clear all provider states
        router.refresh();
        router.push('/login');
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Logout Error",
          description: error.message,
        });
      }
    }
  };

  const isAdmin = user && user.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-card/80 backdrop-blur-md border-b flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="text-lg font-black tracking-tighter">B-BATTLES</span>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <WalletModal />
              <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
            </>
          ) : (
            <Button asChild size="sm" className="h-9 px-4 font-bold rounded-xl">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Main Navigation (Bottom for mobile, Top for desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/80 backdrop-blur-md md:top-0 md:bottom-auto md:border-t-0 md:border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-around px-4 md:justify-between">
          <Link href="/" className="hidden items-center gap-2 md:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Trophy className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">BRACKET<span className="text-primary">BATTLES</span></span>
          </Link>
          
          <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-around md:justify-start">
            <NavLink href="/" icon={<Home className="h-5 w-5" />} label="Home" />
            <NavLink href="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} label="Dash" />
            <NavLink href="/earning-hub" icon={<Zap className="h-5 w-5 text-secondary" />} label="Earn" />
            <NavLink href="/vip" icon={<Crown className="h-5 w-5 text-amber-400" />} label="VIP" />
            <NavLink href="/ledger" icon={<Wallet className="h-5 w-5" />} label="Ledger" />
            {isAdmin && <NavLink href="/admin" icon={<Settings className="h-5 w-5" />} label="Admin" />}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <>
                <WalletModal />
                <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
              </>
            ) : (
              <Button asChild size="sm" className="font-bold rounded-xl px-6">
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
        <Button variant="ghost" className="h-10 w-10 rounded-full p-0 border border-primary/20 bg-primary/10 overflow-hidden">
          <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground font-black text-xs">
            {user.email?.[0].toUpperCase() || user.phoneNumber?.slice(-2) || <User className="h-5 w-5" />}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Account</p>
          <p className="text-sm truncate font-bold">{user.email || user.phoneNumber}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer">My Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/earning-hub" className="cursor-pointer font-bold text-secondary">Earning Hub</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/vip" className="cursor-pointer font-bold text-amber-500">VIP Club</Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer text-primary font-bold">Admin Panel</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} className="text-destructive font-bold cursor-pointer flex items-center gap-2 focus:bg-destructive focus:text-destructive-foreground">
          <LogOut className="h-4 w-4" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary md:flex-row md:gap-2">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tight md:text-xs">{label}</span>
    </Link>
  );
}
