
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, orderBy, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  ArrowUpCircle, 
  TrendingUp, 
  ArrowUpRight, 
  Loader2,
  History,
  Zap,
  Coins,
  FileText,
  Calendar,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { UserProfile, UserLedgerEntry } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import TransactionReceipt from '@/components/TransactionReceipt';
import { getCurrencyData } from '@/lib/currency';

export default function LedgerPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [selectedTx, setSelectedTx] = useState<UserLedgerEntry | null>(null);
  const [timeFilter, setTimeFilter] = useState<'30days' | 'all'>('30days');

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  
  const ledgerQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    const baseQuery = collection(firestore, 'users', user.uid, 'ledger');
    
    if (timeFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateString = thirtyDaysAgo.toISOString().split('T')[0];
      
      return query(
        baseQuery,
        where('date', '>=', dateString),
        orderBy('date', 'desc')
      );
    }
    
    return query(baseQuery, orderBy('date', 'desc'));
  }, [firestore, user, timeFilter]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const { data: ledgerData, isLoading: isLedgerLoading } = useCollection<UserLedgerEntry>(ledgerQuery);

  const currencyData = getCurrencyData(profile?.country);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050508]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center p-6 bg-[#050508]">
        <div className="h-20 w-20 bg-muted/10 rounded-[2.5rem] flex items-center justify-center border border-white/5">
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

  const income = ledgerData?.filter(l => l.type === 'income' || l.type === 'referral').reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const withdrawals = ledgerData?.filter(l => l.type === 'withdrawal').reduce((acc, curr) => acc + curr.amount, 0) || 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <TransactionReceipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />

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
              <p className="text-xl font-black text-secondary tabular-nums">
                {isProfileLoading ? "---" : (profile?.winningBalance?.toLocaleString() || 0)} 🪙
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
          title="30D Income" 
          value={`${currencyData.symbol}${(income / currencyData.rateToCoins).toFixed(2)}`} 
          icon={<TrendingUp className="text-green-500" />} 
          description={`Earnings in local ${currencyData.code}`}
        />
        <SummaryCard 
          title="Volume Sent" 
          value={`${currencyData.symbol}${(withdrawals).toFixed(2)}`} 
          icon={<ArrowUpCircle className="text-red-500" />} 
          description="Total withdrawal requests"
        />
        <SummaryCard 
          title="Asset Value" 
          value={`${currencyData.symbol}${((profile?.coins || 0) / currencyData.rateToCoins).toFixed(2)}`} 
          icon={<Wallet className="text-primary" />} 
          description="Combined account worth"
        />
      </div>

      <Card className="bg-card/20 border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardHeader className="p-8 border-b border-white/5 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
               <Zap className="h-4 w-4 text-primary" />
               Transaction Stream
             </CardTitle>
             <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Encrypted financial data feed • {profile?.country}</p>
          </div>
          
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
             <Button 
               onClick={() => setTimeFilter('30days')}
               variant={timeFilter === '30days' ? 'secondary' : 'ghost'} 
               className="h-9 rounded-lg text-[9px] font-black uppercase tracking-widest px-4"
             >
               Last 30 Days
             </Button>
             <Button 
               onClick={() => setTimeFilter('all')}
               variant={timeFilter === 'all' ? 'secondary' : 'ghost'} 
               className="h-9 rounded-lg text-[9px] font-black uppercase tracking-widest px-4"
             >
               Full Archive
             </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLedgerLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : ledgerData && ledgerData.length > 0 ? (
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="px-8 font-black uppercase text-[9px] tracking-widest">Description / Date</TableHead>
                  <TableHead className="font-black uppercase text-[9px] tracking-widest text-center">Protocol</TableHead>
                  <TableHead className="font-black uppercase text-[9px] tracking-widest text-right">Volume</TableHead>
                  <TableHead className="px-8 font-black uppercase text-[9px] tracking-widest text-right">Operational Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerData.map((entry) => {
                   const isPositive = entry.type === 'income' || entry.type === 'deposit' || entry.type === 'referral';
                   const entryCurrency = entry.currencySymbol || (entry.type === 'withdrawal' ? '₹' : '');
                   return (
                    <TableRow key={entry.id} onClick={() => setSelectedTx(entry)} className="border-white/5 hover:bg-white/5 transition-all group cursor-pointer">
                      <TableCell className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <FileText className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                             <p className="text-sm font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                               {entry.description || entry.type}
                             </p>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1.5 ml-5">
                            <Calendar className="h-2.5 w-2.5" /> {entry.date}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[9px] font-black uppercase border-white/10 px-3 bg-white/5 italic">
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={cn(
                          "text-lg font-black tracking-tighter tabular-nums",
                          isPositive ? 'text-green-400' : 'text-red-400'
                        )}>
                          {isPositive ? '+' : '-'}
                          {entry.type === 'withdrawal' ? `${entryCurrency}${entry.amount.toFixed(2)}` : `${entry.amount} 🪙`}
                        </div>
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        <div className="flex items-center justify-end gap-3">
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg group-hover:bg-white/10">
                             <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                   );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-32 text-center space-y-4">
               <History className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
               <p className="text-sm text-muted-foreground italic font-black uppercase tracking-[0.4em]">No operational data for this period.</p>
               <Button onClick={() => setTimeFilter('all')} variant="link" className="text-primary font-black uppercase text-[10px]">Access Full Archives</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description: string }) {
  return (
    <Card className="bg-card/40 border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-primary/20 transition-all shadow-xl">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-700">
         {icon}
      </div>
      <div className="relative z-10 space-y-6">
        <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform">
          {icon}
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 italic">{title}</p>
          <h4 className="text-4xl font-black tracking-tighter italic tabular-nums">{value}</h4>
          <p className="text-[9px] font-bold text-muted-foreground mt-3 uppercase tracking-widest">{description}</p>
        </div>
      </div>
    </Card>
  );
}
