
'use client';

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { UserLedgerEntry } from '@/app/lib/types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  Share2, 
  Shield, 
  Trophy,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Globe
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface TransactionReceiptProps {
  transaction: UserLedgerEntry | null;
  onClose: () => void;
}

export default function TransactionReceipt({ transaction, onClose }: TransactionReceiptProps) {
  if (!transaction) return null;

  const isPositive = transaction.type === 'income' || transaction.type === 'deposit' || transaction.type === 'referral';
  const txHash = `TX-${transaction.id.substring(0, 8).toUpperCase()}-${Date.now().toString().substring(8)}`;
  const currency = transaction.currencySymbol || (transaction.type === 'withdrawal' ? '₹' : '');

  return (
    <Dialog open={!!transaction} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-sm rounded-[2.5rem] p-0 overflow-hidden">
        <VisuallyHidden.Root>
          <DialogTitle>Transaction Receipt Details</DialogTitle>
        </VisuallyHidden.Root>
        <div className="relative p-8 space-y-6">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-4 pt-4">
             <div className={cn(
               "h-16 w-16 rounded-2xl flex items-center justify-center shadow-2xl rotate-3",
               transaction.status === 'completed' ? "bg-green-500/20 text-green-500 border border-green-500/20" :
               transaction.status === 'pending' ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/20" :
               "bg-red-500/20 text-red-500 border border-red-500/20"
             )}>
                {transaction.status === 'completed' ? <CheckCircle2 className="h-8 w-8" /> : 
                 transaction.status === 'pending' ? <Clock className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
             </div>
             <div>
               <h3 className="text-xl font-black uppercase tracking-tight italic">Transaction Verified</h3>
               <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">{transaction.date}</p>
             </div>
          </div>

          <div className="space-y-6 pt-4">
             <div className="text-center py-6 border-y border-white/5 space-y-1">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Amount Transferred</p>
                <h2 className={cn(
                  "text-5xl font-black tracking-tighter tabular-nums",
                  isPositive ? "text-green-400" : "text-red-400"
                )}>
                  {isPositive ? '+' : '-'}{transaction.type === 'withdrawal' ? `${currency}${transaction.amount.toFixed(2)}` : `${transaction.amount} 🪙`}
                </h2>
                <Badge variant="outline" className="border-white/10 text-[8px] font-black uppercase px-3 py-1">
                   {transaction.type} Protocol
                </Badge>
             </div>

             <div className="grid gap-4">
                <DetailRow label="Status" value={
                  <span className={cn(
                    "font-black uppercase italic",
                    transaction.status === 'completed' ? "text-green-500" : transaction.status === 'pending' ? "text-yellow-500" : "text-red-500"
                  )}>{transaction.status}</span>
                } />
                <DetailRow label="Auth Hash" value={txHash} />
                <DetailRow label="Operational Hub" value={<div className="flex items-center gap-1.5"><Globe className="h-2 w-2" /> Global Secure</div>} />
                <div className="pt-2">
                   <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Briefing</p>
                   <p className="text-xs font-medium leading-relaxed">{transaction.description || 'Standard Arena Operation'}</p>
                </div>
             </div>
          </div>

          <div className="flex gap-3 pt-4">
             <Button variant="outline" className="flex-1 rounded-xl border-white/10 h-12 text-[10px] font-black uppercase tracking-widest hover:bg-white/5">
                <Download className="h-3 w-3 mr-2" /> Save
             </Button>
             <Button className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                <Share2 className="h-3 w-3 mr-2" /> Share
             </Button>
          </div>

          <div className="flex justify-center pt-2">
             <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase opacity-40 italic">
                <Shield className="h-2 w-2" /> Bracket Battles Encryption Active
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-[10px]">
       <span className="font-black uppercase text-muted-foreground tracking-widest">{label}</span>
       <span className="font-bold text-white truncate max-w-[150px]">{value}</span>
    </div>
  );
}
