
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, ArrowUpRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { UserProfile, UserLedgerEntry } from '@/app/lib/types';

export default function LedgerPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Real-time Data
  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  const ledgerQuery = useMemoFirebase(() => 
    (firestore && user) ? collection(firestore, 'users', user.uid, 'ledger') : null, 
    [firestore, user]
  );

  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const { data: ledgerData, isLoading: isLedgerLoading } = useCollection<UserLedgerEntry>(ledgerQuery);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Wallet className="h-16 w-16 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-bold">Please log in to view your ledger</h2>
        <Button asChild><Link href="/login">Go to Login</Link></Button>
      </div>
    );
  }

  const stats = {
    totalDeposit: ledgerData?.filter(l => l.type === 'deposit').reduce((acc, curr) => acc + curr.amount, 0) || 0,
    totalWithdrawal: ledgerData?.filter(l => l.type === 'withdrawal').reduce((acc, curr) => acc + curr.amount, 0) || 0,
    totalIncome: ledgerData?.filter(l => l.type === 'income').reduce((acc, curr) => acc + curr.amount, 0) || 0,
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          Financial Ledger
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-card border px-6 py-3">
            <span className="text-muted-foreground text-sm font-medium">Balance:</span>
            <span className="text-2xl font-black text-secondary">
              {isProfileLoading ? "..." : (profile?.coins?.toLocaleString() || 0)} 🪙
            </span>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 font-black px-8 rounded-xl shadow-lg shadow-primary/20">
            <Link href="/withdraw">
              <ArrowUpRight className="h-4 w-4 mr-2" /> WITHDRAW
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Deposits" value={`₹${stats.totalDeposit.toFixed(2)}`} icon={<ArrowDownCircle className="text-green-500" />} />
        <StatCard title="Total Withdrawals" value={`₹${stats.totalWithdrawal.toFixed(2)}`} icon={<ArrowUpCircle className="text-red-500" />} />
        <StatCard title="Total Income" value={`₹${stats.totalIncome.toFixed(2)}`} icon={<TrendingUp className="text-primary" />} />
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLedgerLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : ledgerData && ledgerData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entry) => (
                  <TableRow key={entry.id} className="border-white/5">
                    <TableCell className="font-medium text-xs text-muted-foreground">{entry.date}</TableCell>
                    <TableCell className="capitalize text-sm font-bold">{entry.type}</TableCell>
                    <TableCell className={entry.type === 'withdrawal' ? 'text-red-400 font-black' : 'text-green-400 font-black'}>
                      {entry.type === 'withdrawal' ? '-' : '+'}₹{entry.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "capitalize text-[10px] font-black",
                          entry.status === 'completed' && "bg-green-500/10 text-green-500 border-green-500/20",
                          entry.status === 'pending' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                          entry.status === 'failed' && "bg-red-500/10 text-red-500 border-red-500/20"
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
            <div className="text-center py-12 text-muted-foreground italic">No transactions found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-black tracking-tight">{value}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
