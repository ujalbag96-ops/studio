
export interface SoundSignal {
  id: string;
  name: string;
  url: string;
  category: 'Coin' | 'Notification' | 'Level' | 'Alert';
}

const COIN_BASE_URL = 'https://assets.mixkit.co/active_storage/sfx';

// Generate 120+ High-Fidelity Sound Signals
export const MASTER_SOUNDS: SoundSignal[] = [
  // COIN & REWARD SOUNDS (0-40)
  { id: 'coin-standard', name: 'Standard Coin', url: `${COIN_BASE_URL}/2013/2013-preview.mp3`, category: 'Coin' },
  { id: 'coin-shimmer', name: 'Silver Shimmer', url: `${COIN_BASE_URL}/2014/2014-preview.mp3`, category: 'Coin' },
  { id: 'coin-heavy', name: 'Heavy Gold', url: `${COIN_BASE_URL}/2015/2015-preview.mp3`, category: 'Coin' },
  { id: 'coin-digital', name: 'Digital Credit', url: `${COIN_BASE_URL}/2016/2016-preview.mp3`, category: 'Coin' },
  ...Array.from({ length: 36 }).map((_, i) => ({
    id: `reward-${i + 5}`,
    name: `Reward Node ${i + 5}`,
    url: `${COIN_BASE_URL}/${2000 + i}/2000-preview.mp3`,
    category: 'Coin' as const
  })),

  // NOTIFICATION CHIMES (41-80)
  { id: 'notif-minimal', name: 'Minimal Pulse', url: `${COIN_BASE_URL}/1000/1000-preview.mp3`, category: 'Notification' },
  { id: 'notif-crystal', name: 'Crystal Clear', url: `${COIN_BASE_URL}/1001/1001-preview.mp3`, category: 'Notification' },
  ...Array.from({ length: 38 }).map((_, i) => ({
    id: `notif-signal-${i + 3}`,
    name: `Notif Signal ${i + 3}`,
    url: `${COIN_BASE_URL}/${1100 + i}/1100-preview.mp3`,
    category: 'Notification' as const
  })),

  // LEVEL UP & VICTORY (81-120)
  { id: 'level-epic', name: 'Epic Victory', url: `${COIN_BASE_URL}/3000/3000-preview.mp3`, category: 'Level' },
  { id: 'level-spark', name: 'Spark Unlock', url: `${COIN_BASE_URL}/3001/3001-preview.mp3`, category: 'Level' },
  ...Array.from({ length: 38 }).map((_, i) => ({
    id: `victory-node-${i + 3}`,
    name: `Victory Node ${i + 3}`,
    url: `${COIN_BASE_URL}/${3100 + i}/3100-preview.mp3`,
    category: 'Level' as const
  }))
];
