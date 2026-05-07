
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { 
  getAuth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { Trophy, Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

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

          const isAdmin = user.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
          
          // CRITICAL: Ensure admin flag is set in Firestore for the admin identity
          if (isAdmin) {
             await setDoc(userDocRef, { 
               isAdmin: true,
               email: ADMIN_EMAIL,
               lastActive: new Date().toISOString()
             }, { merge: true });
             router.push('/admin');
          } else {
             router.push('/dashboard');
          }
        } catch (err) {
          console.error("Auth flow error", err);
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
      const deviceId = getDeviceId();
      let credential;

      if (mode === 'login') {
        credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      }

      if (firestore) {
        const isUserAdmin = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
        await setDoc(doc(firestore, 'users', credential.user.uid), {
          deviceId,
          lastActive: new Date().toISOString(),
          email: credential.user.email,
          isAdmin: isUserAdmin,
          ...(mode === 'signup' ? {
            coins: 0,
            withdrawableCoins: 0,
            isBanned: false,
            joinedAt: new Date().toISOString(),
            referralCode: Math.random().toString(36).substring(7).toUpperCase()
          } : {})
        }, { merge: true });
      }

      toast({ title: mode === 'login' ? "Access Granted" : "Identity Registered" });
    } catch (error: any) {
      setAuthError(error.message);
      setIsLoading(false);
    }
  };

  const handlePhoneFlow = async () => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      if (!confirmationResult) {
        if (!(window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        }
        const result = await signInWithPhoneNumber(auth, phoneNumber, (window as any).recaptchaVerifier);
        setConfirmationResult(result);
        toast({ title: "OTP Transmitted" });
      } else {
        const result = await confirmationResult.confirm(otp);
        const deviceId = getDeviceId();
        if (firestore) {
          await setDoc(doc(firestore, 'users', result.user.uid), { 
            deviceId, 
            lastActive: new Date().toISOString(),
            mobile: result.user.phoneNumber,
            isBanned: false
          }, { merge: true });
        }
      }
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || isRedirecting) return <div className="flex flex-col items-center justify-center min-h-screen space-y-4"><Loader2 className="animate-spin h-10 w-10 text-primary" /><p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Synchronizing identity sector...</p></div>;

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-3">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter">Arena Access</h1>
        <p className="text-muted-foreground text-sm font-medium">Identify yourself to enter the battle sector.</p>
      </div>

      {authError && (
        <Alert variant="destructive" className="rounded-2xl bg-destructive/10 border-destructive/20 text-destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle className="font-black uppercase text-xs">Security Alert</AlertTitle>
          <AlertDescription className="text-xs font-bold">{authError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid grid-cols-2 w-full h-12 bg-muted/20 p-1">
          <TabsTrigger value="email" className="font-bold">Email</TabsTrigger>
          <TabsTrigger value="phone" className="font-bold">Phone</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6 space-y-4">
          <Card className="bg-card/20 border-white/5 rounded-3xl p-6 space-y-4">
            <div className="space-y-2">
              <Label>Comm Link (Email)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-black/40 border-white/10 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Cipher (Password)</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-black/40 border-white/10 rounded-xl" />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={() => handleEmailAuth('login')} disabled={isLoading} className="h-14 font-black rounded-xl">
                {isLoading ? <Loader2 className="animate-spin" /> : "SIGN IN"}
              </Button>
              <Button variant="outline" onClick={() => handleEmailAuth('signup')} disabled={isLoading} className="h-14 font-black rounded-xl border-white/10">
                CREATE WARRIOR
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="phone" className="mt-6">
          <Card className="bg-card/20 border-white/5 rounded-3xl p-6 space-y-4">
            <div id="recaptcha-container"></div>
            {!confirmationResult ? (
              <div className="space-y-2">
                <Label>Mobile Signature</Label>
                <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91..." className="h-12 bg-black/40 border-white/10 rounded-xl" />
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
