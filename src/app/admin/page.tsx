
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  Trophy, 
  CreditCard, 
  ArrowUpRight, 
  Settings, 
  ShieldCheck, 
  Search, 
  Ban, 
  Edit3, 
  Trash2, 
  Plus,
  TrendingUp,
  Activity,
  Clock,
  Lock,
  Loader2,
  Save,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AppSettings } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'tournaments' | 'payments' | 'withdrawals' | 'settings'>('dashboard');

  // Real-time Data Subscriptions
  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const matchesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'matches') : null, [firestore]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  
  const { data: usersData, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: matchesData, isLoading: matchesLoading } = useCollection(matchesQuery);
  const { data: settingsData, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);

  const [cpaUrl, setCpaUrl] = useState('');

  useEffect(() => {
    if (settingsData?.cpaLeadUrl) {
      setCpaUrl(settingsData.cpaLeadUrl);
    }
  }, [settingsData]);

  const handleUpdateSettings = async () => {
    if (!firestore || !settingsRef) return;
    try {
      await setDoc(settingsRef, { cpaLeadUrl: cpaUrl }, { merge: true });
      toast({
        title: "Settings Updated",
        description: "CPA Lead Offer Wall URL has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
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
        <p className="text-muted-foreground mb-8 max-w-sm">
          Access is strictly reserved for system administrators.
        </p>
        <Button onClick={() => window.location.href = '/login'} className="font-bold">Return to Login</Button>
      </div>
    );
  }

  const totalRevenue = 12450.00; 
  const activeUsersCount = usersData?.length || 0;
  const liveMatchesCount = matchesData?.filter(m => m.status === 'live').length || 0;
  const pendingRequests = 12;

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
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
          <SidebarItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon />} label="Users" />
          <SidebarItem active={activeTab === 'tournaments'} onClick={() => setActiveTab('tournaments')} icon={<Trophy />} label="Tournaments" />
          <SidebarItem active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={<CreditCard />} label="Payments" />
          <SidebarItem active={activeTab === 'withdrawals'} onClick={() => setActiveTab('withdrawals')} icon={<ArrowUpRight />} label="Withdrawals" />
          <SidebarItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} label="Settings" />
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
        {/* Analytics Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnalyticsCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={<TrendingUp />} color="primary" trend="+12.5%" />
          <AnalyticsCard title="Active Users" value={activeUsersCount.toString()} icon={<UsersIcon />} color="secondary" trend="+5" />
          <AnalyticsCard title="Live Matches" value={liveMatchesCount.toString()} icon={<Activity />} color="destructive" trend="Live Now" />
          <AnalyticsCard title="Pending Requests" value={pendingRequests.toString()} icon={<Clock />} color="yellow" trend="Needs Review" />
        </div>

        {/* Dynamic Content */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <Card className="xl:col-span-2 bg-card/30 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <UsersIcon className="h-5 w-5 text-primary" />
                      User Management
                    </CardTitle>
                    <CardDescription>Monitor wallet balances and account statuses.</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Filter users..." className="pl-9 bg-black/20 border-white/10 h-9 text-xs" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-black/20">
                      <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest pl-6">UserID</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">User Details</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Wallet</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest pr-6 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData?.map((u) => (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-mono text-[10px] text-muted-foreground pl-6">#{u.id.slice(-6).toUpperCase()}</TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold">{u.mobile || u.email || 'Anonymous'}</p>
                              <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">Device: {u.deviceId?.slice(0, 12) || '---'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20 font-black">
                              {u.coins?.toLocaleString() || 0} 🪙
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                              <Ban className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-secondary" />
                    Match Controller
                  </h3>
                  <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold">
                    <Plus className="h-4 w-4 mr-1" /> New Match
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {matchesData?.map((match) => (
                    <Card key={match.id} className="bg-card/20 backdrop-blur-lg border-white/5 hover:border-primary/30 transition-all group">
                      <CardContent className="p-5 space-y-4">
                        <Badge variant={match.status === 'live' ? 'destructive' : 'outline'} className={cn("text-[10px] font-black uppercase tracking-widest", match.status === 'live' && "animate-pulse")}>
                          {match.status}
                        </Badge>
                        <div className="flex items-center justify-between px-2">
                          <div className="text-center space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{match.teamA?.name}</p>
                            <p className="text-2xl font-black">{match.scoreA}</p>
                          </div>
                          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">VS</div>
                          <div className="text-center space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{match.teamB?.name}</p>
                            <p className="text-2xl font-black">{match.scoreB}</p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full h-8 text-[10px] font-black uppercase tracking-widest border-white/10">Update Live Score</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <Card className="max-w-2xl bg-card/30 backdrop-blur-xl border-white/5 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Global Application Settings
                </CardTitle>
                <CardDescription>Configure external integrations like CPA Lead Offer Walls.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">CPA Lead Offer Wall URL</label>
                  <div className="flex gap-2">
                    <Input 
                      value={cpaUrl} 
                      onChange={(e) => setCpaUrl(e.target.value)} 
                      placeholder="https://www.cpalead.com/mobile/offers.php?id=..." 
                      className="bg-black/20 border-white/10"
                    />
                    <Button onClick={handleUpdateSettings} className="bg-primary font-bold">
                      <Save className="h-4 w-4 mr-2" /> Save
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Enter the full iframe URL provided by your CPA Lead dashboard.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {['users', 'tournaments', 'payments', 'withdrawals'].includes(activeTab) && activeTab !== 'settings' && (
            <div className="h-[50vh] flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-white/5 rounded-3xl bg-card/10">
              <Activity className="h-12 w-12 text-primary opacity-20 animate-pulse" />
              <p className="text-muted-foreground font-medium italic">Section "{activeTab.toUpperCase()}" is under construction.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
        active ? "bg-primary text-white shadow-lg shadow-primary/20 font-bold" : "text-muted-foreground hover:bg-white/5 hover:text-white"
      )}
    >
      <span className={cn("h-5 w-5", active ? "text-white" : "text-muted-foreground")}>{icon}</span>
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
