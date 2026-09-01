export type CountryId =
  | 'KSA'
  | 'EGY'
  | 'UAE'
  | 'IRQ'
  | 'JOR'
  | 'QAT'
  | 'KWT'
  | 'OMN'
  | 'BHR'
  | 'LBN'
  | 'SYR'
  | 'PSE'
  | 'YEM'
  | 'TUR'
  | 'IRN'
  | 'MAR'
  | 'DZA'
  | 'TUN'
  | 'SDN'
  | 'LBY';

export interface CountryInfo {
  id: CountryId;
  nameAr: string;
  nameEn: string;
  code: string;
  flag: string; // Emoji or SVG flag
  symbol: string; // National crest symbol character / icon name
  primaryColor: string; // Main neon glow color (e.g. #00b050)
  secondaryColor: string; // Accent color (e.g. #f6c834)
  glowColor: string; // High luminescence color
  motto: string;
  perkName: string;
  perkDescAr: string;
  perkDescEn: string;
  speedMultiplier: number;
  defenseMultiplier: number;
  laserChargeRateMultiplier: number;
  capsuleAttractionMultiplier: number;
}

export type PelletType = 'ambient' | 'capsule' | 'debris' | 'ejected';

export interface EnergyPellet {
  id: number;
  x: number;
  y: number;
  radius: number;
  mass: number;
  color: string;
  type: PelletType;
  pulsePhase: number;
  vx?: number;
  vy?: number;
  decayTime?: number;
  sourceCountryId?: CountryId;
}

export interface PlayerCell {
  id: string;
  playerId: string;
  name: string;
  countryId: CountryId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  mass: number;
  radius: number;
  color: string;
  secondaryColor: string;
  isPlayer: boolean;
  isBot: boolean;
  canMergeAt: number;
  splitCooldown: number;
  boostActive: boolean;
  kills: number;
  harvestedMass: number;
  avatarUrl?: string;
  laserWarning?: boolean; // Set when targeted by enemy tower
  shatteredTimer?: number;
}

export interface DefenseTower {
  countryId: CountryId;
  x: number;
  y: number;
  charge: number; // 0 to 100
  maxCharge: number;
  range: number; // scanning radius
  laserCooldown: number;
  isTargeting: boolean;
  targetCellId: string | null;
  targetX: number;
  targetY: number;
  totalInterceptions: number;
  lastTargetName?: string;
}

export interface NationalVault {
  id: string;
  countryId: CountryId;
  x: number;
  y: number;
  radius: number;
  storedEnergy: number; // Stored national energy reserves
  maxCapacity: number;
  activeMembersCount: number;
  totalFactionMass: number;
  glowLevel: number; // 1 to 5 based on mass & players
  tower: DefenseTower;
  angleIndex: number;
}

export interface LaserBeam {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  coreColor: string;
  countryId: CountryId;
  progress: number; // 0 to 1
  duration: number; // frames
  damageMass: number;
  targetName: string;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  vy: number;
}

export interface Shockwave {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export type TransactionType =
  | 'INITIAL_GRANT'
  | 'CHARGE_BALL'
  | 'WITHDRAW_TO_WALLET'
  | 'TOWER_DEFENSE_REWARD'
  | 'SHATTER_BOUNTY'
  | 'VAULT_STAKE_DIVIDEND'
  | 'MISSION_REWARD';

export interface WalletTransaction {
  id: string;
  timestamp: number;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  descriptionAr: string;
  descriptionEn: string;
  signature: string;
}

export interface UserWallet {
  publicKey: string;
  energyBalance: number;
  stakedInVault: number;
  totalHarvested: number;
  totalShatteredBounties: number;
  transactions: WalletTransaction[];
  integrityHash: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  countryId: CountryId;
  mass: number;
  isPlayer: boolean;
}

export interface NationalRanking {
  rank: number;
  countryId: CountryId;
  totalEnergy: number;
  activePlayers: number;
  towersActive: number;
}

export interface GameEvent {
  id: string;
  timestamp: number;
  type: 'LASER_STRIKE' | 'VAULT_SURGE' | 'EATEN' | 'SHATTER' | 'RANK_ONE';
  textAr: string;
  textEn: string;
  countryId?: CountryId;
}
