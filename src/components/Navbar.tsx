
'use client';

import Link from 'next/link';
import { Home, Zap, Wallet, User, Bell, Trophy, Library, ShoppingBag } from 'lucide-react';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Button } from './ui/button';
import { useRouter, usePathname } from 'next/navigation';
import WalletModal from './WalletModal';
import { cn } from '@/lib/utils';
import { UserProfile, AppSettings } from '@/app/lib/types';
import { doc } from 'firebase/firestore';
import NavigationDrawer from './NavigationDrawer';

export default function Navbar() {
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  
  const { data: profile } = useDoc<UserProfile>(userRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const isIndia = profile?.country === 'India';

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-md border-b border-white/5 h-16 hidden md:block shadow-2xl">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <NavigationDrawer />
            <Link href="/" className="flex items-center gap-2 group">
              {settings?.customLogoUrl ? (
                <img src={settings.customLogoUrl} className="h-8 w-auto object-contain" alt="CampusHub" />
              ) : (
                <>
                  <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-black tracking-tighter text-white uppercase italic">Campus<span className="text-primary">Hub</span></span>
                </>
              )}
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <NavLink href="/" label="Arena" active={pathname === '/'} />
            {isIndia && <NavLink href="/campus" label="Library" active={pathname.startsWith('/campus')} />}
            <NavLink href="/earning-hub" label="Income" active={pathname === '/earning-hub'} />
            <NavLink href="/quiz-arena" label="Quiz" active={pathname === '/quiz-arena'} />
            <NavLink href="/shop" label="Withdraw" active={pathname === '/shop'} />
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
      <nav className="md:hidden fixed top-0 left-0 right-0 z-[100] h-16 bg-background/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6">
         <div className="flex items-center gap-4">
            <NavigationDrawer />
            {settings?.customLogoUrl ? (
               <img src={settings.customLogoUrl} className="h-7 w-auto object-contain" alt="CampusHub" />
            ) : (
               <span className="text-sm font-black italic tracking-tighter text-white uppercase">Campus<span className="text-primary">Hub</span></span>
            )}
         </div>
         <div className="flex items-center gap-3">
            {user && <WalletModal />}
         </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] h-16 bg-[#0a0a0f] border-t border-white/5 flex items-center justify-around px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <MobileNavItem active={pathname === '/'} icon={<Home className="w-5 h-5" />} label="Home" href="/" />
        <MobileNavItem active={pathname.startsWith('/campus')} icon={<Library className="w-5 h-5" />} label="Study" href="/campus" />
        <MobileNavItem active={pathname === '/quiz-arena'} icon={<Trophy className="w-5 h-5" />} label="Quiz" href="/quiz-arena" />
        <MobileNavItem active={pathname === '/earning-hub'} icon={<Zap className="w-5 h-5" />} label="Earn" href="/earning-hub" />
        <MobileNavItem active={pathname === '/dashboard'} icon={<User className="w-5 h-5" />} label="Me" href="/dashboard" />
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
