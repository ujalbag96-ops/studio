
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
  Globe,
  X,
  CreditCard as PaymentIcon,
  MousePointerClick,
  Key,
  Link as LinkIcon,
  ExternalLink,
  PlayCircle,
  Tv
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AppSettings } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'tournaments' | 'payments' | 'withdrawals' | 'settings' | 'cpalead' | 'videowall'>('dashboard');

  // Real-time Data Subscriptions
  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const matchesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'matches') : null, [firestore]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  
  const { data: usersData, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: matchesData, isLoading: matchesLoading } = useCollection(matchesQuery);
  const { data: settingsData, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);

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
        title: "Settings Updated",
        description: "Global application configuration saved successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    }
  };

  const addGateway = () => {
    if (newGateway.trim() && !gateways.includes(newGateway.trim())) {
      setGateways([...gateways, newGateway.trim()]);
      setNewGateway('');
    }
  };

  const removeGateway = (index: number) => {
    setGateways(gateways.filter((_, i) => i !== index));
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
          <SidebarItem active={activeTab === 'cpalead'} onClick={() => setActiveTab('cpalead')} icon={<MousePointerClick />} label="CPA Lead" />
          <SidebarItem active={activeTab === 'videowall'} onClick={() => setActiveTab('videowall')} icon={<PlayCircle />} label="Video Wall" />
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
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard title="Total Revenue" value={`₹12,450`} icon={<TrendingUp />} color="primary" trend="+12.5%" />
            <AnalyticsCard title="Active Users" value={usersData?.length?.toString() || "0"} icon={<UsersIcon />} color="secondary" trend="+5" />
            <AnalyticsCard title="Live Matches" value={matchesData?.filter(m => m.status === 'live').length?.toString() || "0"} icon={<Activity />} color="destructive" trend="Live Now" />
            <AnalyticsCard title="Pending Requests" value="12" icon={<Clock />} color="yellow" trend="Needs Review" />
          </div>
        )}

        <div className="space-y-8">
          {activeTab === 'dashboard' && (
            <Card className="bg-card/30 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-primary" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-black/20">
                      <TableRow className="border-white/5">
                        <TableHead className="pl-6">UserID</TableHead>
                        <TableHead>User Details</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead className="text-right pr-6">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData?.slice(0, 10).map((u) => (
                        <TableRow key={u.id} className="border-white/5">
                          <TableCell className="font-mono text-[10px] pl-6">#{u.id.slice(-6).toUpperCase()}</TableCell>
                          <TableCell>
                            <p className="text-sm font-bold">{u.mobile || u.email || 'Anonymous'}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                              {u.coins?.toLocaleString() || 0} 🪙
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Ban className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
            </Card>
          )}

          {activeTab === 'videowall' && (
            <Card className="bg-card/30 backdrop-blur-xl border-white/5 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tv className="h-5 w-5 text-primary" />
                  Video Wall (Watch & Earn) Settings
                </CardTitle>
                <CardDescription>Configure video ad providers for rewarded video content.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ad Provider</label>
                    <Select value={videoProvider} onValueChange={(v: any) => setVideoProvider(v)}>
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Select Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unity">Unity Ads</SelectItem>
                        <SelectItem value="applovin">AppLovin Max</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Placement / Unit ID</label>
                    <Input 
                      value={videoPlacementId} 
                      onChange={(e) => setVideoPlacementId(e.target.value)} 
                      placeholder="e.g. Rewarded_Android" 
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                </div>
                <Button onClick={handleUpdateSettings} className="w-full bg-primary font-bold">
                  <Save className="h-4 w-4 mr-2" /> Save Video Config
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'cpalead' && (
            <Card className="bg-card/30 backdrop-blur-xl border-white/5 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointerClick className="h-5 w-5 text-primary" />
                  CPA Lead Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                   <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Offer Wall URL</label>
                    <Input value={cpaUrl} onChange={(e) => setCpaUrl(e.target.value)} className="bg-black/20 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">API Key</label>
                    <Input type="password" value={cpaApiKey} onChange={(e) => setCpaApiKey(e.target.value)} className="bg-black/20 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Postback URL</label>
                    <Input value={cpaPostback} onChange={(e) => setCpaPostback(e.target.value)} className="bg-black/20 border-white/10" />
                  </div>
                </div>
                <Button onClick={handleUpdateSettings} className="w-full bg-primary font-bold">
                  <Save className="h-4 w-4 mr-2" /> Sync CPA Data
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card className="bg-card/30 backdrop-blur-xl border-white/5 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PaymentIcon className="h-5 w-5 text-secondary" />
                  Withdrawal Gateways
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input value={newGateway} onChange={(e) => setNewGateway(e.target.value)} placeholder="Add method (e.g. UPI)" className="bg-black/20 border-white/10" />
                  <Button onClick={addGateway} className="bg-secondary text-secondary-foreground">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {gateways.map((g, i) => (
                    <Badge key={i} className="flex items-center gap-2 bg-white/5 py-1.5">
                      {g}
                      <button onClick={() => removeGateway(i)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
                <Button onClick={handleUpdateSettings} className="w-full bg-primary font-bold">
                  <Save className="h-4 w-4 mr-2" /> Sync Gateways
                </Button>
              </CardContent>
            </Card>
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
