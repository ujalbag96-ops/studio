
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit, updateDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, Eye, EyeOff, Mail, Hash, ShieldAlert, Zap, ShieldX, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RiskDisclosureModal from '@/components/RiskDisclosureModal';

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
  const [isSuspended, setIsSuspended] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

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

      // --- INDUSTRIAL GEO-IP & VPN GATEWAY ---
      let ipData = { ip: 'Unknown', country: 'Global', region: 'Unknown', city: 'Unknown', proxy: false, geo_region: 'Global' };
      try {
         const res = await fetch('https://ipapi.co/json/');
         const data = await res.json();
         
         const isVpnDetected = data.security?.vpn || data.security?.proxy || data.org?.toLowerCase().includes('vpn') || data.org?.toLowerCase().includes('proxy');
         
         ipData = { 
           ip: data.ip, 
           country: data.country_name,
           region: data.region,
           city: data.city,
           proxy: isVpnDetected || false,
           geo_region: data.country_name === 'India' ? 'India' : 'Global'
         };
      } catch(e) {
         console.error("Geo-IP Node restricted");
      }

      if (ipData.proxy) {
         setIsSuspended(true);
         toast({ variant: "destructive", title: "IDENTITY BLOCKED", description: "VPN or Proxy signal detected. High-performance access restricted." });
      }

      if (!snap.exists()) {
        const referralCodeFromUrl = searchParams.get('ref');
        let l1Upline = '';
        let l2Upline = '';

        if (referralCodeFromUrl) {
          const q = query(collection(firestore, 'users'), where('referralCode', '==', referralCodeFromUrl), limit(1));
          const uplineSnap = await getDocs(q);
          if (!uplineSnap.empty) {
            l1Upline = uplineSnap.docs[0].id;
            l2Upline = uplineSnap.docs[0].data().referredBy || '';
          }
        }

        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        await setDoc(userDocRef, {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          depositBalance: 0,
          winningBalance: 0,
          bonusBalance: 2000, 
          taskBalance: 0,
          coins: 2000,
          rank: 'Bronze',
          referralCode: randomCode,
          referredBy: l1Upline,
          referredByL2: l2Upline,
          vipLevel: 0, 
          cpaTasksCount: 0,
          generalTasksCount: 0,
          totalReferrals: 0,
          engagementCount: 0,
          tasksCompletedCount: 0,
          riskNoticeAccepted: false,
          lastIp: ipData.ip,
          country: ipData.country,
          geo_region: ipData.geo_region,
          preferredLanguage: ipData.geo_region === 'India' ? 'or' : 'en',
          preferredEduSource: ipData.geo_region === 'India' ? 'NCERT' : 'OpenStax',
          isSuspended: ipData.proxy,
          joinedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(userDocRef, {
           lastIp: ipData.ip,
           isSuspended: (snap.data().isSuspended || ipData.proxy)
        });
      }
    } catch (err) {
      console.error("Identity instantiation failure", err);
    }
  };

  const handleEmailAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth) return;
    
    if (authMode === 'signup' && !showLegalModal) {
      setShowLegalModal(true);
      return;
    }

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

  if (isSuspended) {
    return (
      <div className="max-w-md mx-auto p-12 pt-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
         <div className="h-28 w-28 bg-red-500/10 rounded-[3rem] flex items-center justify-center mx-auto border-2 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <ShieldX className="h-12 w-12 text-red-500 animate-pulse" />
         </div>
         <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Identity <span className="text-red-500">Locked</span></h2>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
               Industrial Security Shield has detected a VPN/Proxy signal. Multi-accounting and automated traffic is strictly prohibited.
            </p>
         </div>
         <Button onClick={() => window.location.reload()} className="h-14 px-8 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl">RETRY SIGNAL</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8 animate-in fade-in duration-700">
      <RiskDisclosureModal isOpen={showLegalModal} onOpenChange={setShowLegalModal} onAccepted={() => handleEmailAuth()} />

      <div className="text-center space-y-3">
        <div className="h-20 w-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
          <ShieldCheck className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Identity <span className="text-primary">Gate</span></h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">Automated Regional Access Protocol</p>
      </div>

      <Tabs value={authMode} onValueChange={(val) => setAuthMode(val as any)} className="w-full">
        <TabsList className="grid grid-cols-2 h-14 bg-white/5 p-1 rounded-2xl border border-white/5">
          <TabsTrigger value="login" className="font-black text-[9px] data-[state=active]:bg-primary rounded-xl uppercase"><Mail className="h-3 w-3 mr-1.5" /> Login Hub</TabsTrigger>
          <TabsTrigger value="signup" className="font-black text-[9px] data-[state=active]:bg-primary rounded-xl uppercase"><Hash className="h-3 w-3 mr-1.5" /> Register Node</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-6">
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
                   {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'INITIATE LOGIN'}
                 </Button>
              </Card>
           </form>
        </TabsContent>

        <TabsContent value="signup" className="mt-6">
           <form onSubmit={handleEmailAuth} className="space-y-4">
              <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Identity Email</Label>
                    <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl font-bold" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Set Access Pass</Label>
                    <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl font-mono" />
                 </div>
                 <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-center gap-3">
                    <Globe className="h-4 w-4 text-primary" />
                    <p className="text-[9px] font-black uppercase text-white tracking-widest italic">Regional Catalog Auto-Assignment Active</p>
                 </div>
                 <Button type="submit" disabled={isLoading} className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase text-lg italic rounded-2xl shadow-xl">
                   {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'CREATE IDENTITY'}
                 </Button>
              </Card>
           </form>
        </TabsContent>
      </Tabs>
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
