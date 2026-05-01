'use client';

import { useUser } from '@/firebase';
import { MOCK_MATCHES } from '@/app/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Search, Save, UserCheck, RefreshCw, Lock, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // Redirect or show access denied if not the admin
  const isAuthorized = user && user.email === ADMIN_EMAIL;

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 text-center space-y-6">
        <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Access Denied</h1>
          <p className="text-muted-foreground text-sm">
            This dashboard is restricted to authorized administrators. 
            {user ? ` Logged in as: ${user.email}` : " Please log in to continue."}
          </p>
        </div>
        <Button onClick={() => router.push('/')} className="w-full font-bold">Return Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Admin Command Center
          </h1>
          <p className="text-muted-foreground font-medium">Welcome back, {user?.email}. System status: <span className="text-green-500 font-bold">OPERATIONAL</span></p>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="outline" className="font-bold border-border bg-card">
              <RefreshCw className="h-4 w-4 mr-2" /> Maintenance Mode: OFF
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Score Update Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Save className="h-5 w-5 text-primary" />
              Live Score Control
            </h2>
            <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">Active Matches: {MOCK_MATCHES.filter(m => m.status === 'live').length}</Badge>
          </div>
          <div className="grid gap-6">
            {MOCK_MATCHES.filter(m => m.status === 'live').map(match => (
              <Card key={match.id} className="border-l-4 border-l-primary shadow-lg hover:shadow-primary/5 transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{match.description}</span>
                    <Badge variant="destructive" className="animate-pulse">LIVE TRACKING</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-8 py-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">{match.teamA.name}</Label>
                      <Input type="number" defaultValue={match.scoreA} className="font-black text-2xl h-14 text-center bg-muted/30 focus:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">{match.teamB.name}</Label>
                      <Input type="number" defaultValue={match.scoreB} className="font-black text-2xl h-14 text-center bg-muted/30 focus:ring-secondary" />
                    </div>
                  </div>
                  <Button className="w-full font-bold h-12 text-lg shadow-xl shadow-primary/10">Publish Real-Time Update</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* User Monitoring & Security */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-secondary" />
            Security & User Monitoring
          </h2>
          <Card className="shadow-lg border-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg">Fraud Detection Panel</CardTitle>
              <CardDescription>Monitor Device IDs and Mobile Numbers to prevent multi-account exploitation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by mobile or device fingerprint..." className="pl-10 h-11" />
                </div>
                <Button variant="secondary" className="font-bold px-6">Search</Button>
              </div>

              <div className="space-y-3">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Recent Activity Flagged</p>
                 <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm p-3 bg-background rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="space-y-1">
                          <p className="font-black tracking-tight text-primary">+1 (555) 0123-456</p>
                          <p className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded inline-block uppercase">ID: ANDROID_882x112</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10">Ban Device</Button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 bg-background rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="space-y-1">
                          <p className="font-black tracking-tight text-primary">+1 (555) 9876-543</p>
                          <p className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded inline-block uppercase">ID: IOS_v15_xyz99</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10">Ban Device</Button>
                        </div>
                    </div>
                 </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-500 uppercase">System Insight</p>
                  <p className="text-[10px] text-amber-200/70 leading-relaxed">2 users detected using the same device fingerprint in the last 24 hours. Consider enabling strict hardware locking.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode; variant?: "destructive" | "default"; className?: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${variant === 'destructive' ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-primary/20 text-primary border border-primary/50'} ${className}`}>
      {children}
    </span>
  );
}
