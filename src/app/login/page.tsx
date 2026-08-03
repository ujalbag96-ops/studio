
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, CheckSquare, Square, GraduationCap, Coins, ShieldAlert, Fingerprint, Mail, Briefcase, UserCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UserIntent, LanguageCode } from '../lib/types';

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
  const [isSuspended, setIsSuspended] = useState(false);
  
  const [intent, setIntent] = useState<UserIntent>('earner');
  const [agreedToAds, setAgreedToAds] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const getPersistentDeviceId = () => {
    if (typeof window === 'undefined') return 'unknown';
    let id = localStorage.getItem('campushub_device_id');
    if (!id) {
      id = 'CH-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('campushub_device_id', id);
    }
    return id;
  };

  useEffect(() => {
    if (auth && isSignInWithEmailLink(auth, window.location.href)) {
      let emailForVerification = window.localStorage.getItem('emailForSignIn');
      if (!emailForVerification) {
        emailForVerification = window.prompt('Please provide your email for verification');
      }
      if (emailForVerification) {
        setIsLoading(true);
        signInWithEmailLink(auth, emailForVerification, window.location.href)
          .then(async (result) => {
            window.localStorage.removeItem('emailForSignIn');
            await syncUserProfile(result.user);
            toast({ title: "VERIFICATION SUCCESS", description: "Identity verified via Gmail Link." });
          })
          .catch((err) => {
            toast({ variant: "destructive", title: "VERIFICATION FAILED", description: err.message });
            setIsLoading(false);
          });
      }
    }

    if (user && !isUserLoading) {
      const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      router.push(isAdmin ? '/admin' : '/dashboard');
    }
  }, [user, isUserLoading, router, auth]);

  const syncUserProfile = async (firebaseUser: any) => {
    if (!firestore) return;
    try {
      const deviceId = getPersistentDeviceId();
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

      const deviceQuery = query(collection(firestore, 'users'), where('deviceId', '==', deviceId), limit(5));
      const deviceSnap = await getDocs(deviceQuery);
      
      const isMultiAccount = !snap.exists() && deviceSnap.size >= 1; 

      if (ipData.proxy || isMultiAccount) {
         setIsSuspended(true);
         toast({ 
           variant: "destructive", 
           title: "IDENTITY BLOCKED", 
           description: isMultiAccount ? "Multiple accounts detected on this device (IMEI Lock)." : "VPN or Proxy signal detected." 
         });
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
        const isOdisha = ipData.region.toLowerCase() === 'odisha';
        const defaultLang: LanguageCode = isOdisha ? 'or' : 'en';

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
          scholarPoints: 0,
          preferredLanguage: defaultLang,
          joinedAt: new Date().toISOString(),
          country: ipData.country,
          geo_region: ipData.region, 
          lastIp: ipData.ip,
          deviceId: deviceId,
          isSuspended: ipData.proxy || isMultiAccount,
          emailVerified: firebaseUser.emailVerified || false
        });
      } else {
        await setDoc(userDocRef, { 
          lastIp: ipData.ip, 
          isSuspended: ipData.proxy || snap.data().isSuspended 
        }, { merge: true });
      }
    } catch (err) { console.error("Identity instantiation failure", err); }
  };

  const handleEmailAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth) return;
    
    if (authMode === 'signup' && !agreedToAds) {
      toast({ variant: "destructive", title: "AGREEMENT REQUIRED", description: "Please accept the terms to proceed." });
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'signup') {
        const actionCodeSettings = {
          url: window.location.origin + '/login',
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        setVerificationSent(true);
        toast({ title: "GMAIL VERIFICATION SENT", description: "Please click the link sent to your Gmail to complete signup." });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        await syncUserProfile(userCredential.user);
      }
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
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Campus<span className="text-primary">Hub</span> Identity</h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">Global Earning & Learning Protocol</p>
      </div>

      {verificationSent ? (
        <Card className="bg-[#0a0a0f] border-primary/20 border-2 rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl">
           <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="h-10 w-10 text-primary animate-pulse" />
           </div>
           <div className="space-y-4">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">Check Your Gmail</h2>
              <p className="text-xs text-muted-foreground font-bold leading-relaxed uppercase">
                We've sent a unique verification link to <span className="text-white">{email}</span>. Click the link in the email to instantly verify your node and login.
              </p>
           </div>
           <Button onClick={() => setVerificationSent(false)} variant="outline" className="w-full h-12 rounded-xl border-white/10 font-black uppercase text-[10px]">Change Email</Button>
        </Card>
      ) : (
        <Tabs value={authMode} onValueChange={(val) => setAuthMode(val as any)} className="w-full">
          <TabsList className="grid grid-cols-2 h-14 bg-white/5 p-1 rounded-2xl border border-white/5">
            <TabsTrigger value="login" className="font-black text-[9px] data-[state=active]:bg-primary rounded-xl uppercase">Login</TabsTrigger>
            <TabsTrigger value="signup" className="font-black text-[9px] data-[state=active]:bg-primary rounded-xl uppercase">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="mt-6 space-y-6">
             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center italic">Identify Your Primary Intent</p>
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
                      <Briefcase className={cn("h-6 w-6", intent === 'earner' && "text-amber-500 animate-pulse")} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Earn / Pro</span>
                   </button>
                </div>
             </div>

             <form onSubmit={handleEmailAuth} className="space-y-4">
                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Gmail Address</Label>
                         <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl" placeholder="Verify via Gmail Link" />
                      </div>
                   </div>

                   <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <button type="button" onClick={() => setAgreedToAds(!agreedToAds)} className="mt-1">
                         {agreedToAds ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                      </button>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest">
                         I agree to the platform policy and secure verification protocol.
                      </p>
                   </div>

                   <Button type="submit" disabled={isLoading || !agreedToAds || !email} className="w-full h-16 bg-primary font-black uppercase italic text-lg rounded-2xl shadow-xl">
                     {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'INITIALIZE VERIFICATION'}
                   </Button>
                </Card>
             </form>
          </TabsContent>

          <TabsContent value="login" className="mt-6">
             <form onSubmit={handleEmailAuth} className="space-y-4">
                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Email Node</Label>
                         <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Password Signal</Label>
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
      )}

      <div className="flex flex-col items-center gap-4 opacity-40">
         <div className="flex items-center gap-6">
            <Fingerprint className="h-5 w-5" />
            <UserCircle className="h-5 w-5" />
            <ShieldAlert className="h-5 w-5" />
         </div>
         <p className="text-[8px] font-black uppercase text-center tracking-[0.4em]">Multi-Intent Identity Security v12.0</p>
      </div>
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
