'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Target, Zap, Activity, Info, Layout } from 'lucide-react';
import RiskDisclosureModal from './RiskDisclosureModal';

export default function Footer() {
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    // Hydration-safe dynamic year update
    const year = new Date().getFullYear();
    if (year > 2026) {
      setCurrentYear(year);
    }
  }, []);

  return (
    <footer className="bg-[#0a0a0f] border-t border-white/5 py-12 pb-32 md:pb-12 mt-20">
      <RiskDisclosureModal isOpen={isRiskModalOpen} onOpenChange={setIsRiskModalOpen} />
      
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black italic text-white uppercase tracking-tighter">BRACKET<span className="text-primary">BATTLES</span></span>
          </Link>
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
             <div className="flex items-center gap-2 text-primary">
                <Info className="h-3 w-3" />
                <span className="text-[8px] font-black uppercase tracking-widest">Legal Disclaimer</span>
             </div>
             <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest">
               This app is for educational purposes. All notes are user-contributed or collected from public domains.
             </p>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Arena Sectors</h4>
          <ul className="space-y-3">
            <li><FooterLink href="/about" label="Platform Overview" /></li>
            <li><FooterLink href="/campus" label="Resource Locker" /></li>
            <li><FooterLink href="/earning-hub" label="Earning Hub" /></li>
            <li><FooterLink href="/leaderboard" label="Hall of Fame" /></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Support Node</h4>
          <ul className="space-y-3">
            <li><FooterLink href="/terms" label="Terms of Service" /></li>
            <li><FooterLink href="/privacy" label="Privacy Policy" /></li>
            <li>
              <button 
                onClick={() => setIsRiskModalOpen(true)}
                className="text-[11px] font-black uppercase italic text-primary hover:text-primary/80 transition-all flex items-center gap-2"
              >
                <ShieldCheck className="h-3 w-3" /> Risk Disclosure
              </button>
            </li>
            <li><FooterLink href="https://t.me/bracketbattles_support" label="Telegram Support" external /></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">System Status</h4>
          <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-muted-foreground">Gateway</span>
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-green-500">
                   <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Online
                </span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-muted-foreground">Library Sync</span>
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-green-500">
                   <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                </span>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">© {currentYear} Bracket Battles Industrial. All Rights Reserved.</p>
        <div className="flex items-center gap-4 opacity-30">
           <Activity className="h-4 w-4" />
           <ShieldCheck className="h-4 w-4" />
           <Target className="h-4 w-4" />
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  const content = (
    <span className="text-[10px] font-bold uppercase text-muted-foreground hover:text-white transition-colors cursor-pointer tracking-widest">
      {label}
    </span>
  );

  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
  }

  return <Link href={href}>{content}</Link>;
}
