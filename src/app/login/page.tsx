
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
import { useRouter } from 'next/navigation';
import { Trophy, Loader2, AlertCircle, KeyRound, ShieldAlert } from 'lucide-react';
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

  // Generate or get persistent Device ID
  const getDeviceId = () => {
    let id = localStorage.getItem('arena_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem('arena_device_id', id);
    }
    return id;
  };

  useEffect(() => {
    if (user && !isUserLoading && firestore) {
      const checkBan = async () => {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().isBanned) {
          setAuthError("This account has been permanently banned for violating fair play rules.");
          return;
        }

        const userEmail = user.email?.toLowerCase().trim();
        if (userEmail === ADMIN_EMAIL.toLowerCase()) {
          window.location.href = '/admin';
        } else {
          router.push('/');
        }
      };
      checkBan();
    }
  }, [user, isUserLoading, router, firestore]);

  const handleEmailAuth = async (mode: 'login' | 'signup') => {
    const trimmedEmail = email.trim();
    setAuthError(null);
    setIsLoading(true);
    
    try {
      const authInstance = getAuth();
      const deviceId = getDeviceId();

      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(authInstance, trimmedEmail, password);
        const loggedInUser = userCredential.user;
        
        // Sync device ID on login
        if (firestore) {
          await setDoc(doc(firestore, 'users', loggedInUser.uid), {
            deviceId,
            email: trimmedEmail,
            lastLogin: new Date().toISOString()
          }, { merge: true });
        }

        toast({ title: "Sign-in Success", description: "Welcome back!" });
      } else {
        const userCredential = await createUserWithEmailAndPassword(authInstance, trimmedEmail, password);
        const newUser = userCredential.user;

        // Initialize profile with Anti-Cheat data
        if (firestore) {
          await setDoc(doc(firestore, 'users', newUser.uid), {
            email: trimmedEmail,
            deviceId,
            coins: 0,
            withdrawableCoins: 0,
            referralCode: Math.random().toString(36).substring(7).toUpperCase(),
            isBanned: false,
            joinedAt: new Date().toISOString()
          });
        }

        toast({ title: "Account Created", description: "Identity verified. Welcome to the Arena!" });
      }
    } catch (error: any) {
      let message = error.message;
      setAuthError(message);
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const authInstance = getAuth();
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(authInstance, 'recaptcha-container', { size: 'invisible' });
      }
      const result = await signInWithPhoneNumber(authInstance, phoneNumber, (window as any).recaptchaVerifier);
      setConfirmationResult(result);
      toast({ title: "OTP Sent" });
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !firestore) return;
    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const deviceId = getDeviceId();
      await setDoc(doc(firestore, 'users', result.user.uid), { deviceId }, { merge: true });
      window.location.href = '/';
    } catch (error: any) {
      setAuthError("Invalid OTP.");
      setIsLoading(false);
    }
  };

  if (isUserLoading) return <div className="flex flex-col items-center justify-center min-h-screen gap-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
          <Trophy className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-black uppercase">Arena Access</h1>
        <p className="text-muted-foreground text-sm">Strict "One Device, One Account" policy active.</p>
      </div>

      {authError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Fair Play Violation</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="phone">Phone</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Login / Signup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full font-black" onClick={() => handleEmailAuth('login')} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "SIGN IN"}
              </Button>
              <Button variant="outline" className="w-full font-black" onClick={() => handleEmailAuth('signup')} disabled={isLoading}>
                CREATE ACCOUNT
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="phone" className="mt-6">
          <Card className="bg-card/50">
            <CardHeader><CardTitle>Phone OTP</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div id="recaptcha-container"></div>
              {!confirmationResult ? (
                <Input placeholder="+91..." value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              ) : (
                <Input placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="text-center tracking-widest text-xl" />
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={!confirmationResult ? handleSendOtp : handleVerifyOtp}>
                {isLoading ? <Loader2 className="animate-spin" /> : (!confirmationResult ? "SEND OTP" : "VERIFY")}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
