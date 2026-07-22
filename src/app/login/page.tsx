
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
import { Loader2, ShieldCheck, Eye, EyeOff, Mail, Hash, ShieldAlert, Zap, ShieldX, Globe, GraduationCap, Coins, CheckSquare, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RiskDisclosureModal from '@/components/RiskDisclosureModal';
import { cn } from '@/lib/utils';
import { UserIntent } from '../lib/types';

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
  
  const [intent, setIntent] = useState<UserIntent>('student');
  const [agreedToAds, setAgreedToAds] = useState(false);

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
      } catch(e) { console.error("Geo-IP Node restricted"); }

      if (ipData.proxy) {
         setIsSuspended(true);
         toast({ variant: "destructive", title: "IDENTITY BLOCKED", description: "VPN or Proxy signal detected." });
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
          bonusBalance: 200, 
          taskBalance: 0,
          coins: 200,
          rank: 'Bronze',
          primaryIntent: intent,
          agreementAccepted: agreedToAds,
          referralCode: randomCode,
          referredBy: l1Upline,
          referredByL2: l2Upline,
          vipLevel: 0, 
          cpaTasksCount: 0,
          generalTasksCount: 0,
          totalReferrals: 0,
          joinedAt: new Date().toISOString(),
          country: ipData.country,
          geo_region: ipData.geo_region,
          lastIp: ipData.ip,
          isSuspended: ipData.proxy
        });
      }
    } catch (err) { console.error("Identity instantiation failure", err); }
  };

  const handleEmailAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth) return;
    
    if (authMode === 'signup' && !agreedToAds) {
      toast({ variant: "destructive", title: "AGREEMENT REQUIRED", description: "Please accept the ad-funding terms to proceed." });
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

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8 animate-in fade-in duration-700">
      <div className="text-center space-y-3">
        <div className="h-20 w-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
          <ShieldCheck className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Identity <span className="text-primary">Gate</span></h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">Industrial Hybrid Hub v11.0</p>
      </div>

      <Tabs value={authMode} onValueChange={(val) => setAuthMode(val as any)} className="w-full">
        <TabsList className="grid grid-cols-2 h-14 bg-white/5 p-1 rounded-2xl border border-white/5">
          <TabsTrigger value="login" className="font-black text-[9px] data-[state=active]:bg-primary rounded-xl uppercase">Login Hub</TabsTrigger>
          <TabsTrigger value="signup" className="font-black text-[9px] data-[state=active]:bg-primary rounded-xl uppercase">Register Node</TabsTrigger>
        </TabsList>

        <TabsContent value="signup" className="mt-6 space-y-6">
           <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Select Your Primary Intent</p>
              <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => setIntent('student')}
                  className={cn(
                    "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                    intent === 'student' ? "border-primary bg-primary/10 text-white" : "border-white/5 bg-white/5 text-muted-foreground"
                  )}
                 >
                    <GraduationCap className={cn("h-6 w-6", intent === 'student' && "text-primary animate-bounce")} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Student</span>
                 </button>
                 <button 
                  onClick={() => setIntent('earner')}
                  className={cn(
                    "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                    intent === 'earner' ? "border-amber-500 bg-amber-500/10 text-white" : "border-white/5 bg-white/5 text-muted-foreground"
                  )}
                 >
                    <Coins className={cn("h-6 w-6", intent === 'earner' && "text-amber-500 animate-pulse")} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Earner</span>
                 </button>
              </div>
           </div>

           <form onSubmit={handleEmailAuth} className="space-y-4">
              <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email Terminal</Label>
                       <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Set Pass</Label>
                       <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl" />
                    </div>
                 </div>

                 <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <button type="button" onClick={() => setAgreedToAds(!agreedToAds)} className="mt-1">
                       {agreedToAds ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest">
                       I agree that ads are used to maintain free scholar resources and fund my pocket money dividends.
                    </p>
                 </div>

                 <Button type="submit" disabled={isLoading || !agreedToAds} className="w-full h-16 bg-primary font-black uppercase italic text-lg rounded-2xl">
                   {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'INITIALIZE NODE'}
                 </Button>
              </Card>
           </form>
        </TabsContent>

        <TabsContent value="login" className="mt-6">
           <form onSubmit={handleEmailAuth} className="space-y-4">
              <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email Terminal</Label>
                       <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Access Pass</Label>
                       <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl" />
                    </div>
                 </div>
                 <Button type="submit" disabled={isLoading} className="w-full h-16 bg-primary font-black uppercase italic text-lg rounded-2xl shadow-xl">
                   {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'RE-SYNC SIGNAL'}
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
