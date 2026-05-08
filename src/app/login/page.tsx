'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { 
  getAuth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Trophy, Loader2, ShieldAlert, Mail, Phone, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

const COUNTRY_CODES = [
  { label: "India (+91)", value: "+91" },
  { label: "USA (+1)", value: "+1" },
  { label: "UK (+44)", value: "+44" },
  { label: "Dubai (+971)", value: "+971" }
];

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const getDeviceId = () => {
    if (typeof window === 'undefined') return 'unknown';
    let id = localStorage.getItem('arena_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem('arena_device_id', id);
    }
    return id;
  };

  useEffect(() => {
    if (user && !isUserLoading && firestore && !isRedirecting) {
      const handleAuthFlow = async () => {
        setIsRedirecting(true);
        try {
          const userDocRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data()?.isBanned) {
            setAuthError("This device has been permanently excluded from the arena.");
            setIsRedirecting(false);
            return;
          }

          const userEmail = user.email?.toLowerCase().trim();
          const isAdmin = !!userEmail && userEmail === ADMIN_EMAIL.toLowerCase().trim();
          
          if (isAdmin) {
             await setDoc(userDocRef, { 
               id: user.uid,
               isAdmin: true,
               email: ADMIN_EMAIL,
               lastActive: new Date().toISOString(),
               deviceId: getDeviceId()
             }, { merge: true });
             
             toast({ title: "Admin Access", description: "Identity verified. Entering Command Sector." });
             router.push('/admin');
          } else {
             if (!userDoc.exists()) {
               await setDoc(userDocRef, {
                 id: user.uid,
                 email: user.email || '',
                 mobile: user.phoneNumber || '',
                 coins: 0,
                 withdrawableCoins: 0,
                 isAdmin: false,
                 isBanned: false,
                 deviceId: getDeviceId(),
                 joinedAt: new Date().toISOString()
               });
             }
             router.push('/dashboard');
          }
        } catch (err) {
          setIsRedirecting(false);
        }
      };
      handleAuthFlow();
    }
  }, [user, isUserLoading, router, firestore, isRedirecting]);

  const handleEmailAuth = async (mode: 'login' | 'signup') => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const auth = getAuth();
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      toast({ title: mode === 'login' ? "Access Granted" : "Account Created" });
    } catch (error: any) {
      setAuthError(error.message);
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your email address." });
      return;
    }
    setIsLoading(true);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Reset Link Sent", description: "Check your inbox for password reset instructions." });
      setShowReset(false);
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneFlow = async () => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      const fullPhone = `${countryCode}${phoneNumber}`;
      if (!confirmationResult) {
        if (!(window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        }
        const result = await signInWithPhoneNumber(auth, fullPhone, (window as any).recaptchaVerifier);
        setConfirmationResult(result);
        toast({ title: "OTP Transmitted" });
      } else {
        await confirmationResult.confirm(otp);
        toast({ title: "Phone Verified" });
      }
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || isRedirecting) return <div className="flex flex-col items-center justify-center min-h-screen space-y-4"><Loader2 className="animate-spin h-10 w-10 text-primary" /><p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Synchronizing identity...</p></div>;

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-3">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter">Arena Access</h1>
        <p className="text-muted-foreground text-sm font-medium">Verify your identity to enter the battle sector.</p>
      </div>

      {authError && (
        <Alert variant="destructive" className="rounded-2xl">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle className="font-black uppercase text-xs">Security Alert</AlertTitle>
          <AlertDescription className="text-xs font-bold">{authError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid grid-cols-2 w-full h-12 bg-muted/20 p-1">
          <TabsTrigger value="email" className="font-bold flex items-center gap-2"><Mail className="h-4 w-4" /> Email</TabsTrigger>
          <TabsTrigger value="phone" className="font-bold flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6 space-y-4">
          <Card className="bg-card/20 border-white/5 rounded-3xl p-6 space-y-4">
            <div className="space-y-2">
              <Label>Comm Link (Email)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="warrior@arena.com" className="h-12 bg-black/40 border-white/10 rounded-xl" />
            </div>
            
            {!showReset && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Cipher (Password)</Label>
                  <Button variant="link" onClick={() => setShowReset(true)} className="text-[10px] uppercase font-black tracking-widest p-0 h-auto text-muted-foreground">Forgot?</Button>
                </div>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-black/40 border-white/10 rounded-xl" />
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              {showReset ? (
                <>
                  <Button onClick={handleResetPassword} disabled={isLoading} className="h-14 font-black rounded-xl">
                    {isLoading ? <Loader2 className="animate-spin" /> : "SEND RESET LINK"}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowReset(false)} className="h-10 font-bold uppercase text-[10px]">Back to Login</Button>
                </>
              ) : (
                <>
                  <Button onClick={() => handleEmailAuth('login')} disabled={isLoading} className="h-14 font-black rounded-xl">
                    {isLoading ? <Loader2 className="animate-spin" /> : "SIGN IN"}
                  </Button>
                  <Button variant="outline" onClick={() => handleEmailAuth('signup')} disabled={isLoading} className="h-14 font-black rounded-xl border-white/10">
                    CREATE ACCOUNT
                  </Button>
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="phone" className="mt-6">
          <Card className="bg-card/20 border-white/5 rounded-3xl p-6 space-y-4">
            <div id="recaptcha-container"></div>
            {!confirmationResult ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl">
                      <SelectValue placeholder="Country Code" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="9876543210" className="h-12 bg-black/40 border-white/10 rounded-xl" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>OTP Verification</Label>
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} className="h-14 bg-black/40 border-white/10 rounded-xl text-center text-2xl font-black tracking-widest" />
              </div>
            )}
            <Button onClick={handlePhoneFlow} disabled={isLoading} className="w-full h-14 font-black rounded-xl">
              {isLoading ? <Loader2 className="animate-spin" /> : (!confirmationResult ? "SEND OTP" : "VERIFY")}
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}