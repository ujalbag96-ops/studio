
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
import { doc, setDoc, collection, query, where, getDocs, addDoc, increment, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Trophy, Loader2, ShieldAlert, Mail, Phone, Lock, Globe, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

const COUNTRY_CODES = [
  { label: "India (+91)", value: "+91", country: "India" },
  { label: "USA (+1)", value: "+1", country: "USA" },
  { label: "UK (+44)", value: "+44", country: "UK" },
  { label: "Dubai (+971)", value: "+971", country: "UAE" }
];

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string>('India');
  const [isVpn, setIsVpn] = useState(false);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_name) setDetectedCountry(data.country_name);
        if (data.security && (data.security.proxy || data.security.vpn)) {
           setIsVpn(true);
        }
      })
      .catch(() => console.log('Location intelligence unavailable.'));
  }, []);

  const getDeviceId = () => {
    if (typeof window === 'undefined') return 'unknown';
    let id = localStorage.getItem('arena_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem('arena_device_id', id);
    }
    return id;
  };

  const generateReferralCode = () => {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `74426${suffix}`;
  };

  useEffect(() => {
    if (user && !isUserLoading && firestore && !isRedirecting) {
      setIsRedirecting(true);
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const unsubscribe = onSnapshot(userDocRef, async (userSnap) => {
        if (userSnap.exists() && userSnap.data()?.isBanned) {
          setAuthError("SECURITY LOCK: This device signature is blacklisted.");
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
            deviceId: getDeviceId(),
            country: detectedCountry,
            winningBalance: userSnap.exists() ? (userSnap.data().winningBalance || 0) : 0,
            depositBalance: userSnap.exists() ? (userSnap.data().depositBalance || 0) : 0,
            taskBalance: userSnap.exists() ? (userSnap.data().taskBalance || 0) : 0,
            coins: userSnap.exists() ? (userSnap.data().coins || 0) : 0,
            withdrawableCoins: userSnap.exists() ? (userSnap.data().withdrawableCoins || 0) : 0,
          }, { merge: true });
          router.push('/admin');
          unsubscribe();
        } else {
          if (!userSnap.exists()) {
            let referredById = '';
            if (referralCode.trim()) {
              const refQuery = query(collection(firestore, 'users'), where('referralCode', '==', referralCode.trim()));
              const refSnap = await getDocs(refQuery);
              if (!refSnap.empty) {
                const referrerDoc = refSnap.docs[0];
                referredById = referrerDoc.id;
                
                await setDoc(doc(firestore, 'users', referrerDoc.id), {
                  coins: increment(10),
                  winningBalance: increment(10),
                  withdrawableCoins: increment(10)
                }, { merge: true });
                
                await addDoc(collection(firestore, 'users', referrerDoc.id, 'ledger'), {
                  type: 'referral',
                  amount: 10,
                  date: new Date().toISOString().split('T')[0],
                  status: 'completed',
                  description: `Referral Protocol: Reward for enlisting new warrior.`
                });
              }
            }

            await setDoc(userDocRef, {
              id: user.uid,
              email: user.email || '',
              mobile: user.phoneNumber || '',
              coins: 0,
              winningBalance: 0,
              depositBalance: 0,
              taskBalance: 0,
              withdrawableCoins: 0,
              isAdmin: false,
              isBanned: false,
              isVpnActive: isVpn,
              rank: 'Bronze',
              xp: 0,
              tasksCompletedToday: 0,
              deviceId: getDeviceId(),
              country: detectedCountry,
              referralCode: generateReferralCode(),
              referredBy: referredById,
              joinedAt: new Date().toISOString()
            });
            router.push('/dashboard');
            unsubscribe();
          } else {
            await setDoc(userDocRef, { lastActive: new Date().toISOString(), isVpnActive: isVpn }, { merge: true });
            router.push('/dashboard');
            unsubscribe();
          }
        }
      });

      return () => unsubscribe();
    }
  }, [user, isUserLoading, router, firestore, isRedirecting, detectedCountry, isVpn, referralCode]);

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
      toast({ title: "Protocol Authenticated" });
    } catch (error: any) {
      setAuthError(error.message);
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({ variant: "destructive", title: "Email Required" });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(getAuth(), email);
      toast({ title: "Reset Key Transmitted" });
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
        toast({ title: "Identity Verified" });
      }
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || isRedirecting) return <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-black"><Loader2 className="animate-spin h-10 w-10 text-primary" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Synchronizing Tactical Data...</p></div>;

  return (
    <div className="max-w-md mx-auto p-4 pt-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-3">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-2xl rotate-3">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter italic">Arena <span className="text-primary">Access</span></h1>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Enlist to Enter the Combat Sector</p>
      </div>

      {authError && (
        <Alert variant="destructive" className="rounded-2xl bg-destructive/10 border-destructive/20 text-destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle className="font-black uppercase text-[10px]">Policy Restriction</AlertTitle>
          <AlertDescription className="text-xs font-bold">{authError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid grid-cols-2 w-full h-12 bg-muted/20 p-1 rounded-xl">
          <TabsTrigger value="email" className="font-bold flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white uppercase text-[10px] tracking-widest italic">Email Access</TabsTrigger>
          <TabsTrigger value="phone" className="font-bold flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white uppercase text-[10px] tracking-widest italic">Mobile ID</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6 space-y-4">
          <Card className="bg-card/20 border-white/5 rounded-[2rem] p-8 space-y-5 shadow-2xl">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Warrior Terminal (Email)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="warrior@arena.com" className="h-14 bg-black/40 border-white/10 rounded-xl" />
            </div>
            
            {!showReset && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Secure Cipher</Label>
                    <Button variant="link" onClick={() => setShowReset(true)} className="text-[10px] uppercase font-black tracking-widest p-0 h-auto text-primary">Key Recovery?</Button>
                  </div>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 bg-black/40 border-white/10 rounded-xl" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Recruiter Code (Optional)</Label>
                   <Input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="EX: 74426xxxx" className="h-14 bg-black/40 border-white/10 rounded-xl uppercase font-black" />
                </div>
              </>
            )}

            <div className="flex flex-col gap-3 pt-2">
              {showReset ? (
                <>
                  <Button onClick={handleResetPassword} disabled={isLoading} className="h-16 font-black rounded-xl bg-primary">
                    {isLoading ? <Loader2 className="animate-spin" /> : "TRANSMIT RECOVERY KEY"}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowReset(false)} className="h-10 font-bold uppercase text-[10px]">Back to Terminal</Button>
                </>
              ) : (
                <>
                  <Button onClick={() => handleEmailAuth('login')} disabled={isLoading} className="h-16 font-black rounded-xl bg-primary shadow-xl shadow-primary/20 text-lg uppercase italic">AUTHENTICATE</Button>
                  <Button variant="outline" onClick={() => handleEmailAuth('signup')} disabled={isLoading} className="h-14 font-black rounded-xl border-white/10 hover:bg-white/5 uppercase text-[10px] tracking-widest">ENLIST NEW WARRIOR</Button>
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="phone" className="mt-6">
          <Card className="bg-card/20 border-white/5 rounded-[2rem] p-8 space-y-4 shadow-2xl">
            <div id="recaptcha-container"></div>
            {!confirmationResult ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Regional Hub</Label>
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="bg-black/40 border-white/10 h-14 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121216] border-white/10">
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile Comms</Label>
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="9876543210" className="h-14 bg-black/40 border-white/10 rounded-xl" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">OTP Verification</Label>
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} className="h-16 bg-black/40 border-white/10 rounded-xl text-center text-3xl font-black tracking-[0.5em]" />
              </div>
            )}
            <Button onClick={handlePhoneFlow} disabled={isLoading} className="w-full h-18 font-black rounded-xl bg-primary shadow-xl shadow-primary/20 text-lg uppercase italic">
              {isLoading ? <Loader2 className="animate-spin" /> : (!confirmationResult ? "TRANSMIT OTP" : "VERIFY IDENTITY")}
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
