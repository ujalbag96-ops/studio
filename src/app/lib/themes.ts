
export interface CampusTheme {
  id: string;
  name: string;
  category: 'Industrial' | 'Neon' | 'Classic' | 'Light';
  primary: string; // HSL: "217 91% 60%"
  background: string;
  accent: string;
  isLight?: boolean;
}

export const MASTER_THEMES: CampusTheme[] = [
  { id: 'dark-default', name: 'Dark Default', category: 'Industrial', primary: '221 92% 60%', background: '220 29% 6%', accent: '160 84% 39%' },
  { id: 'cyberpunk-neon', name: 'Cyberpunk Neon', category: 'Neon', primary: '330 100% 50%', background: '262 89% 7%', accent: '184 100% 50%' },
  { id: 'midnight-blue', name: 'Midnight Blue', category: 'Industrial', primary: '221 83% 53%', background: '224 71% 4%', accent: '199 89% 60%' },
  { id: 'emerald-gold', name: 'Emerald Gold', category: 'Industrial', primary: '160 84% 39%', background: '166 91% 9%', accent: '38 92% 50%' },
  { id: 'sunset-orange', name: 'Sunset Orange', category: 'Industrial', primary: '0 84% 60%', background: '0 85% 5%', accent: '25 95% 53%' },
  { id: 'purple-vibe', name: 'Purple Vibe', category: 'Neon', primary: '259 94% 66%', background: '252 43% 8%', accent: '330 81% 60%' },
  { id: 'crimson-dark', name: 'Crimson Dark', category: 'Industrial', primary: '346 77% 50%', background: '347 73% 4%', accent: '350 94% 71%' },
  { id: 'matrix-green', name: 'Matrix Green', category: 'Neon', primary: '142 71% 45%', background: '144 80% 4%', accent: '140 71% 58%' },
  { id: 'ocean-depths', name: 'Ocean Depths', category: 'Industrial', primary: '189 94% 43%', background: '202 72% 6%', accent: '199 89% 48%' },
  { id: 'royal-gold', name: 'Royal Gold', category: 'Industrial', primary: '45 93% 47%', background: '43 54% 5%', accent: '48 96% 53%' },
  { id: 'pure-light', name: 'Pure Light', category: 'Light', primary: '221 83% 53%', background: '210 40% 98%', accent: '162 94% 30%', isLight: true },
  { id: 'dracula-dark', name: 'Dracula Dark', category: 'Industrial', primary: '265 89% 78%', background: '231 15% 18%', accent: '334 100% 73%' },
];
