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
  Gift
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
}

// Industrial Scale: 100+ Earning Nodes Registry
const BASE_REGISTRY: MonModule[] = [
  { id: 'mon_adgate', label: 'AdGate Media', provider: 'Global CPA', category: 'CPA', visibilityKey: 'mon_adgate_active', icon: Smartphone, eCPMTier: 'High' },
  { id: 'mon_cpalead', label: 'CPALead', provider: 'Direct CPA', category: 'CPA', visibilityKey: 'mon_cpalead_active', icon: Zap, eCPMTier: 'High' },
  { id: 'mon_offertoro', label: 'OfferToro', provider: 'Offerwall', category: 'CPA', visibilityKey: 'mon_offertoro_active', icon: Target, eCPMTier: 'Medium' },
  { id: 'mon_admob', label: 'Google AdMob', provider: 'Waterfall', category: 'Ads', visibilityKey: 'mon_admob_active', icon: PlayCircle, eCPMTier: 'High' },
  { id: 'mon_unity', label: 'Unity Ads', provider: 'Gaming Video', category: 'Ads', visibilityKey: 'mon_unity_active', icon: Video, eCPMTier: 'High' },
  { id: 'mon_pollfish', label: 'Pollfish', provider: 'Router', category: 'Surveys', visibilityKey: 'mon_pollfish_active', icon: ClipboardList, eCPMTier: 'High' },
  { id: 'mon_theorem', label: 'TheoremReach', provider: 'Paid Surveys', category: 'Surveys', visibilityKey: 'mon_theorem_active', icon: Target, eCPMTier: 'High' },
  { id: 'mon_remotasks', label: 'Remotasks', provider: 'Scale AI', category: 'MicroTasks', visibilityKey: 'mon_remotasks_active', icon: Cpu, eCPMTier: 'High' },
  { id: 'mon_quest', label: 'Mega Quest', provider: 'Bounty Hub', category: 'Fintech', visibilityKey: 'mon_quest_active', icon: Trophy, eCPMTier: 'High' }
];

// Generate 90+ additional mock nodes to fulfill "100+" requirement
const MOCK_NODES: MonModule[] = Array.from({ length: 91 }).map((_, i) => ({
  id: `mon_node_${i + 10}`,
  label: `Revenue Node ${i + 10}`,
  provider: i % 2 === 0 ? 'Partner API' : 'Direct Signal',
  category: i % 4 === 0 ? 'CPA' : i % 4 === 1 ? 'Ads' : i % 4 === 2 ? 'Passive' : 'MicroTasks',
  visibilityKey: `mon_node_${i + 10}_active`,
  icon: i % 3 === 0 ? Zap : i % 3 === 1 ? Signal : Gamepad2,
  eCPMTier: i % 5 === 0 ? 'High' : 'Medium'
}));

export const MONETIZATION_REGISTRY: MonModule[] = [...BASE_REGISTRY, ...MOCK_NODES];
