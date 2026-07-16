
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit, addDoc, increment } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, Eye, EyeOff, LifeBuoy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

function LoginContent() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportData, setSupportData] = useState({ contact: '', issue: '' });

  useEffect(() => {
    if (user && !isUserLoading) {
      const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      router.push(isAdmin ? '/admin' : '/dashboard');
    }
  }, [user, isUserLoading, router]);

  const syncUserProfile = async (firebaseUser: any) => {
    if (!firestore) return;
    try {
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const snap = await getDoc(userDocRef);

      let deviceId = localStorage.getItem('bb_device_id');
      if (!deviceId) {
        deviceId = 'DEV-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
        localStorage.setItem('bb_device_id', deviceId);
      }

      // Geo-IP Integration
      let ipData = { ip: 'Unknown', country: 'Global' };
      try {
         const res = await fetch('https://ipapi.co/json/');
         const data = await res.json();
         ipData = { ip: data.ip, country: data.country_name };
      } catch(e) {
         console.error("Geo-IP node unreachable");
      }

      if (!snap.exists()) {
        const referralCodeFromUrl = searchParams.get('ref');
        let l1Upline = '';
        let l2Upline = '';

        if (referralCodeFromUrl) {
          const q = query(collection(firestore, 'users'), where('referralCode', '==', referralCodeFromUrl), limit(1));
          const uplineSnap = await getDocs(q);
          if (!uplineSnap.empty) {
            const l1Data = uplineSnap.docs[0].data();
            l1Upline = uplineSnap.docs[0].id;
            l2Upline = l1Data.referredBy || '';
            await setDoc(doc(firestore, 'users', l1Upline), { totalReferrals: increment(1) }, { merge: true });
          }
        }

        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        await setDoc(userDocRef, {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          depositBalance: 0,
          winningBalance: 0,
          bonusBalance: 0,
          taskBalance: 0,
          referralCommissionBalance: 0,
          coins: 0,
          rank: 'Bronze',
          referralCode: randomCode,
          referredBy: l1Upline,
          referredByL2: l2Upline,
          mlmLevel: 0,
          tasksCompletedCount: 0,
          totalReferrals: 0,
          networkTaskCompletions: 0,
          totalNetworkRevenue: 0,
          isAccountActivated: false,
          deviceId: deviceId,
          lastIp: ipData.ip,
          country: ipData.country,
          status: 'active',
          isSuspended: false,
          joinedAt: new Date().toISOString()
        });
      } else {
        await setDoc(userDocRef, { lastIp: ipData.ip, deviceId: deviceId, country: ipData.country }, { merge: true });
      }
    } catch (err) {
      console.error("Identity instantiation failure", err);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    try {
      let userCredential;
      if (authMode === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      await syncUserProfile(userCredential.user);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Access Denied", description: e.message });
      setIsLoading(false);
    }
  };

  const handleSupportSubmit = async () => {
    if (!firestore || !supportData.contact || !supportData.issue) return;
    setIsLoading(true);
    try {
      await addDoc(collection(firestore, 'support_tickets'), {
        userContact: supportData.contact,
        description: supportData.issue,
        status: 'open',
        priority: 'high',
        type: 'recovery',
        timestamp: new Date().toISOString()
      });
      toast({ title: "TICKET LOGGED", description: "Priority recovery request sent to Admin." });
      setShowSupportModal(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Protocol Failure" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8 animate-in fade-in duration-700">
      <div className="text-center space-y-3">
        <div className="h-20 w-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
          <ShieldCheck className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Warrior <span className="text-primary">Enlist</span></h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">Industrial Identity Protocol Active</p>
      </div>

      <Tabs value={authMode} onValueChange={(val) => setAuthMode(val as any)} className="w-full">
        <TabsList className="grid grid-cols-2 h-14 bg-white/5 p-1 rounded-2xl border border-white/5">
          <TabsTrigger value="login" className="font-black text-[10px] data-[state=active]:bg-primary rounded-xl uppercase">Sign In</TabsTrigger>
          <TabsTrigger value="signup" className="font-black text-[10px] data-[state=active]:bg-primary rounded-xl uppercase">Register</TabsTrigger>
        </TabsList>

        <TabsContent value={authMode} className="mt-6">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email Terminal</Label>
                 <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl font-bold" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Access Pass</Label>
                 <div className="relative">
                    <Input required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl pr-12 font-mono" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                 </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase text-lg italic rounded-2xl shadow-xl">
                {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (authMode === 'login' ? 'INITIATE LOGIN' : 'CREATE ACCOUNT')}
              </Button>
              <div className="text-center">
                 <button type="button" onClick={() => setShowSupportModal(true)} className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto">
                    <LifeBuoy className="h-3 w-3" /> Forgot Access / Support
                 </button>
              </div>
            </Card>
          </form>
        </TabsContent>
      </Tabs>

      <Dialog open={showSupportModal} onOpenChange={setShowSupportModal}>
         <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-md rounded-[2rem]">
            <DialogHeader>
               <DialogTitle className="text-xl font-black uppercase italic">Access Recovery</DialogTitle>
               <DialogDescription className="text-xs uppercase font-bold text-muted-foreground">Log a priority ticket for manual verification</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground">Alternative Contact (WhatsApp/Email)</Label>
                  <Input value={supportData.contact} onChange={e => setSupportData({...supportData, contact: e.target.value})} className="bg-black border-white/10" placeholder="e.g. +91 98765..." />
               </div>
               <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground">Brief Your Issue</Label>
                  <Textarea value={supportData.issue} onChange={e => setSupportData({...supportData, issue: e.target.value})} className="bg-black border-white/10 min-h-24" placeholder="Forgot password, Account blocked, etc." />
               </div>
            </div>
            <DialogFooter>
               <Button onClick={handleSupportSubmit} disabled={isLoading} className="w-full h-14 bg-primary font-black uppercase italic rounded-xl">DISPATCH REQUEST</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
