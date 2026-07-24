
export interface CampusTheme {
  id: string;
  name: string;
  category: 'Festival' | 'Classic' | 'Gaming' | 'Neon' | 'Elegant';
  primary: string; // HSL: "217 91% 60%"
  background: string;
  accent: string;
  isFestival?: boolean;
}

const FESTIVAL_THEMES: CampusTheme[] = [
  { id: 'diwali', name: 'Diwali Spark', category: 'Festival', primary: '25 100% 50%', background: '20 20% 4%', accent: '45 100% 50%', isFestival: true },
  { id: 'holi', name: 'Holi Splash', category: 'Festival', primary: '330 100% 50%', background: '280 20% 5%', accent: '180 100% 50%', isFestival: true },
  { id: 'eid', name: 'Eid Moon', category: 'Festival', primary: '142 76% 36%', background: '142 40% 4%', accent: '45 100% 50%', isFestival: true },
  { id: 'christmas', name: 'X-Mas Pine', category: 'Festival', primary: '0 84% 60%', background: '120 40% 4%', accent: '0 0% 100%', isFestival: true },
  { id: 'independence', name: 'Patriot Pulse', category: 'Festival', primary: '25 100% 50%', background: '210 20% 5%', accent: '142 76% 36%', isFestival: true },
];

const GAMING_THEMES: CampusTheme[] = [
  { id: 'bgmi', name: 'Erangel Dusk', category: 'Gaming', primary: '80 100% 40%', background: '100 10% 4%', accent: '40 100% 50%' },
  { id: 'freefire', name: 'Booyah Blaze', category: 'Gaming', primary: '15 100% 50%', background: '15 10% 4%', accent: '200 100% 50%' },
  { id: 'valorant', name: 'Radiant Edge', category: 'Gaming', primary: '350 100% 60%', background: '240 10% 4%', accent: '180 100% 50%' },
  { id: 'cod', name: 'Stealth Ops', category: 'Gaming', primary: '0 0% 100%', background: '0 0% 5%', accent: '0 80% 50%' },
];

const NEON_THEMES: CampusTheme[] = Array.from({ length: 40 }).map((_, i) => ({
  id: `neon-${i}`,
  name: `Neon Flux ${i + 1}`,
  category: 'Neon',
  primary: `${(i * 15) % 360} 100% 60%`,
  background: `${(i * 15) % 360} 20% 4%`,
  accent: `${((i * 15) + 180) % 360} 100% 50%`
}));

const CLASSIC_THEMES: CampusTheme[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `classic-${i}`,
  name: `Scholar Elite ${i + 1}`,
  category: 'Classic',
  primary: `${(i * 10) % 360} 50% 50%`,
  background: `240 10% 4%`,
  accent: `${(i * 10) % 360} 50% 30%`
}));

export const MASTER_THEMES: CampusTheme[] = [
  ...FESTIVAL_THEMES,
  ...GAMING_THEMES,
  ...NEON_THEMES,
  ...CLASSIC_THEMES
];
