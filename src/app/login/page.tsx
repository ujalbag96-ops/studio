
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();
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
  const [showReset, setShowReset] = useState(false);

  // Redirection guard for already logged in users
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
      
      let currentIp = 'Unknown';
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        currentIp = data.ip;
      } catch (e) {}

      if (!snap.exists()) {
        const refCode = searchParams.get('ref');
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        await setDoc(userDocRef, {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          lastIp: currentIp,
          depositBalance: 0,
          winningBalance: 0,
          bonusBalance: refCode ? 10 : 0,
          coins: refCode ? 10 : 0,
          rank: 'Bronze',
          referralCode: randomCode,
          referredBy: refCode || null,
          joinedAt: new Date().toISOString()
        }, { merge: true });

        if (refCode) {
          await addDoc(collection(firestore, 'users', firebaseUser.uid, 'ledger'), {
            type: 'income',
            amount: 10,
            date: new Date().toISOString().split('T')[0],
            status: 'completed',
            description: "Referral Signup Bonus"
          });
        }
      } else {
        await setDoc(userDocRef, { 
          lastIp: currentIp, 
          lastActive: new Date().toISOString() 
        }, { merge: true });
      }
    } catch (err) {
      console.error("Profile sync failed", err);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setIsLoading(true);
    setAuthError(null);
    
    try {
      let userCredential;
      if (authMode === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        toast({ title: "Logged In Successfully" });
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        toast({ title: "Account Created Successfully" });
      }
      
      await syncUserProfile(userCredential.user);
      const isAdmin = userCredential.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      router.push(isAdmin ? '/admin' : '/dashboard');
      
    } catch (e: any) {
      setAuthError(e.message);
      toast({ variant: "destructive", title: "Authentication Error", description: e.message });
      setIsLoading(false); // Only stop loading if failed, otherwise redirect takes over
    }
  };

  const handleGoogleAuth = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await syncUserProfile(result.user);
      toast({ title: "Google Sign-in Success" });
      
      const isAdmin = result.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      router.push(isAdmin ? '/admin' : '/dashboard');
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') {
        toast({ variant: "destructive", title: "Auth Failed", description: e.message });
      }
      setIsLoading(false);
    }
  };

  if (isUserLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Loader2 className="animate-spin text-primary h-12 w-12" />
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8 animate-in fade-in duration-700">
      <div className="text-center space-y-3">
        <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
          <ShieldCheck className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
          {authMode === 'login' ? 'Welcome' : 'Join'} <span className="text-primary">WinZO</span>
        </h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">Industrial High-Performance Account</p>
      </div>

      {authError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs font-bold uppercase">{authError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={authMode} onValueChange={(val) => setAuthMode(val as any)} className="w-full">
        <TabsList className="grid grid-cols-2 h-14 bg-white/5 p-1 rounded-2xl border border-white/5">
          <TabsTrigger value="login" className="font-black text-[10px] data-[state=active]:bg-primary rounded-xl uppercase">Login</TabsTrigger>
          <TabsTrigger value="signup" className="font-black text-[10px] data-[state=active]:bg-primary rounded-xl uppercase">Register</TabsTrigger>
        </TabsList>

        <TabsContent value={authMode} className="mt-6">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email ID</Label>
                 <Input 
                  required
                  type="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="name@example.com" 
                  className="h-14 bg-black border-white/10 rounded-xl text-white font-bold focus:ring-primary" 
                 />
              </div>
              
              <div className="space-y-2 relative">
                 <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Password</Label>
                    {authMode === 'login' && (
                      <button type="button" onClick={() => setShowReset(true)} className="text-[10px] font-black text-primary uppercase hover:underline">Forgot?</button>
                    )}
                 </div>
                 <div className="relative">
                    <Input 
                      required
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="h-14 bg-black border-white/10 rounded-xl pr-12 text-white focus:ring-primary" 
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
                  className="h-16 bg-primary hover:bg-primary/90 font-black uppercase text-lg italic rounded-2xl transition-all active:scale-95"
                >
                  {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (authMode === 'login' ? 'Login Now' : 'Create Account')}
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-[10px] font-black uppercase text-muted-foreground hover:text-white"
                >
                  {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </Button>
              </div>
            </Card>
          </form>
        </TabsContent>
      </Tabs>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
        <div className="relative flex justify-center text-[8px] font-bold uppercase"><span className="bg-background px-4 text-muted-foreground">Or secure access via</span></div>
      </div>

      <Button 
        onClick={handleGoogleAuth} 
        disabled={isLoading}
        variant="outline"
        className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 transition-all"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
        Continue with Google
      </Button>
    </div>
  );
}
