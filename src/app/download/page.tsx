'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Download, 
  ShieldCheck, 
  Zap, 
  ArrowLeft,
  Info,
  CheckCircle2,
  Lock,
  SmartphoneNfc
} from 'lucide-react';
import Link from 'next/link';

export default function DownloadPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="space-y-6 pt-12 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-xl">
          <Smartphone className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Industrial Mobile Node v1.0</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">Get the <br /><span className="text-primary">App</span></h1>
        <p className="text-muted-foreground font-medium text-lg max-w-xl mx-auto leading-relaxed uppercase tracking-tight opacity-70">
          Experience the full performance of the CampusHub Arena on your Android device. Faster signals, smoother gaming, and instant alerts.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Download className="h-40 w-48 text-primary" />
           </div>
           
           <div className="space-y-6 relative z-10">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl">
                 <SmartphoneNfc className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-3xl font-black uppercase italic text-white leading-tight">Android APK</h3>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Industrial Release v1.0.0</p>
              </div>
              
              <ul className="space-y-4">
                 <AppFeature text="One-Tap Login via Gmail" />
                 <AppFeature text="Push Signal Notifications" />
                 <AppFeature text="Zero-Latency Gaming" />
                 <AppFeature text="Encrypted Wallet Ledger" />
              </ul>

              <Button asChild className="w-full h-20 bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase italic rounded-2xl shadow-2xl shadow-primary/20 group">
                 <a href="#" target="_blank">
                    DOWNLOAD APK <Download className="ml-3 h-6 w-6 animate-bounce" />
                 </a>
              </Button>
              <p className="text-[8px] font-bold text-muted-foreground text-center uppercase tracking-widest italic opacity-40">
                *Requires "Install from Unknown Sources" permission enabled.
              </p>
           </div>
        </Card>

        <div className="space-y-8">
           <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
              <h4 className="text-sm font-black uppercase italic flex items-center gap-3 text-white">
                 <ShieldCheck className="text-primary h-5 w-5" /> Security Protocol
              </h4>
              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest">
                 The CampusHub Android build uses industrial-grade AES-256 encryption. Our anti-fraud node is integrated directly into the APK manifest to prevent session hijacking and multiple account exploits.
              </p>
           </Card>

           <Card className="bg-[#121212] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
              <h4 className="text-sm font-black uppercase italic flex items-center gap-3 text-white">
                 <Info className="text-amber-500 h-5 w-5" /> Technical Info
              </h4>
              <div className="space-y-4">
                 <TechRow label="Architecture" value="Capacitor 6.0" />
                 <TechRow label="SDK Minimum" value="Android 21+" />
                 <TechRow label="Build Logic" value="Next.js 15" />
                 <TechRow label="Package" value="com.campushub.app" />
              </div>
           </Card>
        </div>
      </div>

      <div className="text-center">
         <Button variant="ghost" asChild className="text-[10px] font-black uppercase text-muted-foreground hover:text-white">
            <Link href="/dashboard"><ArrowLeft className="h-3 w-3 mr-2" /> Back to Portfolio</Link>
         </Button>
      </div>
    </div>
  );
}

function AppFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-[10px] font-black uppercase text-white/80 tracking-widest italic">
       <CheckCircle2 className="h-4 w-4 text-green-500" /> {text}
    </li>
  );
}

function TechRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-2">
       <span className="text-[9px] font-black uppercase text-muted-foreground">{label}</span>
       <span className="text-[9px] font-bold text-white uppercase italic">{value}</span>
    </div>
  );
}
