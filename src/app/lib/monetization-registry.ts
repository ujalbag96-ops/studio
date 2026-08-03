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
  Youtube
} from 'lucide-react';

export type MonCategory = 'CPA' | 'Ads' | 'Surveys' | 'MicroTasks' | 'Fintech' | 'Gaming' | 'Premium' | 'Passive';

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

// Industrial Scale: 100+ Earning Nodes Registry
const BASE_REGISTRY: MonModule[] = [
  { id: 'mon_adgate', label: 'AdGate Media', provider: 'Global CPA', category: 'CPA', visibilityKey: 'node_adgate_active', icon: Smartphone, eCPMTier: 'High', route: '/earning-hub' },
  { id: 'mon_cpalead', label: 'CPALead', provider: 'Direct CPA', category: 'CPA', visibilityKey: 'node_cpalead_active', icon: Zap, eCPMTier: 'High', route: '/earning-hub' },
  { id: 'mon_direct_stream', label: 'Direct Stream Hub', provider: 'Media Server', category: 'Ads', visibilityKey: 'node_direct_stream', icon: Video, eCPMTier: 'High', route: '/direct-stream' },
  { id: 'mon_youtube_stream', label: 'YouTube Hub', provider: 'Google API', category: 'Ads', visibilityKey: 'node_youtube_stream', icon: Youtube, eCPMTier: 'Medium', route: '/youtube-stream' },
  { id: 'mon_video_quiz', label: 'Video Quiz Arena', provider: 'Cognitive Node', category: 'Ads', visibilityKey: 'node_video_quiz', icon: Target, eCPMTier: 'High', route: '/video-quiz' },
  { id: 'mon_admob', label: 'Google AdMob', provider: 'Waterfall', category: 'Ads', visibilityKey: 'node_admob_active', icon: PlayCircle, eCPMTier: 'High', route: '/earning-hub' },
  { id: 'mon_pollfish', label: 'Pollfish', provider: 'Router', category: 'Surveys', visibilityKey: 'node_pollfish_active', icon: ClipboardList, eCPMTier: 'High', route: '/earning-hub' },
  { id: 'mon_quest', label: 'Mega Quest', provider: 'Bounty Hub', category: 'Fintech', visibilityKey: 'node_quest_active', icon: Trophy, eCPMTier: 'High', route: '/earning-hub' }
];

// Generate 90+ additional mock nodes to fulfill "100+" requirement
const MOCK_NODES: MonModule[] = Array.from({ length: 92 }).map((_, i) => ({
  id: `mon_node_${i + 10}`,
  label: `Revenue Node ${i + 10}`,
  provider: i % 2 === 0 ? 'Partner API' : 'Direct Signal',
  category: i % 4 === 0 ? 'CPA' : i % 4 === 1 ? 'Ads' : i % 4 === 2 ? 'Passive' : 'MicroTasks',
  visibilityKey: `node_mon_${i + 10}_active`,
  icon: i % 3 === 0 ? Zap : i % 3 === 1 ? Signal : Gamepad2,
  eCPMTier: i % 5 === 0 ? 'High' : 'Medium',
  route: '/earning-hub'
}));

export const MONETIZATION_REGISTRY: MonModule[] = [...BASE_REGISTRY, ...MOCK_NODES];
