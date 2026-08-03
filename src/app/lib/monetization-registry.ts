import { 
  Zap, 
  Smartphone, 
  ClipboardList, 
  Video, 
  Target, 
  Globe, 
  Coins, 
  Search,
  Lock,
  Cpu,
  PlayCircle,
  Trophy,
  MapPin,
  Signal,
  Gamepad2,
  Tv,
  Eye,
  MessageSquare,
  Gift,
  Youtube,
  Book,
  GraduationCap,
  Mail,
  RefreshCw
} from 'lucide-react';

export type MonCategory = 'CPA' | 'Ads' | 'Surveys' | 'MicroTasks' | 'Fintech' | 'Gaming' | 'Premium' | 'Passive' | 'Learning' | 'System';

export interface MonModule {
  id: string;
  label: string;
  provider: string;
  category: MonCategory;
  visibilityKey: string;
  icon: any;
  eCPMTier: 'High' | 'Medium' | 'Standard';
  route: string;
}

/**
 * Industrial Hub Registry v10.0
 * Aligned strictly with the App Navigation Drawer / Side Menu.
 * Controls every major sector of the CampusHub Arena.
 */
export const MONETIZATION_REGISTRY: MonModule[] = [
  // --- LEARNING SECTOR ---
  { id: 'mon_scholar_hub', label: 'SCHOLAR HUB', provider: 'Global NCERT', category: 'Learning', visibilityKey: 'node_scholar_dividend', icon: Book, eCPMTier: 'Standard', route: '/campus' },
  { id: 'mon_ai_tutor', label: 'AI HUMAN TUTOR', provider: 'Vision AI Node', category: 'Learning', visibilityKey: 'node_tutor_visible', icon: GraduationCap, eCPMTier: 'High', route: '/campus/viewer' },

  // --- EARNING SECTOR ---
  { id: 'mon_cpalead', label: 'POCKET MONEY (CPA)', provider: 'Global CPA', category: 'CPA', visibilityKey: 'node_global_cpa', icon: Zap, eCPMTier: 'High', route: '/earning-hub' },
  { id: 'mon_direct_stream', label: 'DIRECT STREAM HUB', provider: 'Industrial CDN', category: 'Ads', visibilityKey: 'node_direct_stream', icon: Video, eCPMTier: 'High', route: '/direct-stream' },
  { id: 'mon_youtube_stream', label: 'YOUTUBE STREAM HUB', provider: 'Google Stream', category: 'Ads', visibilityKey: 'node_youtube_stream', icon: Youtube, eCPMTier: 'Medium', route: '/youtube-stream' },
  { id: 'mon_video_quiz', label: 'VIDEO QUIZ ARENA', provider: 'Audit Node', category: 'Ads', visibilityKey: 'node_video_quiz', icon: Target, eCPMTier: 'High', route: '/video-quiz' },
  { id: 'mon_quiz_arena', label: 'QUIZ ARENA HUB', provider: 'MCQ Engine', category: 'Gaming', visibilityKey: 'node_quiz_arena', icon: Target, eCPMTier: 'High', route: '/quiz-arena' },
  { id: 'mon_spin_wheel', label: 'JHILLI SPIN', provider: 'Daily RNG', category: 'Fintech', visibilityKey: 'node_spin_wheel', icon: RefreshCw, eCPMTier: 'Standard', route: '/rewards' },
  { id: 'mon_scratch_cards', label: 'SCRATCH BOUNTY', provider: 'Surprise Node', category: 'Fintech', visibilityKey: 'node_scratch_cards', icon: Gift, eCPMTier: 'Medium', route: '/dashboard' },
  { id: 'mon_referral', label: 'REFERRAL ENGINE', provider: 'MLM Node', category: 'Passive', visibilityKey: 'node_referral_engine', icon: Globe, eCPMTier: 'High', route: '/refer' },

  // --- SYSTEM SECTOR ---
  { id: 'mon_push_center', label: 'BROADCASTER', provider: 'Push API', category: 'System', visibilityKey: 'node_push_center', icon: Mail, eCPMTier: 'Standard', route: '/inbox' }
];
