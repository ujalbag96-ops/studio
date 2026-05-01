import { MOCK_LEDGER } from '@/app/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react';

export default function LedgerPage() {
  const stats = {
    totalDeposit: MOCK_LEDGER.filter(l => l.type === 'deposit').reduce((acc, curr) => acc + curr.amount, 0),
    totalWithdrawal: MOCK_LEDGER.filter(l => l.type === 'withdrawal').reduce((acc, curr) => acc + curr.amount, 0),
    totalIncome: MOCK_LEDGER.filter(l => l.type === 'income').reduce((acc, curr) => acc + curr.amount, 0),
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          Financial Ledger
        </h1>
        <div className="flex items-center gap-2 rounded-xl bg-card border px-6 py-3">
          <span className="text-muted-foreground text-sm font-medium">Available Balance:</span>
          <span className="text-2xl font-black text-secondary">1,250 🪙</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Deposits" value={`$${stats.totalDeposit.toFixed(2)}`} icon={<ArrowDownCircle className="text-green-500" />} />
        <StatCard title="Total Withdrawals" value={`$${stats.totalWithdrawal.toFixed(2)}`} icon={<ArrowUpCircle className="text-red-500" />} />
        <StatCard title="Referral Income" value={`$${stats.totalIncome.toFixed(2)}`} icon={<TrendingUp className="text-primary" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_LEDGER.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.date}</TableCell>
                  <TableCell className="capitalize">{entry.type}</TableCell>
                  <TableCell className={entry.type === 'withdrawal' ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                    {entry.type === 'withdrawal' ? '-' : '+'}${entry.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.status === 'completed' ? 'default' : 'outline'} className={entry.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50' : ''}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-black tracking-tight">{value}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
