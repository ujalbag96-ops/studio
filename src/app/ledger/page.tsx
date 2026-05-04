
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  TrendingUp, 
  ArrowUpRight, 
  Loader2,
  History,
  Zap,
  Gift,
  Coins
} from 'lucide-react';
import Link from 'next/link';
import { UserProfile, UserLedgerEntry } from '@/app/lib/types';
import { cn } from '@/lib/utils';

export default function LedgerPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  
  const ledgerQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'ledger'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const { data: ledgerData, isLoading: isLedgerLoading } = useCollection<UserLedgerEntry>(ledgerQuery);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center p-6">
        <div className="h-20 w-20 bg-muted rounded-[2.5rem] flex items-center justify-center border border-white/5">
          <Wallet className="h-10 w-10 text-muted-foreground opacity-20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Vault Locked</h2>
          <p className="text-muted-foreground font-medium">Identify yourself to access your financial history.</p>
        </div>
        <Button asChild size="lg" className="rounded-2xl font-black px-12 h-14 bg-primary shadow-xl">
          <Link href="/login">LOGIN TO VAULT</Link>
        </Button>
      </div>
    );
  }

  const income = ledgerData?.filter(l => l.type === 'income').reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const withdrawals = ledgerData?.filter(l => l.type === 'withdrawal').reduce((acc, curr) => acc + curr.amount, 0) || 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
            <History className="h-4 w-4" />
            Operational History
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
            Financial <span className="text-primary">Ledger</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Card className="bg-black/40 border-white/5 backdrop-blur-md rounded-2xl px-6 py-3 flex items-center gap-4">
            <div>
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Winning Balance</p>
              <p className="text-xl font-black text-secondary">
                {isProfileLoading ? "---" : (profile?.withdrawableCoins?.toLocaleString() || 0)} 🪙
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
               <Coins className="h-5 w-5 text-secondary" />
            </div>
          </Card>
          <Button asChild className="bg-primary hover:bg-primary/90 h-14 rounded-2xl font-black px-8 shadow-xl shadow-primary/20">
            <Link href="/withdraw">WITHDRAW <ArrowUpRight className="h-5 w-5 ml-2" /></Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          title="Total Income" 
          value={`₹${(income / 10).toFixed(2)}`} 
          icon={<TrendingUp className="text-green-500" />} 
          description="Earnings from Ads & Tasks"
        />
        <SummaryCard 
          title="Pending/Paid Out" 
          value={`₹${(withdrawals / 1).toFixed(2)}`} 
          icon={<ArrowUpCircle className="text-red-500" />} 
          description="Total withdrawal volume"
        />
        <SummaryCard 
          title="Current Worth" 
          value={`₹${((profile?.coins || 0) / 10).toFixed(2)}`} 
          icon={<Wallet className="text-primary" />} 
          description="Combined account value"
        />
      </div>

      <Card className="bg-card/20 border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5 bg-white/5">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Transaction Stream
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLedgerLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : ledgerData && ledgerData.length > 0 ? (
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Description</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Type</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Amount</TableHead>
                  <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerData.map((entry) => (
                  <TableRow key={entry.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                    <TableCell className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                          {entry.description || entry.type}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{entry.date}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[9px] font-black uppercase border-white/10 px-3">
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={cn(
                        "text-lg font-black tracking-tighter",
                        entry.type === 'withdrawal' || entry.type === 'entry_fee' ? 'text-red-400' : 'text-green-400'
                      )}>
                        {entry.type === 'withdrawal' || entry.type === 'entry_fee' ? '-' : '+'}
                        {entry.type === 'withdrawal' ? `₹${entry.amount.toFixed(2)}` : `${entry.amount} 🪙`}
                      </div>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <Badge 
                        className={cn(
                          "capitalize text-[9px] font-black px-4 py-1 rounded-lg",
                          entry.status === 'completed' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                          entry.status === 'pending' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : 
                          "bg-red-500/10 text-red-500 border-red-500/20"
                        )}
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-32 text-center space-y-4">
               <History className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
               <p className="text-sm text-muted-foreground italic font-black uppercase tracking-[0.2em]">No financial data detected.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description: string }) {
  return (
    <Card className="bg-card/40 border-white/5 rounded-[2rem] p-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
         {icon}
      </div>
      <div className="relative z-10 space-y-4">
        <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{title}</p>
          <h4 className="text-3xl font-black tracking-tighter">{value}</h4>
          <p className="text-[9px] font-bold text-muted-foreground mt-2 italic">{description}</p>
        </div>
      </div>
    </Card>
  );
}
