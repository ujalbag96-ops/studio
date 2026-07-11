
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Eye, EyeOff, UserPlus, LogIn, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

const COUNTRY_CODES = [
  { label: "India (+91)", value: "+91" },
  { label: "USA (+1)", value: "+1" },
  { label: "UK (+44)", value: "+44" }
];

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    async function initUser() {
      if (!user || isUserLoading || !firestore) return;

      const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      if (isAdmin) {
        router.push('/admin');
        return;
      }

      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const snap = await getDoc(userDocRef);
        
        let currentIp = 'Unknown';
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          currentIp = data.ip;
        } catch (e) {}

        if (!snap.exists()) {
          const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          await setDoc(userDocRef, {
            id: user.uid,
            email: user.email || '',
            lastIp: currentIp,
            coins: 0,
            winningBalance: 0,
            depositBalance: 0,
            taskBalance: 0,
            withdrawableCoins: 0,
            rank: 'Bronze',
            referralCode: randomCode,
            joinedAt: new Date().toISOString()
          }, { merge: true });
        } else {
          await setDoc(userDocRef, { 
            lastIp: currentIp, 
            lastActive: new Date().toISOString() 
          }, { merge: true });
        }
        router.push('/dashboard');
      } catch (err) {
        console.error("Profile check failed", err);
      }
    }

    initUser();
  }, [user, isUserLoading, firestore, router]);

  const handleEmailAuth = async (mode: 'login' | 'signup') => {
    if (!auth) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast({ title: "Welcome Back", description: "Login successful." });
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        toast({ title: "Account Created", description: "Welcome to the platform!" });
      }
    } catch (e: any) {
      setAuthError(e.message);
      toast({ variant: "destructive", title: "Auth Failed", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!auth) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: "Google Auth", description: "Login successful." });
    } catch (e: any) {
      setAuthError(e.message);
      toast({ variant: "destructive", title: "Google Login Failed", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneFlow = async () => {
    if (!auth) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      if (!confirmationResult) {
        if (!(window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        }
        const result = await signInWithPhoneNumber(auth, `${countryCode}${phoneNumber}`, (window as any).recaptchaVerifier);
        setConfirmationResult(result);
        toast({ title: "OTP Sent", description: "Check your messages." });
      } else {
        await confirmationResult.confirm(otp);
        toast({ title: "Success", description: "Verification complete." });
      }
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!auth || !email) return;
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast({ title: "Reset Link Sent", description: "Check your inbox." });
      setShowReset(false);
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
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
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Login / <span className="text-primary">Register</span></h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Sign in to manage your account</p>
      </div>

      {authError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs font-bold uppercase">{authError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid grid-cols-2 h-14 bg-white/5 p-1 rounded-2xl border border-white/5">
          <TabsTrigger value="email" className="font-black text-[10px] data-[state=active]:bg-primary rounded-xl uppercase">Email</TabsTrigger>
          <TabsTrigger value="phone" className="font-black text-[10px] data-[state=active]:bg-primary rounded-xl uppercase">Phone</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6 space-y-4">
          <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email ID</Label>
               <Input 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="name@example.com" 
                className="h-14 bg-black border-white/10 rounded-xl text-white font-bold" 
               />
            </div>
            
            {!showReset ? (
              <>
                <div className="space-y-2 relative">
                   <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Password</Label>
                      <button type="button" onClick={() => setShowReset(true)} className="text-[10px] font-black text-primary uppercase hover:underline">Forgot?</button>
                   </div>
                   <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="h-14 bg-black border-white/10 rounded-xl pr-12 text-white" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                   </div>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    type="button" 
                    onClick={() => handleEmailAuth('login')} 
                    disabled={isLoading} 
                    className="h-16 bg-primary hover:bg-primary/90 font-black uppercase text-lg italic rounded-2xl"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <><LogIn className="mr-2 h-5 w-5" /> Login Now</>}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => handleEmailAuth('signup')} 
                    disabled={isLoading} 
                    variant="outline" 
                    className="h-14 border-white/10 font-black uppercase text-[10px] rounded-xl"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <><UserPlus className="mr-2 h-4 w-4" /> Create New Account</>}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={handleReset} 
                  disabled={isLoading} 
                  className="h-16 bg-primary font-black uppercase italic rounded-2xl"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
                </Button>
                <Button variant="ghost" onClick={() => setShowReset(false)} className="text-[10px] font-black uppercase">Go Back</Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="phone" className="mt-6">
           <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
              <div id="recaptcha-container"></div>
              {!confirmationResult ? (
                <div className="space-y-4">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mobile Number</Label>
                      <div className="flex gap-2">
                         <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-24 bg-black border-white/10 h-14 font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#121216] border-white/10">
                              {COUNTRY_CODES.map(c => <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>)}
                            </SelectContent>
                         </Select>
                         <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="9876543210" className="flex-1 h-14 bg-black border-white/10 font-bold" />
                      </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Enter 6-Digit OTP</Label>
                   <Input value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="h-16 bg-black border-white/10 text-center text-3xl font-black tracking-[0.5em] rounded-xl" />
                </div>
              )}
              <Button onClick={handlePhoneFlow} disabled={isLoading} className="w-full h-16 bg-primary font-black uppercase text-lg italic rounded-2xl">
                {isLoading ? <Loader2 className="animate-spin" /> : (!confirmationResult ? "Send SMS Code" : "Verify & Continue")}
              </Button>
           </Card>
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <div className="relative flex justify-center text-[10px] uppercase font-black text-muted-foreground">
          <span className="bg-background px-2 relative z-10">Or Continue With</span>
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/5" />
        </div>
        
        <Button 
          onClick={handleGoogleAuth} 
          disabled={isLoading}
          variant="outline"
          className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
