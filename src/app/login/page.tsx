
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, CheckSquare, Square, GraduationCap, ShieldAlert, Fingerprint, Mail, Briefcase, Globe } from 'lucide-react';
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
  const [intent, setIntent] = useState<UserIntent>('earner');
  const [agreedToAds, setAgreedToAds] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const getPersistentDeviceId = () => {
    if (typeof window === 'undefined') return 'unknown';
    let id = localStorage.getItem('campushub_device_id');
    if (!id) {
      id = 'CH-' + Math.random().toString(36).substring(2, 15);
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
            toast({ title: "VERIFICATION SUCCESS" });
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

      // --- INDUSTRIAL ANTI-FRAUD IP AUDIT ---
      let ipData = { ip: 'Unknown', country: 'Global', region: 'Unknown', proxy: false };
      try {
         const res = await fetch('https://ipapi.co/json/');
         const data = await res.json();
         const isVpn = data.security?.vpn || data.security?.proxy || data.org?.toLowerCase().includes('vpn');
         ipData = { 
           ip: data.ip, 
           country: data.country_name,
           region: data.region, 
           proxy: isVpn || false 
         };
      } catch(e) { console.error("IP Audit Node Failure"); }

      const deviceQuery = query(collection(firestore, 'users'), where('deviceId', '==', deviceId), limit(5));
      const deviceSnap = await getDocs(deviceQuery);
      const isMultiAccount = !snap.exists() && deviceSnap.size >= 1; 

      const fraudFlag = ipData.proxy || isMultiAccount;

      if (!snap.exists()) {
        const referralCodeFromUrl = searchParams.get('ref');
        let l1Upline = '';
        if (referralCodeFromUrl) {
          const q = query(collection(firestore, 'users'), where('referralCode', '==', referralCodeFromUrl), limit(1));
          const uplineSnap = await getDocs(q);
          if (!uplineSnap.empty) l1Upline = uplineSnap.docs[0].id;
        }

        await setDoc(userDocRef, {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          coins: 200,
          winningBalance: 0,
          taskBalance: 0,
          depositBalance: 0,
          rank: 'Bronze',
          primaryIntent: intent,
          referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          referredBy: l1Upline,
          joinedAt: new Date().toISOString(),
          lastIp: ipData.ip,
          deviceId: deviceId,
          country: ipData.country,
          geo_region: ipData.region,
          isSuspended: fraudFlag,
          fraudReason: ipData.proxy ? "VPN/Proxy Detected" : isMultiAccount ? "Multi-Account Device Lock" : ""
        });

        if (fraudFlag) toast({ variant: "destructive", title: "SECURITY FLAG", description: "Identity restricted due to network integrity failure." });
      } else {
        await setDoc(userDocRef, { lastIp: ipData.ip }, { merge: true });
      }
    } catch (err) { console.error("Identity instantiation failure", err); }
  };

  const handleGoogleAuth = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await syncUserProfile(result.user);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Google Auth Failed", description: e.message });
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth) return;
    if (authMode === 'signup' && !agreedToAds) {
      toast({ variant: "destructive", title: "AGREEMENT REQUIRED" });
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'signup') {
        const actionCodeSettings = { url: window.location.origin + '/login', handleCodeInApp: true };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        setVerificationSent(true);
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
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">Industrial Integrity Node</p>
      </div>

      <div className="space-y-4">
        <Button onClick={handleGoogleAuth} disabled={isLoading} className="w-full h-14 bg-white text-black hover:bg-slate-100 border border-slate-200 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3">
           <img src="https://www.google.com/favicon.ico" className="h-4 w-4" alt="G" />
           {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Continue with Google"}
        </Button>
        <div className="flex items-center gap-4 py-2">
           <div className="h-px flex-1 bg-white/5" />
           <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">OR USE EMAIL</span>
           <div className="h-px flex-1 bg-white/5" />
        </div>
      </div>

      {verificationSent ? (
        <Card className="bg-[#0a0a0f] border-primary/20 border-2 rounded-[2.5rem] p-10 text-center space-y-6">
           <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary animate-pulse" />
           </div>
           <h2 className="text-xl font-black uppercase italic">Check Gmail</h2>
           <p className="text-xs text-muted-foreground font-bold uppercase">Link sent to: {email}</p>
           <Button onClick={() => setVerificationSent(false)} variant="outline" className="w-full h-12 rounded-xl">Back</Button>
        </Card>
      ) : (
        <Tabs value={authMode} onValueChange={(val) => setAuthMode(val as any)} className="w-full">
          <TabsList className="grid grid-cols-2 h-14 bg-white/5 p-1 rounded-2xl">
            <TabsTrigger value="login" className="font-black text-[9px] uppercase">Login</TabsTrigger>
            <TabsTrigger value="signup" className="font-black text-[9px] uppercase">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="mt-6 space-y-6">
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setIntent('student')} className={cn("p-6 rounded-2xl border-2 flex flex-col items-center gap-3", intent === 'student' ? "border-primary bg-primary/10 text-white" : "border-white/5 text-muted-foreground")}>
                   <GraduationCap className="h-6 w-6" />
                   <span className="text-[9px] font-black uppercase">Student</span>
                </button>
                <button onClick={() => setIntent('earner')} className={cn("p-6 rounded-2xl border-2 flex flex-col items-center gap-3", intent === 'earner' ? "border-amber-500 bg-amber-500/10 text-white" : "border-white/5 text-muted-foreground")}>
                   <Briefcase className="h-6 w-6" />
                   <span className="text-[9px] font-black uppercase">General</span>
                </button>
             </div>
             <form onSubmit={handleEmailAuth} className="space-y-4">
                <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl" placeholder="Gmail Address" />
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl">
                   <button type="button" onClick={() => setAgreedToAds(!agreedToAds)}>
                      {agreedToAds ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                   </button>
                   <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed">I agree to the industrial platform policy and IP monitoring.</p>
                </div>
                <Button type="submit" disabled={isLoading || !agreedToAds || !email} className="w-full h-16 bg-primary font-black uppercase italic rounded-2xl">
                  {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'VERIFY IDENTITY'}
                </Button>
             </form>
          </TabsContent>

          <TabsContent value="login" className="mt-6">
             <form onSubmit={handleEmailAuth} className="space-y-4">
                <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl" placeholder="Email" />
                <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl" placeholder="Password" />
                <Button type="submit" disabled={isLoading} className="w-full h-16 bg-primary font-black uppercase italic rounded-2xl">
                  {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'RE-SYNC SIGNAL'}
                </Button>
             </form>
          </TabsContent>
        </Tabs>
      )}

      <div className="flex flex-col items-center gap-4 opacity-40">
         <div className="flex items-center gap-6">
            <Fingerprint className="h-5 w-5" />
            <Globe className="h-5 w-5" />
            <ShieldAlert className="h-5 w-5" />
         </div>
         <p className="text-[8px] font-black uppercase tracking-[0.4em]">Anti-Fraud IP Protection Active</p>
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
