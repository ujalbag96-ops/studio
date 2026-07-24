
import { 
  Zap, 
  Smartphone, 
  ClipboardList, 
  Video, 
  Target, 
  Globe, 
  Coins, 
  Share2, 
  Download, 
  Search,
  MessageSquare,
  Gift,
  Lock,
  Cpu,
  Landmark,
  CreditCard,
  Twitter,
  Youtube,
  PlayCircle
} from 'lucide-react';

export type MonCategory = 'CPA' | 'Ads' | 'Surveys' | 'MicroTasks' | 'Fintech';

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
  // --- 1. GLOBAL CPA & OFFER WALLS (1-10) ---
  { id: 'cpa_adgate', label: 'AdGate Media', provider: 'Global CPA', category: 'CPA', visibilityKey: 'mon_adgate_active', icon: Smartphone, eCPMTier: 'High' },
  { id: 'cpa_cpalead', label: 'CPALead', provider: 'Direct CPA', category: 'CPA', visibilityKey: 'mon_cpalead_active', icon: Zap, eCPMTier: 'High' },
  { id: 'cpa_offertoro', label: 'OfferToro', provider: 'Offerwall', category: 'CPA', visibilityKey: 'mon_offertoro_active', icon: Target, eCPMTier: 'Medium' },
  { id: 'cpa_adscend', label: 'Adscend Media', provider: 'CPA/Video', category: 'CPA', visibilityKey: 'mon_adscend_active', icon: Globe, eCPMTier: 'High' },
  { id: 'cpa_wannads', label: 'Wannads', provider: 'Global Wall', category: 'CPA', visibilityKey: 'mon_wannads_active', icon: ClipboardList, eCPMTier: 'Medium' },
  { id: 'cpa_notik', label: 'Notik.me', provider: 'App Installs', category: 'CPA', visibilityKey: 'mon_notik_active', icon: Download, eCPMTier: 'High' },
  { id: 'cpa_revenue', label: 'RevenueWall', provider: 'CPA Node', category: 'CPA', visibilityKey: 'mon_revenue_active', icon: Coins, eCPMTier: 'Medium' },
  { id: 'cpa_bitlabs', label: 'BitLabs Wall', provider: 'Offer/Survey', category: 'CPA', visibilityKey: 'mon_bitlabs_wall_active', icon: Zap, eCPMTier: 'High' },
  { id: 'cpa_cpagrip', label: 'CPAGrip', provider: 'Content Lock', category: 'CPA', visibilityKey: 'mon_cpagrip_active', icon: Lock, eCPMTier: 'Medium' },
  { id: 'cpa_monlix', label: 'Monlix', provider: 'Ad Network', category: 'CPA', visibilityKey: 'mon_monlix_active', icon: Search, eCPMTier: 'High' },

  // --- 2. REWARDED VIDEO & INTERSTITIALS (11-20) ---
  { id: 'ads_admob', label: 'Google AdMob', provider: 'Waterfall', category: 'Ads', visibilityKey: 'mon_admob_active', icon: PlayCircle, eCPMTier: 'High' },
  { id: 'ads_unity', label: 'Unity Ads', provider: 'Gaming Video', category: 'Ads', visibilityKey: 'mon_unity_active', icon: Video, eCPMTier: 'High' },
  { id: 'ads_applovin', label: 'AppLovin MAX', provider: 'High Fill', category: 'Ads', visibilityKey: 'mon_applovin_active', icon: Zap, eCPMTier: 'High' },
  { id: 'ads_ironsource', label: 'ironSource', provider: 'Global Video', category: 'Ads', visibilityKey: 'mon_ironsource_active', icon: Target, eCPMTier: 'High' },
  { id: 'ads_facebook', label: 'Meta Audience', provider: 'Social Ads', category: 'Ads', visibilityKey: 'mon_facebook_active', icon: Share2, eCPMTier: 'High' },
  { id: 'ads_vungle', label: 'Vungle/Liftoff', provider: 'Performance', category: 'Ads', visibilityKey: 'mon_vungle_active', icon: Zap, eCPMTier: 'Medium' },
  { id: 'ads_chartboost', label: 'Chartboost', provider: 'Game Ads', category: 'Ads', visibilityKey: 'mon_chartboost_active', icon: PlayCircle, eCPMTier: 'Medium' },
  { id: 'ads_inmobi', label: 'InMobi', provider: 'Global Mobile', category: 'Ads', visibilityKey: 'mon_inmobi_active', icon: Globe, eCPMTier: 'High' },
  { id: 'ads_pangle', label: 'Pangle TikTok', provider: 'Video Node', category: 'Ads', visibilityKey: 'mon_pangle_active', icon: Video, eCPMTier: 'High' },
  { id: 'ads_yandex', label: 'Yandex Ads', provider: 'EU/Global', category: 'Ads', visibilityKey: 'mon_yandex_active', icon: Search, eCPMTier: 'Medium' },

  // --- 3. PAID SURVEYS & MARKET RESEARCH (21-30) ---
  { id: 'survey_pollfish', label: 'Pollfish', provider: 'Router', category: 'Surveys', visibilityKey: 'mon_pollfish_active', icon: ClipboardList, eCPMTier: 'High' },
  { id: 'survey_theorem', label: 'TheoremReach', provider: 'Paid Surveys', category: 'Surveys', visibilityKey: 'mon_theorem_active', icon: Target, eCPMTier: 'High' },
  { id: 'survey_cpx', label: 'CPX Research', provider: 'Survey Wall', category: 'Surveys', visibilityKey: 'mon_cpx_active', icon: Search, eCPMTier: 'High' },
  { id: 'survey_bitlabs', label: 'BitLabs Surveys', provider: 'Elite Router', category: 'Surveys', visibilityKey: 'mon_bitlabs_survey_active', icon: Zap, eCPMTier: 'High' },
  { id: 'survey_tap', label: 'TapResearch', provider: 'Corporate', category: 'Surveys', visibilityKey: 'mon_tap_active', icon: Landmark, eCPMTier: 'Medium' },
  { id: 'survey_inbrain', label: 'InBrain AI', provider: 'AI Match', category: 'Surveys', visibilityKey: 'mon_inbrain_active', icon: Cpu, eCPMTier: 'High' },
  { id: 'survey_yuno', label: 'Yuno Surveys', provider: 'Global Feed', category: 'Surveys', visibilityKey: 'mon_yuno_active', icon: Globe, eCPMTier: 'Medium' },
  { id: 'survey_peanut', label: 'Peanut Labs', provider: 'Legacy Wall', category: 'Surveys', visibilityKey: 'mon_peanut_active', icon: ClipboardList, eCPMTier: 'Medium' },
  { id: 'survey_toluna', label: 'Toluna Insights', provider: 'Market Research', category: 'Surveys', visibilityKey: 'mon_toluna_active', icon: Search, eCPMTier: 'High' },
  { id: 'survey_brain', label: 'Brainly Survey', provider: 'Student Feed', category: 'Surveys', visibilityKey: 'mon_brainly_active', icon: Zap, eCPMTier: 'Medium' },

  // --- 4. MICRO-TASK & GIG ECONOMY (31-40) ---
  { id: 'task_captcha', label: 'Captcha Solve', provider: 'Micro-Gig', category: 'MicroTasks', visibilityKey: 'mon_captcha_active', icon: Lock, eCPMTier: 'Standard' },
  { id: 'task_youtube', label: 'YT Engagement', provider: 'Watch/Sub', category: 'MicroTasks', visibilityKey: 'mon_youtube_active', icon: Youtube, eCPMTier: 'Standard' },
  { id: 'task_social', label: 'Social Echo', provider: 'Follow/Like', category: 'MicroTasks', visibilityKey: 'mon_social_echo_active', icon: Twitter, eCPMTier: 'Standard' },
  { id: 'task_install', label: 'Elite Installs', provider: 'App Review', category: 'MicroTasks', visibilityKey: 'mon_install_active', icon: Download, eCPMTier: 'Medium' },
  { id: 'task_label', label: 'Data Labeling', provider: 'AI Training', category: 'MicroTasks', visibilityKey: 'mon_labeling_active', icon: Cpu, eCPMTier: 'Medium' },
  { id: 'task_scrap', label: 'Web Validator', provider: 'Verification', category: 'MicroTasks', visibilityKey: 'mon_web_valid_active', icon: Globe, eCPMTier: 'Standard' },
  { id: 'task_links', label: 'Shortlinks', provider: 'Gateway', category: 'MicroTasks', visibilityKey: 'mon_shortlinks_active', icon: Share2, eCPMTier: 'Standard' },
  { id: 'task_files', label: 'File Rewards', provider: 'Upload/Earn', category: 'MicroTasks', visibilityKey: 'mon_files_active', icon: Download, eCPMTier: 'Standard' },
  { id: 'task_prompt', label: 'AI Prompter', provider: 'LLM Train', category: 'MicroTasks', visibilityKey: 'mon_ai_prompt_active', icon: MessageSquare, eCPMTier: 'High' },
  { id: 'task_transcribe', label: 'Transcription', provider: 'Audio Gig', category: 'MicroTasks', visibilityKey: 'mon_transcribe_active', icon: MessageSquare, eCPMTier: 'Medium' },

  // --- 5. PASSIVE INCOME & FINTECH (41-50) ---
  { id: 'fin_bandwidth', label: 'Bandwidth Hub', provider: 'Proxy Passive', category: 'Fintech', visibilityKey: 'mon_bandwidth_active', icon: Cpu, eCPMTier: 'Medium' },
  { id: 'fin_mining', label: 'Mining Sim', provider: 'Web3 Passive', category: 'Fintech', visibilityKey: 'mon_mining_active', icon: Coins, eCPMTier: 'Standard' },
  { id: 'fin_faucet', label: 'Crypto Faucet', provider: 'Claim Loop', category: 'Fintech', visibilityKey: 'mon_faucet_active', icon: Zap, eCPMTier: 'Standard' },
  { id: 'fin_referral', label: 'Multi-Tier Ref', provider: '3-Level Comm', category: 'Fintech', visibilityKey: 'mon_multi_referral_active', icon: Share2, eCPMTier: 'High' },
  { id: 'fin_market', label: 'Branded Goods', provider: 'Digital Shop', category: 'Fintech', visibilityKey: 'mon_market_active', icon: Gift, eCPMTier: 'High' },
  { id: 'fin_pass', label: 'Premium Pass', category: 'Fintech', visibilityKey: 'mon_premium_pass_active', provider: 'Subscription', icon: CreditCard, eCPMTier: 'High' },
  { id: 'fin_promo', label: 'Promo Wall', provider: 'App Boost', category: 'Fintech', visibilityKey: 'mon_promo_active', icon: Target, eCPMTier: 'Medium' },
  { id: 'fin_spin', label: 'Ad Multiplier', provider: 'Spin-to-Win', category: 'Fintech', visibilityKey: 'mon_spin_ad_active', icon: PlayCircle, eCPMTier: 'Medium' },
  { id: 'fin_scratch', label: 'Scratch Layer', provider: 'Bounty Card', category: 'Fintech', visibilityKey: 'mon_scratch_layer_active', icon: Gift, eCPMTier: 'Medium' },
  { id: 'fin_payout', label: 'Auto Payouts', provider: 'Instant Node', category: 'Fintech', visibilityKey: 'mon_auto_payout_active', icon: Landmark, eCPMTier: 'High' },
];
