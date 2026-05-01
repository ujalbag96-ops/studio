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
import { Trophy, Loader2, Mail, Phone } from 'lucide-react';
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

  useEffect(() => {
    if (user && !isUserLoading) {
      if (user.email === ADMIN_EMAIL) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, isUserLoading, router]);

  const handleEmailAuth = async (mode: 'login' | 'signup') => {
    if (!auth) return;
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: "Welcome Back",
          description: "Sign-in successful.",
        });
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: "Account Created",
          description: "Welcome to the Arena!",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Auth Error",
        description: error.message,
      });
    } finally {
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
        description: "Please check your phone.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "SMS Failed",
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
        description: "Login successful.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid OTP code.",
      });
    } finally {
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
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl mb-4">
          <Trophy className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter">Enter the Arena</h1>
        <p className="text-muted-foreground text-sm">Join tournaments & win rewards.</p>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email" className="font-bold">Email</TabsTrigger>
          <TabsTrigger value="phone" className="font-bold">Phone</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Use your email to access your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full font-bold" onClick={() => handleEmailAuth('login')} disabled={isLoading || !email || !password}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
              <Button variant="outline" className="w-full font-bold" onClick={() => handleEmailAuth('signup')} disabled={isLoading || !email || !password}>
                Create New Account
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="phone" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Phone Login</CardTitle>
              <CardDescription>Verify your mobile number.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div id="recaptcha-container"></div>
              {!confirmationResult ? (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+91..." value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="otp">6-Digit OTP</Label>
                  <Input id="otp" type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} className="text-center text-xl font-bold" />
                </div>
              )}
            </CardContent>
            <CardFooter>
              {!confirmationResult ? (
                <Button className="w-full font-bold" onClick={handleSendOtp} disabled={isLoading || !phoneNumber}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                </Button>
              ) : (
                <Button className="w-full font-bold" onClick={handleVerifyOtp} disabled={isLoading || otp.length < 6}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify OTP"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}