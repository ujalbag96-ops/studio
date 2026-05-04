
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { 
  getAuth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { Trophy, Loader2, AlertCircle, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function LoginPage() {
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
      const userEmail = user.email?.toLowerCase().trim();
      if (userEmail === ADMIN_EMAIL.toLowerCase()) {
        window.location.href = '/admin';
      } else {
        router.push('/');
      }
    }
  }, [user, isUserLoading, router]);

  const handleEmailAuth = async (mode: 'login' | 'signup') => {
    const trimmedEmail = email.trim();
    setAuthError(null);
    setIsLoading(true);
    
    try {
      const authInstance = getAuth();
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(authInstance, trimmedEmail, password);
        const loggedInUser = userCredential.user;
        
        toast({
          title: "Sign-in Success",
          description: "Welcome back to the Arena!",
        });

        if (loggedInUser.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      } else {
        await createUserWithEmailAndPassword(authInstance, trimmedEmail, password);
        toast({
          title: "Account Created",
          description: "Your account is ready. You can now sign in.",
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      let message = error.message || "An unexpected error occurred.";
      if (error.code === 'auth/user-not-found') message = "No account found with this email.";
      if (error.code === 'auth/wrong-password') message = "Incorrect password.";
      if (error.code === 'auth/invalid-credential') message = "Invalid credentials.";
      if (error.code === 'auth/email-already-in-use') message = "Email already registered.";
      
      setAuthError(message);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: message,
      });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError("Please enter your email address to reset your password.");
      return;
    }
    
    setIsLoading(true);
    try {
      const authInstance = getAuth();
      await sendPasswordResetEmail(authInstance, email.trim());
      toast({
        title: "Reset Email Sent",
        description: "Please check your inbox for instructions to reset your password.",
      });
    } catch (error: any) {
      const message = error.message || "Could not send reset email.";
      setAuthError(message);
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRecaptcha = () => {
    const authInstance = getAuth();
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(authInstance, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const handleSendOtp = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const authInstance = getAuth();
      setupRecaptcha();
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(authInstance, phoneNumber, verifier);
      setConfirmationResult(result);
      toast({ title: "OTP Sent", description: "Check your messages." });
    } catch (error: any) {
      setAuthError(error.message);
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult) return;
    setIsLoading(true);
    try {
      await confirmationResult.confirm(otp);
      window.location.href = '/';
    } catch (error: any) {
      setAuthError("Invalid OTP code.");
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Verifying Credentials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl mb-4">
          <Trophy className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter">Arena Access</h1>
        <p className="text-muted-foreground text-sm font-medium">Predict. Play. Win rewards.</p>
      </div>

      {authError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Attention Required</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
          <TabsTrigger value="email" className="font-bold">Email Login</TabsTrigger>
          <TabsTrigger value="phone" className="font-bold">Phone OTP</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Enter your email and password below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="h-3 w-3" /> Forgot Password?
                  </button>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                className="w-full font-bold h-11" 
                onClick={() => handleEmailAuth('login')} 
                disabled={isLoading || !email || !password}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
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
          <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Phone Verification</CardTitle>
              <CardDescription>Quick and secure login via SMS.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div id="recaptcha-container"></div>
              {!confirmationResult ? (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+919876543210" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)} 
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="otp">6-Digit OTP</Label>
                  <Input 
                    id="otp" 
                    type="text" 
                    maxLength={6} 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    className="text-center text-xl font-black tracking-[0.5em]"
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
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Verification Code"}
                </Button>
              ) : (
                <Button 
                  className="w-full font-bold h-11" 
                  onClick={handleVerifyOtp} 
                  disabled={isLoading || otp.length < 6}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Sign In"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
