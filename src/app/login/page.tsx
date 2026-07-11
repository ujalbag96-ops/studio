'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult,
  sendPasswordResetEmail
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
        toast({ title: "Account Created", description: "Setting up your profile..." });
      }
    } catch (e: any) {
      setAuthError(e.message);
      toast({ variant: "destructive", title: "Auth Failed", description: e.message });
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
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Sign in to manage your wallet</p>
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
                    {isLoading ? <Loader2 className="animate-spin" /> : <><UserPlus className="mr-2 h-4 w-4" /> Create Account</>}
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
    </div>
  );
}
