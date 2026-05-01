import { MOCK_MATCHES } from '@/app/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Search, Save, UserCheck, RefreshCw } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Authorized access only. Update scores and manage users securely.</p>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="outline" className="font-bold border-border">
              <RefreshCw className="h-4 w-4 mr-2" /> Maintenance Mode: OFF
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Score Update Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            Quick Score Updates
          </h2>
          <div className="grid gap-6">
            {MOCK_MATCHES.filter(m => m.status === 'live').map(match => (
              <Card key={match.id} className="border-l-4 border-l-primary">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase">{match.description}</span>
                    <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">{match.teamA.name}</Label>
                      <Input type="number" defaultValue={match.scoreA} className="font-bold text-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">{match.teamB.name}</Label>
                      <Input type="number" defaultValue={match.scoreB} className="font-bold text-lg" />
                    </div>
                  </div>
                  <Button className="w-full font-bold">Update Live Score</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* User Search Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-secondary" />
            User & Security Management
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>User Search</CardTitle>
              <CardDescription>Filter users by Mobile Number or Device ID to investigate multi-account usage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by mobile or device ID..." className="pl-10" />
                </div>
                <Button variant="secondary" className="font-bold">Search</Button>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                 <div className="flex justify-between items-center text-sm p-2 bg-card rounded border">
                    <div className="space-y-1">
                       <p className="font-bold">+1 (555) 0123-456</p>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Device: ANDROID_882x112</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-bold">Restrict Account</Button>
                 </div>
                 <div className="flex justify-between items-center text-sm p-2 bg-card rounded border">
                    <div className="space-y-1">
                       <p className="font-bold">+1 (555) 9876-543</p>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Device: IOS_v15_xyz99</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-bold">Restrict Account</Button>
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
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${variant === 'destructive' ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-primary/20 text-primary border border-primary/50'} ${className}`}>
      {children}
    </span>
  );
}
