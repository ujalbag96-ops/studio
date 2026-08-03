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
  { id: 'mock_tests', label: 'AI Mock Tests', desc: 'Adaptive Prep Exams', icon: ClipboardList, route: '/mock-tests', category: 'Learning', visibilityKey: 'node_mock_tests' },
  { id: 'formula_sheets', label: 'Formula Hub', desc: 'STEM Quick Reference', icon: Terminal, route: '/formulas', category: 'Learning', visibilityKey: 'node_formula_sheets' },

  // --- SKILL & CAREER ---
  { id: 'resume_builder', label: 'Resume Node', desc: 'Industrial ATS Builder', icon: Briefcase, route: '/resume', category: 'Skills', visibilityKey: 'node_resume_builder' },
  { id: 'web_dev', label: 'Web Roadmap', desc: 'Coding Career Signals', icon: Terminal, route: '/roadmap', category: 'Skills', visibilityKey: 'node_web_dev' },

  // --- EARNING SECTOR ---
  { id: 'income_node', label: 'POCKET MONEY (CPA)', desc: 'Mission-Linked Dividend', icon: Zap, route: '/earning-hub', category: 'Earning', visibilityKey: 'node_global_cpa' },
  { id: 'direct_stream', label: 'DIRECT STREAM HUB', desc: 'Custom MP4/M3U8 Node', icon: Video, route: '/direct-stream', category: 'Earning', visibilityKey: 'node_direct_stream' },
  { id: 'youtube_stream', label: 'YOUTUBE STREAM HUB', desc: 'High-Bandwidth YT Node', icon: Youtube, route: '/youtube-stream', category: 'Earning', visibilityKey: 'node_youtube_stream' },
  { id: 'quiz_arena', label: 'QUIZ ARENA HUB', desc: 'High-Yield MCQ Pool', icon: Target, route: '/quiz-arena', category: 'Earning', visibilityKey: 'node_quiz_arena' },
  { id: 'spin_wheel', label: 'JHILLI SPIN', desc: 'Daily Prize Wheel', icon: RefreshCw, route: '/rewards', category: 'Earning', visibilityKey: 'node_spin_wheel' },
  { id: 'scratch_cards', label: 'SCRATCH BOUNTY', desc: 'Surprise Reward Signals', icon: Gift, route: '/dashboard', category: 'Earning', visibilityKey: 'node_scratch_cards' },
  { id: 'refer_earn', label: 'REFERRAL ENGINE', desc: '30% Network Commission', icon: Users, route: '/refer', category: 'Earning', visibilityKey: 'node_referral_engine' },

  // --- UTILITY & PRODUCTIVITY ---
  { id: 'pomodoro', label: 'Study Timer', desc: 'Focus Pulse Control', icon: Clock, route: '/focus', category: 'Productivity', visibilityKey: 'node_pomodoro' },
  { id: 'gpa_calc', label: 'GPA Terminal', desc: 'Grade Integrity Matrix', icon: Calculator, route: '/calculator', category: 'Productivity', visibilityKey: 'node_gpa_calc' },

  // --- SYSTEM & ADMIN ---
  { id: 'push_center', label: 'Broadcaster', desc: 'Live System Alerts', icon: Mail, route: '/inbox', category: 'System', visibilityKey: 'node_push_center' }
];
