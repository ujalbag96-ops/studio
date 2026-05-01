'use client';

import Link from 'next/link';
import { Trophy, Home, Gift, Wallet, Settings, LogIn, User } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function Navbar() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  const isAdmin = user && user.email === ADMIN_EMAIL;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/80 backdrop-blur-md md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-around px-4 md:justify-between">
        <Link href="/" className="hidden items-center gap-2 md:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Trophy className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">BRACKET<span className="text-primary">BATTLES</span></span>
        </Link>
        
        <div className="flex items-center gap-6 md:gap-8">
          <NavLink href="/" icon={<Home className="h-5 w-5" />} label="Home" />
          <NavLink href="/tournaments" icon={<Trophy className="h-5 w-5" />} label="Events" />
          <NavLink href="/rewards" icon={<Gift className="h-5 w-5" />} label="Rewards" />
          <NavLink href="/ledger" icon={<Wallet className="h-5 w-5" />} label="Ledger" />
          {isAdmin && <NavLink href="/admin" icon={<Settings className="h-5 w-5" />} label="Admin" />}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 border border-border/50">
                <Wallet className="h-4 w-4 text-secondary" />
                <span className="text-sm font-semibold">1,250 🪙</span>
              </div>
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
                    <p className="font-black text-xs uppercase tracking-widest text-muted-foreground">My Account</p>
                    <p className="text-sm truncate">{user.email || user.phoneNumber}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/ledger" className="cursor-pointer">Wallet & Ledger</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer text-primary font-bold">Admin Console</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive font-bold cursor-pointer">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm" className="font-bold">
              <Link href="/login">
                <LogIn className="h-4 w-4 mr-2" /> Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary md:flex-row md:gap-2">
      {icon}
      <span className="text-[10px] font-medium md:text-sm">{label}</span>
    </Link>
  );
}