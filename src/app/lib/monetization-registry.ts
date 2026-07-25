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
  UserCheck,
  Signal
} from 'lucide-react';

export type MonCategory = 'CPA' | 'Ads' | 'Surveys' | 'MicroTasks' | 'Fintech' | 'Gaming' | 'Premium';

export interface MonModule {
  id: string;
  label: string;
  provider: string;
  category: MonCategory;
  visibilityKey: string;
  icon: any;
  eCPMTier: 'High' | 'Medium' | 'Standard';
}

export const MONETIZATION_REGISTRY: MonModule[] = [
  { id: 'mon_adgate_active', label: 'AdGate Media', provider: 'Global CPA', category: 'CPA', visibilityKey: 'mon_adgate_active', icon: Smartphone, eCPMTier: 'High' },
  { id: 'mon_cpalead_active', label: 'CPALead', provider: 'Direct CPA', category: 'CPA', visibilityKey: 'mon_cpalead_active', icon: Zap, eCPMTier: 'High' },
  { id: 'mon_offertoro_active', label: 'OfferToro', provider: 'Offerwall', category: 'CPA', visibilityKey: 'mon_offertoro_active', icon: Target, eCPMTier: 'Medium' },
  { id: 'mon_adscend_active', label: 'Adscend Media', provider: 'CPA/Video', category: 'CPA', visibilityKey: 'mon_adscend_active', icon: Globe, eCPMTier: 'High' },
  { id: 'mon_wannads_active', label: 'Wannads', provider: 'Global Wall', category: 'CPA', visibilityKey: 'mon_wannads_active', icon: ClipboardList, eCPMTier: 'Medium' },
  { id: 'mon_notik_active', label: 'Notik.me', provider: 'App Installs', category: 'CPA', visibilityKey: 'mon_notik_active', icon: Signal, eCPMTier: 'High' },
  { id: 'mon_revenue_active', label: 'RevenueWall', provider: 'CPA Node', category: 'CPA', visibilityKey: 'mon_revenue_active', icon: Coins, eCPMTier: 'Medium' },
  { id: 'mon_bitlabs_wall_active', label: 'BitLabs Wall', provider: 'Offer/Survey', category: 'CPA', visibilityKey: 'mon_bitlabs_wall_active', icon: Zap, eCPMTier: 'High' },
  { id: 'mon_cpagrip_active', label: 'CPAGrip', provider: 'Content Lock', category: 'CPA', visibilityKey: 'mon_cpagrip_active', icon: Lock, eCPMTier: 'Medium' },
  { id: 'mon_monlix_active', label: 'Monlix', provider: 'Ad Network', category: 'CPA', visibilityKey: 'mon_monlix_active', icon: Search, eCPMTier: 'High' },
  { id: 'mon_admob_active', label: 'Google AdMob', provider: 'Waterfall', category: 'Ads', visibilityKey: 'mon_admob_active', icon: PlayCircle, eCPMTier: 'High' },
  { id: 'mon_unity_active', label: 'Unity Ads', provider: 'Gaming Video', category: 'Ads', visibilityKey: 'mon_unity_active', icon: Video, eCPMTier: 'High' },
  { id: 'mon_pollfish_active', label: 'Pollfish', provider: 'Router', category: 'Surveys', visibilityKey: 'mon_pollfish_active', icon: ClipboardList, eCPMTier: 'High' },
  { id: 'mon_theorem_active', label: 'TheoremReach', provider: 'Paid Surveys', category: 'Surveys', visibilityKey: 'mon_theorem_active', icon: Target, eCPMTier: 'High' },
  { id: 'mon_remotasks_active', label: 'Remotasks', provider: 'Scale AI', category: 'MicroTasks', visibilityKey: 'mon_remotasks_active', icon: Cpu, eCPMTier: 'High' },
  { id: 'mon_quest_active', label: 'Mega Quest', provider: 'Bounty Hub', category: 'Fintech', visibilityKey: 'mon_quest_active', icon: Trophy, eCPMTier: 'High' }
];