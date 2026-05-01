
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
import { Trophy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  // Background redirection if session is already active
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
    if (!auth) return;
    setIsLoading(true);
    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const loggedInUser = userCredential.user;
        
        toast({
          title: "Sign-in Success",
          description: "Redirecting to your dashboard...",
        });

        // Use window.location for a hard redirect to clear state and ensure Admin access
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
          description: "Welcome! You can now sign in with your credentials.",
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Invalid email or password.",
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
    try {
      await confirmationResult.confirm(otp);
      toast({
        title: "Verified",
        description: "Redirecting...",
      });
      window.location.href = '/';
    } catch (error: any) {
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    </div>
  );
}
