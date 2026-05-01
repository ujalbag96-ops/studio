import Link from 'next/link';
import { Trophy, Swords, Wallet, Users, Settings, Home, Gift } from 'lucide-react';

export default function Navbar() {
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
          <NavLink href="/admin" icon={<Settings className="h-5 w-5" />} label="Admin" />
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5">
            <Wallet className="h-4 w-4 text-secondary" />
            <span className="text-sm font-semibold">1,250 🪙</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/40 p-0.5">
             <div className="h-full w-full rounded-full bg-primary" />
          </div>
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
