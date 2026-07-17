'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit, addDoc, increment } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, Eye, EyeOff, LifeBuoy, KeyRound, Smartphone, Mail, Hash, ShieldAlert, Scale } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import RiskDisclosureModal from '@/components/RiskDisclosureModal';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

function LoginContent() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'phone'>('login');
  
  // Email Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  // Support & Legal State
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [supportData, setSupportData] = useState({ contact: '', issue: '' });

  useEffect(() => {
    if (user && !isUserLoading) {
      const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      router.push(isAdmin ? '/admin' : '/dashboard');
    }
  }, [user, isUserLoading, router]);

  const syncUserProfile = async (firebaseUser: any) => {
    if (!firestore) return;
    try {
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const snap = await getDoc(userDocRef);

      let deviceId = localStorage.getItem('bb_device_id');
      if (!deviceId) {
        deviceId = 'DEV-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
        localStorage.setItem('bb_device_id', deviceId);
      }

      // 🕵️ ANTI-FRAUD: Integrity Check
      const userAgent = navigator.userAgent.toLowerCase();
      const isEmulator = userAgent.includes('sdk') || userAgent.includes('google_sdk') || userAgent.includes('droid4x');
      const isBot = (navigator as any).webdriver;

      let ipData = { ip: 'Unknown', country: 'Global', region: 'Unknown', city: 'Unknown', proxy: false };
      try {
         const res = await fetch('https://ipapi.co/json/');
         const data = await res.json();
         ipData = { 
           ip: data.ip, 
           country: data.country_name,
           region: data.region,
           city: data.city,
           proxy: data.security?.vpn || data.security?.proxy || false
         };
      } catch(e) {
         console.error("Geo-IP node unreachable");
      }

      if (!snap.exists()) {
        const referralCodeFromUrl = searchParams.get('ref');
        let l1Upline = '';
        let l2Upline = '';

        if (referralCodeFromUrl) {
          const q = query(collection(firestore, 'users'), where('referralCode', '==', referralCodeFromUrl), limit(1));
          const uplineSnap = await getDocs(q);
          if (!uplineSnap.empty) {
            const l1Data = uplineSnap.docs[0].data();
            l1Upline = uplineSnap.docs[0].id;
            l2Upline = l1Data.referredBy || '';
            await setDoc(doc(firestore, 'users', l1Upline), { totalReferrals: increment(1) }, { merge: true });
          }
        }

        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        await setDoc(userDocRef, {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          phoneNumber: firebaseUser.phoneNumber || '',
          depositBalance: 0,
          winningBalance: 0,
          bonusBalance: 0,
          taskBalance: 0,
          referralCommissionBalance: 0,
          coins: 0,
          rank: 'Bronze',
          referralCode: randomCode,
          referredBy: l1Upline,
          referredByL2: l2Upline,
          mlmLevel: 0,
          tasksCompletedCount: 0,
          totalReferrals: 0,
          networkTaskCompletions: 0,
          totalNetworkRevenue: 0,
          isAccountActivated: false,
          riskNoticeAccepted: true, // Accepted via the modal in signup
          deviceId: deviceId,
          lastIp: ipData.ip,
          country: ipData.country,
          region: ipData.region,
          city: ipData.city,
          status: (ipData.proxy || isEmulator || isBot) ? 'suspended' : 'active',
          isSuspended: (ipData.proxy || isEmulator || isBot),
          joinedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Identity instantiation failure", err);
    }
  };

  const handleEmailAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth) return;
    
    // If signing up, ensure legal modal is accepted first
    if (authMode === 'signup' && !showLegalModal) {
      setShowLegalModal(true);
      return;
    }

    setIsLoading(true);
    try {
      let userCredential;
      if (authMode === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      await syncUserProfile(userCredential.user);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Access Denied", description: e.message });
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
    if (!auth || !phoneNumber) return;
    setIsLoading(true);
    try {
      setupRecaptcha();
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
      toast({ title: "OTP Dispatched", description: `Verification code sent to ${phoneNumber}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "SMS Failed", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !otp) return;
    setIsLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(otp);
      await syncUserProfile(userCredential.user);
      toast({ title: "Identity Verified" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Invalid Token" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8 animate-in fade-in duration-700">
      <div id="recaptcha-container"></div>
      
      {/* SIGNUP LEGAL MODAL TRIGGER */}
      <RiskDisclosureModal 
        isOpen={showLegalModal} 
        onOpenChange={setShowLegalModal} 
        onAccepted={() => handleEmailAuth()} 
      />

      <div className="text-center space-y-3">
        <div className="h-20 w-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
          <ShieldCheck className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Warrior <span className="text-primary">Enlist</span></h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">Industrial Identity Protocol Active</p>
      </div>

      <Tabs value={authMode} onValueChange={(val) => setAuthMode(val as any)} className="w-full">
        <TabsList className="grid grid-cols-3 h-14 bg-white/5 p-1 rounded-2xl border border-white/5">
          <TabsTrigger value="login" className="font-black text-[9px] data-[state=active]:bg-primary rounded-xl uppercase"><Mail className="h-3 w-3 mr-1.5" /> Login</TabsTrigger>
          <TabsTrigger value="signup" className="font-black text-[9px] data-[state=active]:bg-primary rounded-xl uppercase"><Hash className="h-3 w-3 mr-1.5" /> Register</TabsTrigger>
          <TabsTrigger value="phone" className="font-black text-[9px] data-[state=active]:bg-primary rounded-xl uppercase"><Smartphone className="h-3 w-3 mr-1.5" /> Phone</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-6">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email Terminal</Label>
                 <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl font-bold" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Access Pass</Label>
                 <div className="relative">
                    <Input required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl pr-12 font-mono" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                 </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase text-lg italic rounded-2xl shadow-xl">
                {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'INITIATE LOGIN'}
              </Button>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="mt-6">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Target Email</Label>
                 <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl font-bold" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">New Access Pass</Label>
                 <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl font-mono" />
              </div>
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
                 <Scale className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                 <p className="text-[9px] font-black uppercase text-muted-foreground leading-relaxed">
                   By clicking 'CREATE IDENTITY', you agree to our Terms of Service & Privacy Policy.
                 </p>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase text-lg italic rounded-2xl shadow-xl">
                {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'CREATE IDENTITY'}
              </Button>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="phone" className="mt-6">
          <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
            {!confirmationResult ? (
              <div className="space-y-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mobile Identification</Label>
                    <Input 
                      placeholder="+91 98765 43210" 
                      value={phoneNumber} 
                      onChange={e => setPhoneNumber(e.target.value)} 
                      className="h-14 bg-black border-white/10 rounded-xl font-black text-lg tracking-widest text-primary"
                    />
                 </div>
                 <Button 
                   onClick={handleSendOtp} 
                   disabled={isLoading || !phoneNumber} 
                   className="w-full h-16 bg-primary font-black uppercase italic text-lg rounded-2xl shadow-xl"
                 >
                   {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'DISPATCH OTP'}
                 </Button>
              </div>
            ) : (
              <div className="space-y-4">
                 <Input 
                   placeholder="123456" 
                   maxLength={6}
                   value={otp} 
                   onChange={e => setOtp(e.target.value)} 
                   className="h-16 bg-black border-white/10 rounded-xl font-black text-3xl tracking-[0.5em] text-primary text-center"
                 />
                 <Button 
                   onClick={handleVerifyOtp} 
                   disabled={isLoading || otp.length < 6} 
                   className="w-full h-16 bg-primary font-black uppercase italic text-lg rounded-2xl shadow-xl"
                 >
                   {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'VERIFY & JOIN'}
                 </Button>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
