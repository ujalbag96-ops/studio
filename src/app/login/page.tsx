
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, Eye, EyeOff, ShieldCheck, ShieldAlert, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function LoginPage() {
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
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isUserLoading) {
      const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      router.push(isAdmin ? '/admin' : '/dashboard');
    }
  }, [user, isUserLoading, router]);

  const getIpIntelligence = async () => {
    console.log('Initiating IP Intelligence Lookup...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      console.log('IP Intel Captured:', data.ip, data.country_name);
      return {
        ip: data.ip || '127.0.0.1',
        country: data.country_name || 'Global'
      };
    } catch (e) {
      console.warn('IP Intel Signal Jammed, using fallback protocol.');
      return { ip: '127.0.0.1', country: 'Global' };
    }
  };

  const syncUserProfile = async (firebaseUser: any) => {
    if (!firestore) return;
    
    try {
      const intel = await getIpIntelligence();
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const snap = await getDoc(userDocRef);

      if (!snap.exists() && authMode === 'signup') {
        console.log('New User Detected. Running Fraud Prevention Checks...');
        const abuseQuery = query(collection(firestore, 'users'), where('lastIp', '==', intel.ip), limit(1));
        const abuseSnap = await getDocs(abuseQuery);
        
        if (!abuseSnap.empty) {
          console.error('Security Violation: Multi-account detected on IP', intel.ip);
          toast({ 
            variant: "destructive", 
            title: "SECURITY VIOLATION", 
            description: "Multiple accounts detected on this terminal. Signal blocked." 
          });
          throw new Error("DEVICE_ID_CONFLICT");
        }

        const refCode = searchParams.get('ref');
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        let l1ReferrerUid = '';
        let l2ReferrerUid = '';

        if (refCode) {
          const refQuery = query(collection(firestore, 'users'), where('referralCode', '==', refCode));
          const refSnap = await getDocs(refQuery);
          if (!refSnap.empty) {
            const l1Doc = refSnap.docs[0];
            l1ReferrerUid = l1Doc.id;
            l2ReferrerUid = l1Doc.data().referredByL1 || '';
          }
        }
        
        await setDoc(userDocRef, {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          lastIp: intel.ip,
          country: intel.country,
          depositBalance: 0,
          winningBalance: 0,
          bonusBalance: refCode ? 10 : 0,
          coins: refCode ? 10 : 0,
          rank: 'Bronze',
          referralCode: randomCode,
          referredBy: refCode || null,
          referredByL1: l1ReferrerUid,
          referredByL2: l2ReferrerUid,
          isAccountActivated: false,
          tasksCompletedCount: 0,
          joinedAt: new Date().toISOString()
        }, { merge: true });

        if (refCode) {
          await addDoc(collection(firestore, 'users', firebaseUser.uid, 'ledger'), {
            type: 'income',
            amount: 10,
            date: new Date().toISOString().split('T')[0],
            status: 'completed',
            description: "Viral Referral Welcome Bonus"
          });
        }
      } else {
        await setDoc(userDocRef, { 
          lastIp: intel.ip, 
          country: intel.country,
          lastActive: new Date().toISOString() 
        }, { merge: true });
      }
    } catch (err: any) {
      if (err.message === "DEVICE_ID_CONFLICT") throw err;
      console.error("Industrial Profile sync failed", err);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({ variant: "destructive", title: "System Error", description: "Auth Protocol Offline. Please refresh." });
      return;
    }
    
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const sanitizedEmail = email.trim();
      const sanitizedPassword = password;

      if (!sanitizedEmail || !sanitizedPassword) {
        throw new Error("Credentials required.");
      }

      let userCredential;
      if (authMode === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, sanitizedPassword);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, sanitizedPassword);
      }
      
      await syncUserProfile(userCredential.user);
      
      const isAdmin = userCredential.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      router.push(isAdmin ? '/admin' : '/dashboard');
      
    } catch (e: any) {
      console.error('Authentication Exception:', e.code, e.message);
      let msg = e.message;
      
      if (e.code === 'auth/email-already-in-use') msg = "This email is already registered in the Arena.";
      if (e.code === 'auth/invalid-email') msg = "The email terminal address is invalid.";
      if (e.code === 'auth/weak-password') msg = "The access pass must be at least 6 characters.";
      if (e.code === 'auth/wrong-password') msg = "Invalid access pass. Terminal rejected.";
      if (e.code === 'auth/user-not-found') msg = "Warrior not found in database.";
      if (e.message === "DEVICE_ID_CONFLICT") msg = "Multiple account detection blocked this registration.";
      
      setAuthError(msg);
      toast({ variant: "destructive", title: "Access Denied", description: msg });
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await syncUserProfile(result.user);
      const isAdmin = result.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      router.push(isAdmin ? '/admin' : '/dashboard');
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') {
        const msg = e.message === "DEVICE_ID_CONFLICT" ? "Multiple account detection blocked this registration." : e.message;
        toast({ variant: "destructive", title: "Access Blocked", description: msg });
      }
      setIsLoading(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8 animate-in fade-in duration-700">
      <div className="text-center space-y-3">
        <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
          <ShieldCheck className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
          {authMode === 'login' ? 'Warrior' : 'Enlist'} <span className="text-primary">WinZO</span>
        </h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">Industrial Security Layer Active</p>
      </div>

      {authError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 rounded-2xl">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription className="text-xs font-bold uppercase">{authError}</AlertDescription>
        </Alert>
      )}

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
                 <Input 
                  required
                  type="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="warrior@arena.com" 
                  className="h-14 bg-black border-white/10 rounded-xl text-white font-bold focus:ring-primary" 
                 />
              </div>
              
              <div className="space-y-2 relative">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Secret Access Pass</Label>
                 <div className="relative">
                    <Input 
                      required
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="h-14 bg-black border-white/10 rounded-xl pr-12 text-white focus:ring-primary font-mono" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                 </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="h-16 bg-primary hover:bg-primary/90 font-black uppercase text-lg italic rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (authMode === 'login' ? 'INITIATE LOGIN' : 'CREATE ACCOUNT')}
                </Button>
              </div>
            </Card>
          </form>
        </TabsContent>
      </Tabs>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
        <div className="relative flex justify-center text-[8px] font-bold uppercase"><span className="bg-background px-4 text-muted-foreground">Encrypted Authentication</span></div>
      </div>

      <Button 
        onClick={handleGoogleAuth} 
        disabled={isLoading}
        variant="outline"
        className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 transition-all"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
        One-Tap Google Access
      </Button>
    </div>
  );
}
