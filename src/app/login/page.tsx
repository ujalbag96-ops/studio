
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
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Trophy, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

const COUNTRY_CODES = [
  { label: "India (+91)", value: "+91", country: "India" },
  { label: "USA (+1)", value: "+1", country: "USA" },
  { label: "UK (+44)", value: "+44", country: "UK" }
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
    if (user && !isUserLoading && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (snap) => {
        const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        if (isAdmin) {
          router.push('/admin');
        } else {
          if (!snap.exists()) {
             // Generate a simple 6-char referral code
             const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
             
             setDoc(userDocRef, {
                id: user.uid,
                email: user.email || '',
                coins: 0,
                winningBalance: 0,
                depositBalance: 0,
                taskBalance: 0,
                withdrawableCoins: 0,
                rank: 'Bronze',
                referralCode: randomCode,
                joinedAt: new Date().toISOString()
             }, { merge: true }).then(() => {
               toast({ title: "Welcome!", description: "Account created successfully." });
               router.push('/dashboard');
             }).catch((e) => {
               console.error("Initialization error", e);
               router.push('/dashboard');
             });
          } else {
            router.push('/dashboard');
          }
        }
      });
      return () => unsubscribe();
    }
  }, [user, isUserLoading, firestore, router, toast]);

  const handleEmailAuth = async (mode: 'login' | 'signup') => {
    if (!auth) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast({ title: "Success", description: "Logged in successfully." });
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        toast({ title: "Success", description: "Registered successfully." });
      }
    } catch (e: any) {
      setAuthError(e.message);
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneFlow = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      if (!confirmationResult) {
        if (!(window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        }
        const result = await signInWithPhoneNumber(auth, `${countryCode}${phoneNumber}`, (window as any).recaptchaVerifier);
        setConfirmationResult(result);
        toast({ title: "OTP Sent", description: "Verification code sent to your phone." });
      } else {
        await confirmationResult.confirm(otp);
        toast({ title: "Verified", description: "Logged in successfully." });
      }
    } catch (e: any) {
      setAuthError(e.message);
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
     if (!auth || !email) return;
     setIsLoading(true);
     try {
       await sendPasswordResetEmail(auth, email);
       toast({ title: "Reset Link Sent", description: "Check your email for password reset link." });
       setShowReset(false);
     } catch (e: any) {
       setAuthError(e.message);
       toast({ variant: "destructive", title: "Error", description: e.message });
     } finally {
       setIsLoading(false);
     }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8">
      <div className="text-center space-y-3">
        <Trophy className="h-16 w-16 text-primary mx-auto" />
        <h1 className="text-3xl font-black uppercase italic">Game <span className="text-primary">Login</span></h1>
      </div>

      {authError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-[10px] font-black uppercase">Error</AlertTitle>
          <AlertDescription className="text-xs font-bold">{authError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid grid-cols-2 h-12 bg-muted/20 p-1 rounded-xl">
          <TabsTrigger value="email" className="font-bold text-[10px] uppercase">Email</TabsTrigger>
          <TabsTrigger value="phone" className="font-bold text-[10px] uppercase">Phone</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6 space-y-4">
          <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] p-8 space-y-5">
            <div className="space-y-2">
               <Label className="text-xs font-bold text-muted-foreground ml-1">Email Address</Label>
               <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mail.com" className="h-14 bg-black border-white/10 rounded-xl" />
            </div>
            {!showReset ? (
              <>
                <div className="space-y-2 relative">
                   <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-muted-foreground ml-1">Password</Label>
                      <button type="button" onClick={() => setShowReset(true)} className="text-[10px] font-bold text-primary">Forgot?</button>
                   </div>
                   <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="h-14 bg-black border-white/10 rounded-xl pr-12" 
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
                <div className="flex flex-col gap-3 pt-2">
                  <Button type="button" onClick={() => handleEmailAuth('login')} disabled={isLoading} className="h-16 bg-primary font-black uppercase text-lg">
                    {isLoading ? <Loader2 className="animate-spin" /> : "Login"}
                  </Button>
                  <Button type="button" onClick={() => handleEmailAuth('signup')} disabled={isLoading} variant="outline" className="h-14 font-black uppercase text-xs">
                    {isLoading ? <Loader2 className="animate-spin" /> : "Sign Up"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                <Button type="button" handleReset={handleReset} disabled={isLoading} className="h-16 bg-primary font-black uppercase">
                  {isLoading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowReset(false)} className="h-10 text-[10px] font-black uppercase">Back to Login</Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="phone" className="mt-6">
           <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] p-8 space-y-4">
              <div id="recaptcha-container"></div>
              {!confirmationResult ? (
                <div className="space-y-4">
                   <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground">Mobile Number</Label>
                      <div className="flex gap-2">
                         <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-24 bg-black border-white/10 h-14"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-black border-white/10">{COUNTRY_CODES.map(c => <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>)}</SelectContent>
                         </Select>
                         <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Phone Number" className="flex-1 h-14 bg-black border-white/10" />
                      </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-2">
                   <Label className="text-xs font-bold text-muted-foreground">Enter OTP</Label>
                   <Input value={otp} onChange={e => setOtp(e.target.value)} className="h-16 bg-black border-white/10 text-center text-3xl font-black tracking-widest" />
                </div>
              )}
              <Button type="button" onClick={handlePhoneFlow} disabled={isLoading} className="w-full h-16 bg-primary font-black uppercase text-lg">
                {isLoading ? <Loader2 className="animate-spin" /> : (!confirmationResult ? "Get OTP" : "Verify & Login")}
              </Button>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
