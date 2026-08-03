import React from 'react';
import { 
  Book, GraduationCap, FileText, ClipboardList, Monitor, Award, 
  Target, Zap, Flame, Users, ShoppingBag, Smartphone, 
  Dices, Gift, Clock, Calculator, ShieldCheck, Mail, BarChart3,
  Search, Video, MessageSquare, HardDrive, BrainCircuit, Terminal,
  Briefcase, Palette, Languages, Star, Activity, LineChart, RefreshCw,
  Youtube
} from 'lucide-react';

export type ModuleCategory = 'Learning' | 'Skills' | 'Earning' | 'Productivity' | 'System';

export interface AppModule {
  id: string;
  label: string;
  desc: string;
  icon: any;
  route: string;
  category: ModuleCategory;
  visibilityKey: string;
}

export const MODULE_REGISTRY: AppModule[] = [
  // --- ADVANCED EDUCATION ---
  { id: 'scholar_hub', label: 'Scholar Hub', desc: 'NCERT/Global Books', icon: Book, route: '/campus', category: 'Learning', visibilityKey: 'node_scholar_dividend' },
  { id: 'ai_tutor', label: 'AI Human Tutor', desc: 'Senior Professor Node', icon: GraduationCap, route: '/campus/viewer', category: 'Learning', visibilityKey: 'node_tutor_visible' },
  
  // --- EARNING SECTOR ---
  { id: 'income_node', label: 'POCKET MONEY (CPA)', desc: 'Mission-Linked Dividend', icon: Zap, route: '/earning-hub', category: 'Earning', visibilityKey: 'node_global_cpa' },
  { id: 'direct_stream', label: 'DIRECT STREAM HUB', desc: 'Custom MP4/M3U8 Node', icon: Video, route: '/direct-stream', category: 'Earning', visibilityKey: 'node_direct_stream' },
  { id: 'youtube_stream', label: 'YOUTUBE STREAM HUB', desc: 'High-Bandwidth YT Node', icon: Youtube, route: '/youtube-stream', category: 'Earning', visibilityKey: 'node_youtube_stream' },
  { id: 'video_quiz', label: 'VIDEO QUIZ ARENA', desc: 'Watch & Solve Yield', icon: Target, route: '/video-quiz', category: 'Earning', visibilityKey: 'node_video_quiz' },
  { id: 'quiz_arena', label: 'QUIZ ARENA HUB', desc: 'High-Yield MCQ Pool', icon: Target, route: '/quiz-arena', category: 'Earning', visibilityKey: 'node_quiz_arena' },
  { id: 'spin_wheel', label: 'JHILLI SPIN', desc: 'Daily Prize Wheel', icon: RefreshCw, route: '/rewards', category: 'Earning', visibilityKey: 'node_spin_wheel' },
  { id: 'scratch_cards', label: 'SCRATCH BOUNTY', desc: 'Surprise Reward Signals', icon: Gift, route: '/dashboard', category: 'Earning', visibilityKey: 'node_scratch_cards' },
  { id: 'refer_earn', label: 'REFERRAL ENGINE', desc: '30% Network Commission', icon: Users, route: '/refer', category: 'Earning', visibilityKey: 'node_referral_engine' },

  // --- SYSTEM ---
  { id: 'push_center', label: 'Broadcaster', desc: 'Live System Alerts', icon: Mail, route: '/inbox', category: 'System', visibilityKey: 'node_push_center' }
];
