
import React from 'react';
import { 
  Book, GraduationCap, FileText, ClipboardList, Monitor, Award, 
  Target, Zap, Flame, Users, ShoppingBag, Smartphone, 
  Dices, Gift, Clock, Calculator, ShieldCheck, Mail, BarChart3,
  Search, Video, MessageSquare, HardDrive, BrainCircuit, Terminal,
  Briefcase, Palette, Languages, Star, Activity, LineChart
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
  { id: 'live_classroom', label: 'Live Classroom', desc: 'Real-time Study Sessions', icon: Video, route: '/live-classroom', category: 'Learning', visibilityKey: 'node_live_classroom' },
  { id: 'handwritten_notes', label: 'Notes Vault', desc: 'Student-Made Resource Hub', icon: FileText, route: '/marketplace', category: 'Learning', visibilityKey: 'node_handwritten_notes' },
  { id: 'formula_sheets', label: 'Formula Hub', desc: 'STEM Quick Reference', icon: Terminal, route: '/formulas', category: 'Learning', visibilityKey: 'node_formula_sheets' },

  // --- SKILL & CAREER ---
  { id: 'resume_builder', label: 'Resume Node', desc: 'Industrial ATS Builder', icon: Briefcase, route: '/resume', category: 'Skills', visibilityKey: 'node_resume_builder' },
  { id: 'typing_master', label: 'Typing Master', desc: 'Speed & Accuracy Audit', icon: Monitor, route: '/typing', category: 'Skills', visibilityKey: 'node_typing_master' },
  { id: 'web_dev', label: 'Web Roadmap', desc: 'Coding Career Signals', icon: Terminal, route: '/roadmap', category: 'Skills', visibilityKey: 'node_web_dev' },
  { id: 'spoken_english', label: 'Spoken English', desc: 'Language Mastery Node', icon: Languages, route: '/english', category: 'Skills', visibilityKey: 'node_spoken_english' },

  // --- ENGAGEMENT & EARNING ---
  { id: 'income_node', label: 'Pocket Money (CPA)', desc: 'Mission-Linked Dividend', icon: Zap, route: '/earning-hub', category: 'Earning', visibilityKey: 'node_global_cpa' },
  { id: 'quiz_arena', label: 'Quiz Arena Hub', desc: 'High-Yield MCQ Pool', icon: Target, route: '/quiz-arena', category: 'Earning', visibilityKey: 'node_quiz_arena' },
  { id: 'spin_wheel', label: 'Jhilli Spin', desc: 'Daily Prize Wheel', icon: RefreshCw, route: '/rewards', category: 'Earning', visibilityKey: 'node_spin_wheel' },
  { id: 'scratch_cards', label: 'Scratch Bounty', desc: 'Surprise Reward Signals', icon: Gift, route: '/dashboard', category: 'Earning', visibilityKey: 'node_scratch_cards' },
  { id: 'refer_earn', label: 'Referral Engine', desc: '30% Network Commission', icon: Users, route: '/refer', category: 'Earning', visibilityKey: 'node_referral_engine' },

  // --- UTILITY & PRODUCTIVITY ---
  { id: 'pomodoro', label: 'Study Timer', desc: 'Focus Pulse Control', icon: Clock, route: '/focus', category: 'Productivity', visibilityKey: 'node_pomodoro' },
  { id: 'gpa_calc', label: 'GPA Terminal', desc: 'Grade Integrity Matrix', icon: Calculator, route: '/calculator', category: 'Productivity', visibilityKey: 'node_gpa_calc' },
  { id: 'doc_scanner', label: 'Doc Scanner', desc: 'Digital PDF Capture', icon: Smartphone, route: '/scanner', category: 'Productivity', visibilityKey: 'node_doc_scanner' },

  // --- SYSTEM & ADMIN ---
  { id: 'support_desk', label: 'Support Desk', desc: '24/7 Security Signal', icon: ShieldCheck, route: '/dashboard', category: 'System', visibilityKey: 'node_support_desk' },
  { id: 'push_center', label: 'Broadcaster', desc: 'Live System Alerts', icon: Mail, route: '/inbox', category: 'System', visibilityKey: 'node_push_center' }
];

import { RefreshCw } from 'lucide-react';
