
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { Trophy, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function LoginPage() {
  const { auth } = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isUserLoading) {
      const userEmail = user.email?.toLowerCase();
      if (userEmail === ADMIN_EMAIL.toLowerCase()) {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    }
  }, [user, isUserLoading, router]);

  const handleEmailAuth = async (mode: 'login' | 'signup') => {
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Authentication service is not ready. Please refresh.",
      });
      return;
    }
    
    setAuthError(null);
    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const loggedInUser = userCredential.user;
        
        toast({
          title: "Sign-in Success",
          description: "Welcome to Bracket Battles!",
        });

        const userEmail = loggedInUser.email?.toLowerCase();
        if (userEmail === ADMIN_EMAIL.toLowerCase()) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        toast({
          title: "Account Created",
          description: "You can now sign in with your new account.",
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      let message = "An unexpected error occurred.";
      if (error.code === 'auth/user-not-found') message = "No account found with this email. Please sign up first.";
      if (error.code === 'auth/wrong-password') message = "Incorrect password. Please try again.";
      if (error.code === 'auth/invalid-email') message = "Please enter a valid email address.";
      if (error.code === 'auth/email-already-in-use') message = "This email is already registered. Try logging in.";
      
      setAuthError(message);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: message,
      });
      setIsLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!auth) return;
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const handleSendOtp = async () => {
    if (!auth) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      setupRecaptcha();
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the code.",
      });
    } catch (error: any) {
      setAuthError(error.message);
      toast({
        variant: "destructive",
        title: "SMS Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      await confirmationResult.confirm(otp);
      toast({
        title: "Verified",
        description: "Redirecting...",
      });
      window.location.href = '/';
    } catch (error: any) {
      setAuthError("Invalid OTP code.");
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "The OTP entered is incorrect.",
      });
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Initializing Arena Access...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl mb-4">
          <Trophy className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">Arena Access</h1>
        <p className="text-muted-foreground text-sm font-medium">Log in to manage tournaments and view insights.</p>
      </div>

      {authError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
          <TabsTrigger value="email" className="font-bold">Email</TabsTrigger>
          <TabsTrigger value="phone" className="font-bold">Phone</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <Card className="border-border/50 shadow-xl bg-card/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
              <CardDescription>Enter your email and password to access the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                className="w-full font-bold h-11" 
                onClick={() => handleEmailAuth('login')} 
                disabled={isLoading || !email || !password}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Sign In"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full font-bold h-11 border-primary/20 hover:bg-primary/5" 
                onClick={() => handleEmailAuth('signup')} 
                disabled={isLoading || !email || !password}
              >
                Register as New User
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="phone" className="mt-6">
          <Card className="border-border/50 shadow-xl bg-card/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Mobile Login</CardTitle>
              <CardDescription>Verify your identity via SMS.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div id="recaptcha-container"></div>
              {!confirmationResult ? (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+91..." 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)} 
                    disabled={isLoading}
                  />
                  <p className="text-[10px] text-muted-foreground">Example: +919876543210</p>
                </div>
              ) : (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="otp">6-Digit Code</Label>
                  <Input 
                    id="otp" 
                    type="text" 
                    maxLength={6} 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    className="text-center text-xl font-black tracking-widest"
                    disabled={isLoading}
                  />
                </div>
              )}
            </CardContent>
            <CardFooter>
              {!confirmationResult ? (
                <Button 
                  className="w-full font-bold h-11" 
                  onClick={handleSendOtp} 
                  disabled={isLoading || !phoneNumber}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Send Verification Code"}
                </Button>
              ) : (
                <Button 
                  className="w-full font-bold h-11" 
                  onClick={handleVerifyOtp} 
                  disabled={isLoading || otp.length < 6}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Verify OTP"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our <a href="/terms" className="underline hover:text-primary">Terms</a> and <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
