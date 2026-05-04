
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, increment, writeBatch } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  Trophy, 
  CreditCard, 
  ArrowUpRight, 
  Settings, 
  ShieldCheck, 
  Ban, 
  Plus,
  TrendingUp,
  Activity,
  Clock,
  Lock,
  Loader2,
  Save,
  X,
  CreditCard as PaymentIcon,
  MousePointerClick,
  PlayCircle,
  Tv,
  Layers,
  CheckCircle2,
  History,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AppSettings, UserLedgerEntry } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'tournaments' | 'transactions' | 'settings' | 'cpalead' | 'videowall'>('dashboard');

  // Real-time Data Subscriptions
  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const matchesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'matches') : null, [firestore]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  
  // Transaction Ledger (Collection Group)
  const allTransactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'ledger'));
  }, [firestore]);

  const { data: usersData } = useCollection(usersQuery);
  const { data: matchesData } = useCollection(matchesQuery);
  const { data: settingsData } = useDoc<AppSettings>(settingsRef);
  const { data: transactionsData, isLoading: transactionsLoading } = useCollection<UserLedgerEntry & { userId: string }>(allTransactionsQuery);

  // Global Settings States
  const [cpaUrl, setCpaUrl] = useState('');
  const [cpaApiKey, setCpaApiKey] = useState('');
  const [cpaPostback, setCpaPostback] = useState('');
  const [gateways, setGateways] = useState<string[]>([]);
  const [newGateway, setNewGateway] = useState('');
  
  // Video Wall States
  const [videoProvider, setVideoProvider] = useState<'unity' | 'applovin'>('unity');
  const [videoPlacementId, setVideoPlacementId] = useState('');

  useEffect(() => {
    if (settingsData) {
      setCpaUrl(settingsData.cpaLeadUrl || '');
      setCpaApiKey(settingsData.cpaLeadApiKey || '');
      setCpaPostback(settingsData.cpaLeadPostbackUrl || '');
      setGateways(settingsData.withdrawalGateways || []);
      setVideoProvider(settingsData.videoAdProvider || 'unity');
      setVideoPlacementId(settingsData.videoAdPlacementId || '');
    }
  }, [settingsData]);

  const handleUpdateSettings = async () => {
    if (!firestore || !settingsRef) return;
    try {
      await setDoc(settingsRef, { 
        cpaLeadUrl: cpaUrl,
        cpaLeadApiKey: cpaApiKey,
        cpaLeadPostbackUrl: cpaPostback,
        withdrawalGateways: gateways,
        videoAdProvider: videoProvider,
        videoAdPlacementId: videoPlacementId
      }, { merge: true });
      toast({
        title: "Configuration Saved",
        description: "Your changes have been synced to the live app.",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };

  const handleTransactionAction = async (transaction: UserLedgerEntry & { userId: string }, status: 'completed' | 'failed') => {
    if (!firestore || !transaction.userId) return;

    try {
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', transaction.userId);
      const ledgerRef = doc(firestore, 'users', transaction.userId, 'ledger', transaction.id);

      // 1. Update Ledger Status
      batch.update(ledgerRef, { status });

      // 2. If rejection of a withdrawal, refund the coins
      if (status === 'failed' && transaction.type === 'withdrawal') {
        batch.update(userRef, {
          coins: increment(transaction.amount)
        });
      }

      await batch.commit();
      
      toast({
        title: status === 'completed' ? "Transaction Approved" : "Transaction Rejected",
        description: `The request for ₹${transaction.amount} has been processed.`,
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Process Error", description: error.message });
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isAuthorized = user?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="p-4 rounded-full bg-destructive/10 mb-6">
          <Lock className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Restricted Area</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">Access is strictly reserved for system administrators.</p>
        <Button onClick={() => window.location.href = '/login'} className="font-bold">Return to Login</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0d0d12] text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-card/30 backdrop-blur-2xl hidden md:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="font-black tracking-tighter text-lg">BATTLE<span className="text-primary">ADMIN</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
          <SidebarItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon />} label="Users" />
          <SidebarItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History />} label="Transactions" />
          <SidebarItem active={activeTab === 'cpalead'} onClick={() => setActiveTab('cpalead')} icon={<MousePointerClick />} label="CPA Lead Center" />
          <SidebarItem active={activeTab === 'videowall'} onClick={() => setActiveTab('videowall')} icon={<PlayCircle />} label="Video Wall" />
          <SidebarItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} label="Global Settings" />
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black uppercase">AD</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user?.email}</p>
              <p className="text-[9px] text-primary uppercase font-black tracking-widest">Root Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8 pb-24">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard title="Total Revenue" value={`₹12,450`} icon={<TrendingUp />} color="primary" trend="+12.5%" />
            <AnalyticsCard title="Active Users" value={usersData?.length?.toString() || "0"} icon={<UsersIcon />} color="secondary" trend="+5" />
            <AnalyticsCard title="Pending Withdrawals" value={transactionsData?.filter(t => t.type === 'withdrawal' && t.status === 'pending').length?.toString() || "0"} icon={<Clock />} color="yellow" trend="Needs Review" />
            <AnalyticsCard title="Live Matches" value={matchesData?.filter(m => m.status === 'live').length?.toString() || "0"} icon={<Activity />} color="destructive" trend="Live Now" />
          </div>
        )}

        {activeTab === 'transactions' && (
          <Card className="bg-card/30 backdrop-blur-xl border-white/5 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Global Transaction Ledger
                </CardTitle>
                <CardDescription>Review and manage all user deposit and withdrawal requests.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {transactionsLoading ? (
                <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader className="bg-black/20">
                    <TableRow className="border-white/5">
                      <TableHead className="pl-6">Date</TableHead>
                      <TableHead>User / Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-6">Management</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsData?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx) => (
                      <TableRow key={tx.id} className="border-white/5">
                        <TableCell className="text-xs font-mono pl-6">{tx.date}</TableCell>
                        <TableCell>
                          <p className="text-xs font-bold text-white/50">{tx.userId.slice(-6).toUpperCase()}</p>
                          <Badge variant="outline" className={cn(
                            "text-[8px] font-black uppercase py-0",
                            tx.type === 'withdrawal' ? "border-red-500/20 text-red-500" : "border-green-500/20 text-green-500"
                          )}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-black">₹{tx.amount}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "capitalize text-[10px] font-black",
                              tx.status === 'completed' && "bg-green-500/10 text-green-500",
                              tx.status === 'pending' && "bg-yellow-500/10 text-yellow-500",
                              tx.status === 'failed' && "bg-red-500/10 text-red-500"
                            )}
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          {tx.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0 rounded-lg"
                                onClick={() => handleTransactionAction(tx, 'completed')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="h-8 w-8 p-0 rounded-lg"
                                onClick={() => handleTransactionAction(tx, 'failed')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-bold uppercase">Processed</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'videowall' && (
          <Card className="bg-card/30 backdrop-blur-xl border-white/5 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter">
                <Tv className="h-6 w-6 text-primary" />
                Video Wall Configuration
              </CardTitle>
              <CardDescription>Manage your rewarded video ad providers and placement IDs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 rounded-2xl bg-black/20 border border-white/5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Ad Provider</label>
                    <Select value={videoProvider} onValueChange={(v: any) => setVideoProvider(v)}>
                      <SelectTrigger className="bg-black/40 border-white/10 h-12">
                        <SelectValue placeholder="Select Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unity">Unity Ads</SelectItem>
                        <SelectItem value="applovin">AppLovin Max</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Placement / Unit ID</label>
                    <Input 
                      value={videoPlacementId} 
                      onChange={(e) => setVideoPlacementId(e.target.value)} 
                      placeholder="e.g. Rewarded_Android" 
                      className="bg-black/40 border-white/10 h-12"
                    />
                  </div>
                </div>
                
                <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <p className="text-sm font-bold uppercase">Integration Status: <span className="text-primary">Ready</span></p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Changes saved here are reflected instantly in the User App's Rewards section. Ensure your SDK keys are correctly mapped in your project settings.
                  </p>
                </div>
              </div>
              <Button onClick={handleUpdateSettings} size="lg" className="w-full bg-primary font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                <Save className="h-5 w-5 mr-3" /> Update Video Wall Config
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Other tabs follow similar Card-based patterns */}
      </main>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
        active ? "bg-primary text-white shadow-lg shadow-primary/20 font-bold" : "text-muted-foreground hover:bg-white/5 hover:text-white"
      )}
    >
      <span className={cn("h-5 w-5 transition-transform group-hover:scale-110", active ? "text-white" : "text-muted-foreground")}>{icon}</span>
      <span className="text-sm tracking-tight">{label}</span>
    </button>
  );
}

function AnalyticsCard({ title, value, icon, color, trend }: { title: string, value: string, icon: React.ReactNode, color: string, trend: string }) {
  const colorMap: Record<string, string> = {
    primary: "text-primary bg-primary/10 border-primary/20",
    secondary: "text-secondary bg-secondary/10 border-secondary/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
    yellow: "text-amber-500 bg-amber-500/10 border-amber-500/20"
  };

  return (
    <Card className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", colorMap[color])}>
              {icon}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
              <h4 className="text-2xl font-black tracking-tighter">{value}</h4>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-black opacity-60">{trend}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
