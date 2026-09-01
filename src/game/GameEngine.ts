import {
  CountryId,
  EnergyPellet,
  PlayerCell,
  NationalVault,
  LaserBeam,
  FloatingText,
  Shockwave,
  Particle,
  LeaderboardEntry,
  NationalRanking,
  GameEvent,
  PelletType,
} from '../types';
import { COUNTRIES_DATA, COUNTRIES_LIST, ARENA_CONFIG } from '../data/countries';
import { soundManager } from '../services/sound';
import { secureWallet } from '../services/securityWallet';

const BOT_NAMES: Record<CountryId, string[]> = {
  KSA: ['صقر_نجد', 'طويق_السيادي', 'فارس_الرياض', 'سيف_المملكة'],
  EGY: ['نسر_الأهرام', 'طاقة_طيبة', 'ابن_النيل', 'حورس_المشع'],
  UAE: ['برج_المستقبل', 'فارس_دبي', 'صقر_أبوظبي', 'الدرع_السيبراني'],
  IRQ: ['سيف_الرافدين', 'أسد_بابل', 'طاقة_بغداد', 'فارس_دجلة'],
  JOR: ['نشمي_البتراء', 'صقر_عمّان', 'درع_الكرك', 'حامي_القلعة'],
  QAT: ['لؤلؤة_الدوحة', 'صقر_قطر', 'سفير_الطاقة', 'تميم_المجد'],
  KWT: ['فارس_الكويت', 'موج_الخليج', 'درع_الأحمدي', 'سيف_السور'],
  OMN: ['حكيم_مسقط', 'درع_ظفار', 'سيف_نزوى', 'شهم_عُمان'],
  BHR: ['لؤلؤة_المنامة', 'فارس_المحرق', 'برق_البحرين', 'صقر_دلمون'],
  LBN: ['أرز_بيروت', 'صامد_جبيل', 'فينيق_الشامخ', 'جبل_لبنان'],
  SYR: ['سيف_دمشق', 'نسر_قاسيون', 'قلعة_حلب', 'ياسمين_الصمود'],
  PSE: ['فارس_القدس', 'زيتون_غزة', 'صقر_جنين', 'درع_الأقصى'],
  YEM: ['نسر_صنعاء', 'أسد_مأرب', 'عروبة_سبأ', 'بركان_عدن'],
  TUR: ['صقر_الأناضول', 'بيرقدار_الساحة', 'درع_إسطنبول', 'عاصفة_البوسفور'],
  IRN: ['فارس_طهران', 'درع_أصفهان', 'صقر_زاغروس', 'سيف_شيراز'],
  MAR: ['أسد_الأطلس', 'فارس_مراكش', 'طاقة_الدار_البيضاء', 'نسر_فاس'],
  DZA: ['نمر_الأوراس', 'درع_الجزائر', 'صقر_الصحراء', 'بطل_تلمسان'],
  TUN: ['نسر_قرطاج', 'شعلة_تونس', 'فارس_سوسة', 'درع_الزيتونة'],
  SDN: ['فارس_الخرطوم', 'درع_سنار', 'صقر_النيلين', 'أسد_أم_درمان'],
  LBY: ['فارس_طرابلس', 'صقر_بنغازي', 'أسد_الصحراء', 'درع_طبرق'],
};

export class GameEngine {
  public canvas: HTMLCanvasElement | null = null;
  public ctx: CanvasRenderingContext2D | null = null;

  // Game state
  public pellets: EnergyPellet[] = [];
  public cells: PlayerCell[] = [];
  public vaults: NationalVault[] = [];
  public laserBeams: LaserBeam[] = [];
  public floatingTexts: FloatingText[] = [];
  public shockwaves: Shockwave[] = [];
  public particles: Particle[] = [];
  public events: GameEvent[] = [];

  // Player state
  public playerId: string = 'player_main';
  public playerName: string = 'البطل_السيادي';
  public playerCountryId: CountryId = 'KSA';
  public isPlayerAlive: boolean = false;
  public playerTotalMass: number = 0;
  public playerMaxMassReached: number = 0;
  public playerKills: number = 0;
  public playerDebrisCollected: number = 0;

  // Viewport camera
  public cameraX: number = 2500;
  public cameraY: number = 2500;
  public targetCameraX: number = 2500;
  public targetCameraY: number = 2500;
  public cameraZoom: number = 1.0;
  public targetCameraZoom: number = 1.0;

  // Input
  public mouseWorldX: number = 2500;
  public mouseWorldY: number = 2500;
  public mouseScreenX: number = 0;
  public mouseScreenY: number = 0;
  public isMouseDown: boolean = false;

  // Timers & Loop
  private animationFrameId: number | null = null;
  private lastTime: number = performance.now();
  private pelletIdCounter: number = 1;
  private isRunning: boolean = false;

  // Callbacks for React UI
  public onLeaderboardUpdate?: (leaderboard: LeaderboardEntry[], nations: NationalRanking[]) => void;
  public onPlayerStatsUpdate?: (stats: { mass: number; kills: number; rank: number; vaultEnergy: number; towerCharge: number }) => void;
  public onPlayerDeath?: (reason: string, earnedEnergy: number) => void;
  public onEventNotification?: (event: GameEvent) => void;

  constructor() {
    this.initWorld();
  }

  // Initialize the 20 National Vaults and ambient world
  public initWorld() {
    this.vaults = [];
    const count = COUNTRIES_LIST.length;
    const centerX = ARENA_CONFIG.WORLD_SIZE / 2;
    const centerY = ARENA_CONFIG.WORLD_SIZE / 2;

    COUNTRIES_LIST.forEach((country, index) => {
      const angle = (index / count) * 2 * Math.PI;
      const vaultX = centerX + Math.cos(angle) * ARENA_CONFIG.VAULT_RING_RADIUS;
      const vaultY = centerY + Math.sin(angle) * ARENA_CONFIG.VAULT_RING_RADIUS;

      // Defense Tower placed slightly inward from the vault
      const towerDist = ARENA_CONFIG.VAULT_RING_RADIUS - 220;
      const towerX = centerX + Math.cos(angle) * towerDist;
      const towerY = centerY + Math.sin(angle) * towerDist;

      this.vaults.push({
        id: `vault_${country.id}`,
        countryId: country.id,
        x: vaultX,
        y: vaultY,
        radius: 140,
        storedEnergy: 5000 + Math.floor(Math.random() * 8000),
        maxCapacity: ARENA_CONFIG.VAULT_BASE_CAPACITY,
        activeMembersCount: 2,
        totalFactionMass: 120,
        glowLevel: 2,
        angleIndex: index,
        tower: {
          countryId: country.id,
          x: towerX,
          y: towerY,
          charge: 25 + Math.floor(Math.random() * 50),
          maxCharge: ARENA_CONFIG.TOWER_MAX_CHARGE,
          range: ARENA_CONFIG.TOWER_RANGE * (country.id === 'SYR' ? 1.35 : 1.0),
          laserCooldown: 0,
          isTargeting: false,
          targetCellId: null,
          targetX: 0,
          targetY: 0,
          totalInterceptions: 0,
        },
      });
    });

    // Populate ambient energy pellets
    this.pellets = [];
    for (let i = 0; i < ARENA_CONFIG.INITIAL_PELLETS_COUNT; i++) {
      this.spawnPellet('ambient');
    }

    // Populate initial bots
    this.cells = [];
    this.spawnInitialBots();
  }

  public setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.resizeCanvas();
  }

  public resizeCanvas() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
  }

  // Start the game loop
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Spawn or Respawn Player
  public spawnPlayer(name: string, countryId: CountryId, injectedEnergy: number = 0) {
    this.playerName = name.trim() || 'البطل_السيادي';
    this.playerCountryId = countryId;
    this.playerId = 'player_' + Date.now().toString(36);

    // Remove existing player cells
    this.cells = this.cells.filter(c => !c.isPlayer);

    // Find the country's national vault
    const nationalVault = this.vaults.find(v => v.countryId === countryId);
    let startX = ARENA_CONFIG.WORLD_SIZE / 2 + (Math.random() - 0.5) * 800;
    let startY = ARENA_CONFIG.WORLD_SIZE / 2 + (Math.random() - 0.5) * 800;

    if (nationalVault) {
      // Spawn near friendly vault perimeter
      const spawnAngle = Math.random() * 2 * Math.PI;
      startX = nationalVault.x + Math.cos(spawnAngle) * 280;
      startY = nationalVault.y + Math.sin(spawnAngle) * 280;
    }

    const country = COUNTRIES_DATA[countryId];
    const initialMass = ARENA_CONFIG.BASE_BALL_MASS + injectedEnergy;
    const initialRadius = this.massToRadius(initialMass);

    const playerCell: PlayerCell = {
      id: `${this.playerId}_0`,
      playerId: this.playerId,
      name: this.playerName,
      countryId: countryId,
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      targetX: startX,
      targetY: startY,
      mass: initialMass,
      radius: initialRadius,
      color: country.primaryColor,
      secondaryColor: country.secondaryColor,
      isPlayer: true,
      isBot: false,
      canMergeAt: 0,
      splitCooldown: 0,
      boostActive: false,
      kills: 0,
      harvestedMass: 0,
    };

    this.cells.push(playerCell);
    this.isPlayerAlive = true;
    this.playerKills = 0;
    this.playerDebrisCollected = 0;
    this.playerMaxMassReached = initialMass;
    this.cameraX = startX;
    this.cameraY = startY;

    // Trigger visual shockwave at spawn
    this.createShockwave(startX, startY, country.glowColor, 80);
    soundManager.playBallSupercharge();

    this.addGameEvent('VAULT_SURGE', `انطلق البطل ${this.playerName} تحت راية ${country.nameAr}`, `Hero ${this.playerName} entered under ${country.nameEn}`, countryId);
  }

  // Inject energy from secure wallet into player's active ball
  public injectWalletEnergyIntoPlayer(amount: number): boolean {
    if (!this.isPlayerAlive) return false;
    const result = secureWallet.chargeBall(amount);
    if (!result.success) return false;

    const playerCells = this.cells.filter(c => c.isPlayer);
    if (playerCells.length === 0) return false;

    const massPerCell = amount / playerCells.length;
    playerCells.forEach(cell => {
      cell.mass += massPerCell;
      cell.radius = this.massToRadius(cell.mass);
      this.createFloatingText(`+${Math.round(massPerCell)} طاقة سيادية`, cell.x, cell.y - cell.radius, '#ffd700', 18);
    });

    soundManager.playBallSupercharge();
    this.createShockwave(playerCells[0].x, playerCells[0].y, '#ffd700', 120);
    return true;
  }

  // Deposit active player ball energy safely into the secure sovereign wallet
  public depositPlayerEnergyToWallet(): { success: boolean; depositedPoints: number } {
    if (!this.isPlayerAlive) return { success: false, depositedPoints: 0 };
    const playerCells = this.cells.filter(c => c.isPlayer);
    const totalMass = playerCells.reduce((sum, c) => sum + c.mass, 0);

    // Keep minimum viable mass to stay alive (e.g. 20 mass)
    const harvestableMass = totalMass - (ARENA_CONFIG.BASE_BALL_MASS * playerCells.length);
    if (harvestableMass <= 10) {
      return { success: false, depositedPoints: 0 };
    }

    const country = COUNTRIES_DATA[this.playerCountryId];
    const multiplier = (this.playerCountryId === 'KWT' ? 1.25 : (this.playerCountryId === 'UAE' ? 1.2 : 1.0));
    const result = secureWallet.withdrawMassToWallet(
      harvestableMass,
      multiplier,
      `تحويل طاقة من الميدان (${country.nameAr})`
    );

    if (result.success) {
      // Reduce cell mass back to base
      playerCells.forEach(cell => {
        cell.mass = ARENA_CONFIG.BASE_BALL_MASS;
        cell.radius = this.massToRadius(cell.mass);
        this.createFloatingText(`تم حفظ +${result.earnedPoints} بالمحفظة! 💎`, cell.x, cell.y - cell.radius - 20, '#00e5ff', 20);
      });

      // Also add to national vault
      const nationalVault = this.vaults.find(v => v.countryId === this.playerCountryId);
      if (nationalVault) {
        nationalVault.storedEnergy = Math.min(nationalVault.maxCapacity, nationalVault.storedEnergy + Math.round(harvestableMass * 0.5));
      }

      soundManager.playVaultDeposit();
      this.createShockwave(playerCells[0].x, playerCells[0].y, '#00e5ff', 160);
      this.addGameEvent('VAULT_SURGE', `قام ${this.playerName} بتخزين ${result.earnedPoints} نقطة سيادية بالمحفظة والمخزن الوطني!`, `${this.playerName} banked ${result.earnedPoints} sovereign energy!`, this.playerCountryId);
      return { success: true, depositedPoints: result.earnedPoints };
    }

    return { success: false, depositedPoints: 0 };
  }

  // Handle Player Split (Spacebar)
  public splitPlayer() {
    if (!this.isPlayerAlive) return;
    const playerCells = this.cells.filter(c => c.isPlayer);
    if (playerCells.length >= 16) return; // Cap maximum split parts

    const newCells: PlayerCell[] = [];
    const now = Date.now();

    playerCells.forEach(cell => {
      if (cell.mass >= ARENA_CONFIG.MIN_MASS_TO_SPLIT) {
        const halfMass = cell.mass / 2;
        cell.mass = halfMass;
        cell.radius = this.massToRadius(halfMass);
        cell.canMergeAt = now + 15000 + halfMass * 20; // Merge cooldown scales with mass

        // Calculate direction toward mouse pointer
        const dx = this.mouseWorldX - cell.x;
        const dy = this.mouseWorldY - cell.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;

        const splitImpulse = 18;
        const newCell: PlayerCell = {
          ...cell,
          id: `${this.playerId}_${Date.now()}_${Math.random()}`,
          x: cell.x + nx * (cell.radius + 10),
          y: cell.y + ny * (cell.radius + 10),
          vx: nx * splitImpulse,
          vy: ny * splitImpulse,
          mass: halfMass,
          radius: this.massToRadius(halfMass),
          canMergeAt: now + 15000 + halfMass * 20,
        };

        newCells.push(newCell);
      }
    });

    if (newCells.length > 0) {
      this.cells.push(...newCells);
      soundManager.playSplit();
    }
  }

  // Handle Mass Eject (W key)
  public ejectMass() {
    if (!this.isPlayerAlive) return;
    const playerCells = this.cells.filter(c => c.isPlayer);

    playerCells.forEach(cell => {
      if (cell.mass > ARENA_CONFIG.MIN_MASS_TO_EJECT) {
        cell.mass -= ARENA_CONFIG.EJECT_MASS_COST;
        cell.radius = this.massToRadius(cell.mass);

        const dx = this.mouseWorldX - cell.x;
        const dy = this.mouseWorldY - cell.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;

        const ejectSpeed = 16;
        const pellet: EnergyPellet = {
          id: this.pelletIdCounter++,
          x: cell.x + nx * (cell.radius + 14),
          y: cell.y + ny * (cell.radius + 14),
          radius: 9,
          mass: ARENA_CONFIG.EJECT_PELLET_VALUE,
          color: cell.color,
          type: 'ejected',
          pulsePhase: Math.random() * Math.PI * 2,
          vx: nx * ejectSpeed,
          vy: ny * ejectSpeed,
          sourceCountryId: cell.countryId,
          decayTime: Date.now() + 30000,
        };

        this.pellets.push(pellet);
      }
    });

    soundManager.playEject();
  }

  // Toggle Turbo Thruster (Shift key / Mobile Turbo Button)
  public setPlayerBoost(active: boolean) {
    const playerCells = this.cells.filter(c => c.isPlayer);
    playerCells.forEach(c => (c.boostActive = active));
  }

  // Main game loop
  private gameLoop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  // Update physics, AI, towers, collisions
  private update(dt: number) {
    this.updatePlayerMovement(dt);
    this.updateBots(dt);
    this.updatePhysics(dt);
    this.updateNationalVaultsAndTowers(dt);
    this.updateLaserBeams(dt);
    this.updatePellets(dt);
    this.handleCollisions();
    this.updateParticlesAndFX(dt);
    this.updateLeaderboardsAndStats();
  }

  // Update Player cells toward mouse
  private updatePlayerMovement(dt: number) {
    const playerCells = this.cells.filter(c => c.isPlayer);
    if (playerCells.length === 0) {
      if (this.isPlayerAlive) {
        this.handlePlayerDeath('تم ابتلاعك من قبل قوة معادية');
      }
      return;
    }

    const country = COUNTRIES_DATA[this.playerCountryId];
    const speedMult = country ? country.speedMultiplier : 1.0;

    // Calculate center of player cells for camera
    let avgX = 0;
    let avgY = 0;
    let totalMass = 0;

    playerCells.forEach(cell => {
      avgX += cell.x;
      avgY += cell.y;
      totalMass += cell.mass;

      // Calculate speed based on mass
      let baseSpeed = Math.max(2.2, 7.8 - Math.log(cell.mass) * 0.9) * speedMult;
      if (cell.boostActive && cell.mass > 25) {
        const costMultiplier = country.id === 'OMN' ? 0.6 : 1.0;
        cell.mass -= 0.15 * costMultiplier;
        cell.radius = this.massToRadius(cell.mass);
        baseSpeed *= 1.6;

        // Emit engine particle trail
        if (Math.random() < 0.4) {
          this.particles.push({
            x: cell.x + (Math.random() - 0.5) * cell.radius,
            y: cell.y + (Math.random() - 0.5) * cell.radius,
            vx: -cell.vx * 0.5 + (Math.random() - 0.5) * 2,
            vy: -cell.vy * 0.5 + (Math.random() - 0.5) * 2,
            radius: 3 + Math.random() * 4,
            color: country.glowColor,
            alpha: 0.8,
            life: 0.3,
            maxLife: 0.3,
          });
        }
      }

      const dx = this.mouseWorldX - cell.x;
      const dy = this.mouseWorldY - cell.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 10) {
        const factor = Math.min(1, dist / 150);
        cell.vx += (dx / dist) * baseSpeed * factor * 0.3;
        cell.vy += (dy / dist) * baseSpeed * factor * 0.3;
      }

      // Natural drag
      cell.vx *= 0.88;
      cell.vy *= 0.88;

      cell.x += cell.vx;
      cell.y += cell.vy;

      // Keep in world bounds
      cell.x = Math.max(cell.radius, Math.min(ARENA_CONFIG.WORLD_SIZE - cell.radius, cell.x));
      cell.y = Math.max(cell.radius, Math.min(ARENA_CONFIG.WORLD_SIZE - cell.radius, cell.y));
    });

    this.playerTotalMass = totalMass;
    if (totalMass > this.playerMaxMassReached) {
      this.playerMaxMassReached = totalMass;
    }

    avgX /= playerCells.length;
    avgY /= playerCells.length;

    // Smooth camera tracking
    this.targetCameraX = avgX;
    this.targetCameraY = avgY;
    this.cameraX += (this.targetCameraX - this.cameraX) * 0.1;
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;

    // Dynamic zoom based on total mass
    const targetZoom = Math.max(0.35, Math.min(1.1, 1.0 - Math.log10(Math.max(20, totalMass)) * 0.18));
    this.cameraZoom += (targetZoom - this.cameraZoom) * 0.05;
  }

  // Update Bots AI
  private updateBots(dt: number) {
    const bots = this.cells.filter(c => c.isBot);
    const now = Date.now();

    // Maintain bot count
    if (bots.length < ARENA_CONFIG.BOT_COUNT) {
      this.spawnBot();
    }

    bots.forEach(bot => {
      const country = COUNTRIES_DATA[bot.countryId];
      const baseSpeed = Math.max(1.8, 7.2 - Math.log(bot.mass) * 0.85) * (country?.speedMultiplier || 1.0);

      // AI Decision Logic:
      // 1. Check if threatened by larger enemy ball nearby
      let threat: PlayerCell | null = null;
      let targetFood: { x: number; y: number } | null = null;
      let targetPrey: PlayerCell | null = null;

      // Find nearest threat / prey
      for (const other of this.cells) {
        if (other.id === bot.id) continue;
        if (other.countryId === bot.countryId) continue; // Friendly ally

        const dx = other.x - bot.x;
        const dy = other.y - bot.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 600) {
          if (other.mass > bot.mass * 1.15) {
            if (!threat || dist < Math.hypot(threat.x - bot.x, threat.y - bot.y)) {
              threat = other;
            }
          } else if (bot.mass > other.mass * 1.15) {
            if (!targetPrey || dist < Math.hypot(targetPrey.x - bot.x, targetPrey.y - bot.y)) {
              targetPrey = other;
            }
          }
        }
      }

      // Move logic
      if (threat) {
        // Run away from threat toward own national vault for tower protection!
        const vault = this.vaults.find(v => v.countryId === bot.countryId);
        let escapeDx = bot.x - threat.x;
        let escapeDy = bot.y - threat.y;

        if (vault) {
          escapeDx += (vault.x - bot.x) * 0.5;
          escapeDy += (vault.y - bot.y) * 0.5;
        }

        const dist = Math.hypot(escapeDx, escapeDy) || 1;
        bot.vx += (escapeDx / dist) * baseSpeed * 0.4;
        bot.vy += (escapeDy / dist) * baseSpeed * 0.4;
      } else if (targetPrey) {
        // Chase prey
        const dx = targetPrey.x - bot.x;
        const dy = targetPrey.y - bot.y;
        const dist = Math.hypot(dx, dy) || 1;
        bot.vx += (dx / dist) * baseSpeed * 0.35;
        bot.vy += (dy / dist) * baseSpeed * 0.35;
      } else {
        // Wander or seek nearest cluster of energy pellets/debris
        if (!bot.targetX || Math.hypot(bot.targetX - bot.x, bot.targetY - bot.y) < 50 || Math.random() < 0.01) {
          bot.targetX = Math.max(300, Math.min(ARENA_CONFIG.WORLD_SIZE - 300, bot.x + (Math.random() - 0.5) * 1200));
          bot.targetY = Math.max(300, Math.min(ARENA_CONFIG.WORLD_SIZE - 300, bot.y + (Math.random() - 0.5) * 1200));
        }

        const dx = bot.targetX - bot.x;
        const dy = bot.targetY - bot.y;
        const dist = Math.hypot(dx, dy) || 1;
        bot.vx += (dx / dist) * baseSpeed * 0.25;
        bot.vy += (dy / dist) * baseSpeed * 0.25;
      }

      // Drag
      bot.vx *= 0.88;
      bot.vy *= 0.88;

      bot.x += bot.vx;
      bot.y += bot.vy;

      // Keep within bounds
      bot.x = Math.max(bot.radius, Math.min(ARENA_CONFIG.WORLD_SIZE - bot.radius, bot.x));
      bot.y = Math.max(bot.radius, Math.min(ARENA_CONFIG.WORLD_SIZE - bot.radius, bot.y));
    });
  }

  // Cell-to-Cell physics & Recombining
  private updatePhysics(dt: number) {
    const now = Date.now();

    // Friendly cell soft collision and merging
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = i + 1; j < this.cells.length; j++) {
        const a = this.cells[i];
        const b = this.cells[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;

        // Same player split cells trying to merge
        if (a.playerId === b.playerId && a.isPlayer && b.isPlayer) {
          if (now >= a.canMergeAt && now >= b.canMergeAt) {
            if (dist < a.radius + b.radius * 0.6) {
              // Merge B into A
              a.mass += b.mass;
              a.radius = this.massToRadius(a.mass);
              this.cells.splice(j, 1);
              j--;
              soundManager.playVaultDeposit();
              continue;
            }
          } else {
            // Push apart if not ready to merge
            if (dist < minDist && dist > 0) {
              const overlap = (minDist - dist) * 0.5;
              const nx = dx / dist;
              const ny = dy / dist;
              a.x -= nx * overlap;
              a.y -= ny * overlap;
              b.x += nx * overlap;
              b.y += ny * overlap;
            }
          }
        } else if (a.countryId === b.countryId) {
          // Same country allies soft-bounce (no friendly fire)
          if (dist < minDist && dist > 0) {
            const overlap = (minDist - dist) * 0.3;
            const nx = dx / dist;
            const ny = dy / dist;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;
          }
        }
      }
    }
  }

  // Update 20 National Vaults and their Defense Towers!
  private updateNationalVaultsAndTowers(dt: number) {
    const now = Date.now();

    this.vaults.forEach(vault => {
      const country = COUNTRIES_DATA[vault.countryId];
      const tower = vault.tower;

      // 1. Calculate active members of this country
      const countryCells = this.cells.filter(c => c.countryId === vault.countryId);
      vault.activeMembersCount = countryCells.length;
      vault.totalFactionMass = countryCells.reduce((sum, c) => sum + c.mass, 0);

      // Vault glow intensity scales with mass & active members
      vault.glowLevel = Math.min(5, 1 + Math.floor(vault.totalFactionMass / 400) + (vault.storedEnergy > 15000 ? 1 : 0));

      // 2. Tower Charge accumulation
      const chargeRateMult = country ? country.laserChargeRateMultiplier : 1.0;
      let chargeDelta = 0.12 * chargeRateMult;

      // Check if friendly players/bots are near their vault/tower to supercharge defense!
      const friendliesNearby = countryCells.filter(c => Math.hypot(c.x - tower.x, c.y - tower.y) < 450);
      if (friendliesNearby.length > 0) {
        chargeDelta += 0.35 * friendliesNearby.length;
      }

      tower.charge = Math.min(tower.maxCharge, tower.charge + chargeDelta);

      // Decrement laser cooldown
      if (tower.laserCooldown > 0) {
        tower.laserCooldown--;
      }

      // 3. Scan for LARGEST enemy cell in defense perimeter
      if (tower.charge >= tower.maxCharge && tower.laserCooldown <= 0) {
        let largestEnemy: PlayerCell | null = null;
        let maxEnemyMass = 0;

        for (const cell of this.cells) {
          if (cell.countryId === vault.countryId) continue; // Ignore allies

          const dist = Math.hypot(cell.x - tower.x, cell.y - tower.y);
          if (dist <= tower.range) {
            // Target the largest enemy
            if (cell.mass > maxEnemyMass && cell.mass >= 25) {
              maxEnemyMass = cell.mass;
              largestEnemy = cell;
            }
          }
        }

        if (largestEnemy) {
          // Lock target and fire devastating Laser Beam!
          this.fireDefenseLaser(vault, tower, largestEnemy);
        }
      }
    });
  }

  // Tower Laser Strike: shatters chunks of enemy ball into edible 1-pt energy capsules
  private fireDefenseLaser(vault: NationalVault, tower: typeof vault.tower, target: PlayerCell) {
    const country = COUNTRIES_DATA[vault.countryId];
    const targetCountry = COUNTRIES_DATA[target.countryId];

    // Calculate mass to shatter (e.g. 25% of target mass, minimum 12, max 100)
    let shatterMass = Math.max(12, Math.min(Math.round(target.mass * 0.28), 90));
    if (country.id === 'IRQ') {
      shatterMass = Math.round(shatterMass * 1.4); // Iraq perk: 40% extra shatter
    }

    // Apply mass loss to target (keep at least 15 mass so it doesn't instantly evaporate)
    const actualLoss = Math.min(target.mass - 15, shatterMass);
    if (actualLoss > 0) {
      target.mass -= actualLoss;
      target.radius = this.massToRadius(target.mass);
    }

    // Reset tower charge and trigger cooldown
    tower.charge = 0;
    tower.laserCooldown = 180; // ~3 seconds cooldown
    tower.totalInterceptions++;
    tower.lastTargetName = target.name;

    // Create Laser Beam visual
    const beamId = `laser_${Date.now()}_${Math.random()}`;
    this.laserBeams.push({
      id: beamId,
      fromX: tower.x,
      fromY: tower.y,
      toX: target.x,
      toY: target.y,
      color: country.glowColor,
      coreColor: '#ffffff',
      countryId: vault.countryId,
      progress: 0,
      duration: 25,
      damageMass: actualLoss,
      targetName: target.name,
    });

    // Spawn shattered debris capsules (1-point energy food) scattered on ground
    const debrisCount = Math.min(actualLoss, 40);
    const valuePerCapsule = Math.max(1, Math.round(actualLoss / debrisCount));

    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      const spreadDist = target.radius + Math.random() * 60;

      const pellet: EnergyPellet = {
        id: this.pelletIdCounter++,
        x: target.x + Math.cos(angle) * spreadDist,
        y: target.y + Math.sin(angle) * spreadDist,
        radius: 6 + valuePerCapsule,
        mass: valuePerCapsule,
        color: targetCountry ? targetCountry.glowColor : '#00e5ff',
        type: 'debris',
        pulsePhase: Math.random() * Math.PI * 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        sourceCountryId: target.countryId,
        decayTime: Date.now() + 45000,
      };

      this.pellets.push(pellet);
    }

    // Shockwave & Floating Text
    this.createShockwave(target.x, target.y, country.glowColor, target.radius * 2);
    this.createFloatingText(`💥 تفتت -${actualLoss} كتلة!`, target.x, target.y - target.radius - 15, '#ff4757', 22);

    // Audio & Combat feedback
    soundManager.playLaserFire();
    soundManager.playShatter();

    // Reward player if player's tower fired or if player shattered enemy
    if (vault.countryId === this.playerCountryId) {
      secureWallet.addDefenseDividend(15, country.nameAr);
      this.createFloatingText(`+15 مكافأة دفاع وطني! 🛡️`, tower.x, tower.y - 30, '#ffd700', 18);
    }

    if (target.isPlayer) {
      soundManager.playAlarm();
      this.createFloatingText(`⚠️ تحذير: ضربة ليزر من برج ${country.nameAr}!`, target.x, target.y + target.radius + 20, '#ff3838', 20);
    }

    // Game Event feed
    this.addGameEvent(
      'LASER_STRIKE',
      `أطلق برج ${country.nameAr} شعاعاً حارقاً فتت ${actualLoss} نقطة من ${target.name} (${targetCountry.nameAr})!`,
      `${country.nameEn} Laser Tower shattered ${actualLoss} mass from ${target.name} (${targetCountry.nameEn})!`,
      vault.countryId
    );
  }

  // Update Laser Beams animation
  private updateLaserBeams(dt: number) {
    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      const beam = this.laserBeams[i];
      beam.progress += 1 / beam.duration;
      if (beam.progress >= 1) {
        this.laserBeams.splice(i, 1);
      }
    }
  }

  // Update pellets, food spawning, debris motion
  private updatePellets(dt: number) {
    const now = Date.now();

    // Update debris motion & decay
    for (let i = this.pellets.length - 1; i >= 0; i--) {
      const p = this.pellets[i];
      if (p.vx !== undefined && p.vy !== undefined) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;
      }
      p.pulsePhase = (p.pulsePhase + 0.05) % (Math.PI * 2);

      if (p.decayTime && now > p.decayTime) {
        this.pellets.splice(i, 1);
      }
    }

    // Respawn ambient pellets if under target
    while (this.pellets.length < ARENA_CONFIG.MAX_PELLETS_COUNT) {
      this.spawnPellet('ambient');
    }
  }

  // Handle eating food pellets and enemy cells
  private handleCollisions() {
    const playerCountry = COUNTRIES_DATA[this.playerCountryId];

    this.cells.forEach(cell => {
      const country = COUNTRIES_DATA[cell.countryId];
      const attractMult = country ? country.capsuleAttractionMultiplier : 1.0;
      const magnetRange = cell.radius + 35 * attractMult;

      // 1. Eat energy pellets / debris
      for (let i = this.pellets.length - 1; i >= 0; i--) {
        const pellet = this.pellets[i];
        const dx = cell.x - pellet.x;
        const dy = cell.y - pellet.y;
        const dist = Math.hypot(dx, dy);

        // Magnetic pull
        if (dist < magnetRange && dist > cell.radius * 0.4) {
          pellet.x += (dx / dist) * 4.5 * attractMult;
          pellet.y += (dy / dist) * 4.5 * attractMult;
        }

        // Eat pellet
        if (dist < cell.radius) {
          cell.mass += pellet.mass;
          cell.radius = this.massToRadius(cell.mass);
          cell.harvestedMass += pellet.mass;

          if (cell.isPlayer) {
            if (pellet.type === 'debris' || pellet.type === 'capsule') {
              soundManager.playDebrisEat();
              this.playerDebrisCollected++;
              secureWallet.addShatterBounty(pellet.mass, 'عدو مفكك');
            } else {
              soundManager.playPelletEat(Math.floor(cell.mass / 200));
            }
          }

          this.pellets.splice(i, 1);
        }
      }
    });

    // 2. Cell Eating Cell (Agar.io Rules)
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = 0; j < this.cells.length; j++) {
        if (i === j) continue;
        const hunter = this.cells[i];
        const prey = this.cells[j];
        if (!hunter || !prey) continue;

        // Friendly same-country ally immunity
        if (hunter.countryId === prey.countryId) continue;

        const dx = hunter.x - prey.x;
        const dy = hunter.y - prey.y;
        const dist = Math.hypot(dx, dy);

        // Hunter must be at least 12% larger and overlapping center
        if (hunter.mass > prey.mass * 1.12 && dist < hunter.radius - prey.radius * 0.35) {
          // Eat prey
          hunter.mass += prey.mass;
          hunter.radius = this.massToRadius(hunter.mass);
          hunter.kills++;

          const hunterCountry = COUNTRIES_DATA[hunter.countryId];
          const preyCountry = COUNTRIES_DATA[prey.countryId];

          this.createShockwave(prey.x, prey.y, hunterCountry.glowColor, hunter.radius);
          this.createFloatingText(`+${Math.round(prey.mass)} ابتلاع! ⚔️`, hunter.x, hunter.y - hunter.radius, '#10ff70', 22);

          if (hunter.isPlayer) {
            soundManager.playShatter();
            this.playerKills++;
            secureWallet.addShatterBounty(Math.round(prey.mass * 0.5), preyCountry.nameAr);
            this.addGameEvent('EATEN', `ابتلع ${hunter.name} (${hunterCountry.nameAr}) كرة ${prey.name} (${preyCountry.nameAr})!`, `${hunter.name} engulfed ${prey.name}!`, hunter.countryId);
          }

          if (prey.isPlayer) {
            this.handlePlayerDeath(`تم ابتلاعك بواسطة ${hunter.name} من ${hunterCountry.nameAr}`);
          }

          this.cells.splice(j, 1);
          if (j < i) i--;
          j--;
        }
      }
    }
  }

  // Update visual effects (Shockwaves, Floating text, Particles)
  private updateParticlesAndFX(dt: number) {
    // Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.15;
      sw.alpha -= sw.decay;
      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius * 0.95) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // Leaderboard and HUD updates
  private updateLeaderboardsAndStats() {
    // Individual players & bots ranking
    const playerMassMap = new Map<string, { name: string; countryId: CountryId; mass: number; isPlayer: boolean }>();

    this.cells.forEach(cell => {
      const existing = playerMassMap.get(cell.playerId);
      if (existing) {
        existing.mass += cell.mass;
      } else {
        playerMassMap.set(cell.playerId, {
          name: cell.name,
          countryId: cell.countryId,
          mass: cell.mass,
          isPlayer: cell.isPlayer,
        });
      }
    });

    const sortedPlayers = Array.from(playerMassMap.values()).sort((a, b) => b.mass - a.mass);
    const leaderboard: LeaderboardEntry[] = sortedPlayers.slice(0, 10).map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      countryId: p.countryId,
      mass: Math.round(p.mass),
      isPlayer: p.isPlayer,
    }));

    // National Sovereign Rankings
    const nationalRankings: NationalRanking[] = COUNTRIES_LIST.map(country => {
      const vault = this.vaults.find(v => v.countryId === country.id);
      const activeOrbs = this.cells.filter(c => c.countryId === country.id);
      const orbMass = activeOrbs.reduce((sum, c) => sum + c.mass, 0);
      const totalEnergy = (vault?.storedEnergy || 0) + orbMass;

      return {
        rank: 0,
        countryId: country.id,
        totalEnergy: Math.round(totalEnergy),
        activePlayers: activeOrbs.length,
        towersActive: vault?.tower.charge ? Math.round(vault.tower.charge) : 0,
      };
    })
      .sort((a, b) => b.totalEnergy - a.totalEnergy)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    if (this.onLeaderboardUpdate) {
      this.onLeaderboardUpdate(leaderboard, nationalRankings);
    }

    if (this.onPlayerStatsUpdate && this.isPlayerAlive) {
      const playerRank = sortedPlayers.findIndex(p => p.isPlayer) + 1;
      const playerVault = this.vaults.find(v => v.countryId === this.playerCountryId);
      this.onPlayerStatsUpdate({
        mass: Math.round(this.playerTotalMass),
        kills: this.playerKills,
        rank: playerRank || 1,
        vaultEnergy: playerVault ? Math.round(playerVault.storedEnergy) : 0,
        towerCharge: playerVault ? Math.round(playerVault.tower.charge) : 0,
      });
    }
  }

  // Handle Player Death
  private handlePlayerDeath(reason: string) {
    this.isPlayerAlive = false;
    const earnedPoints = Math.round(this.playerMaxMassReached * 0.4);

    if (earnedPoints > 0) {
      secureWallet.withdrawMassToWallet(earnedPoints, 1.0, 'مكافأة الصمود الوطني بعد نهاية الجولة');
    }

    if (this.onPlayerDeath) {
      this.onPlayerDeath(reason, earnedPoints);
    }
  }

  // Spawn Bot
  private spawnBot() {
    const randomCountry = COUNTRIES_LIST[Math.floor(Math.random() * COUNTRIES_LIST.length)];
    const names = BOT_NAMES[randomCountry.id];
    const botName = names[Math.floor(Math.random() * names.length)] + '_' + Math.floor(Math.random() * 90 + 10);
    const botId = 'bot_' + Date.now().toString(36) + '_' + Math.random();

    const vault = this.vaults.find(v => v.countryId === randomCountry.id);
    let x = Math.random() * (ARENA_CONFIG.WORLD_SIZE - 400) + 200;
    let y = Math.random() * (ARENA_CONFIG.WORLD_SIZE - 400) + 200;

    if (vault && Math.random() < 0.5) {
      const angle = Math.random() * 2 * Math.PI;
      x = vault.x + Math.cos(angle) * (200 + Math.random() * 300);
      y = vault.y + Math.sin(angle) * (200 + Math.random() * 300);
    }

    const mass = 20 + Math.floor(Math.random() * 120);
    const botCell: PlayerCell = {
      id: botId,
      playerId: botId,
      name: botName,
      countryId: randomCountry.id,
      x,
      y,
      vx: 0,
      vy: 0,
      targetX: x,
      targetY: y,
      mass,
      radius: this.massToRadius(mass),
      color: randomCountry.primaryColor,
      secondaryColor: randomCountry.secondaryColor,
      isPlayer: false,
      isBot: true,
      canMergeAt: 0,
      splitCooldown: 0,
      boostActive: false,
      kills: 0,
      harvestedMass: 0,
    };

    this.cells.push(botCell);
  }

  // Spawn initial bots
  private spawnInitialBots() {
    for (let i = 0; i < ARENA_CONFIG.BOT_COUNT; i++) {
      this.spawnBot();
    }
  }

  // Spawn single pellet
  private spawnPellet(type: PelletType = 'ambient') {
    const x = Math.random() * (ARENA_CONFIG.WORLD_SIZE - 100) + 50;
    const y = Math.random() * (ARENA_CONFIG.WORLD_SIZE - 100) + 50;

    const neonColors = ['#00e5ff', '#00ff88', '#f6c834', '#ff4757', '#a55eea', '#ff6b81', '#10ff70', '#ff9f43'];
    const color = neonColors[Math.floor(Math.random() * neonColors.length)];

    this.pellets.push({
      id: this.pelletIdCounter++,
      x,
      y,
      radius: 4 + Math.random() * 2.5,
      mass: 1,
      color,
      type,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  }

  // Utility: Convert mass to visual circle radius
  public massToRadius(mass: number): number {
    return Math.max(16, Math.sqrt(mass) * 5.2);
  }

  // Utility: Create visual Shockwave
  public createShockwave(x: number, y: number, color: string, maxRadius: number) {
    this.shockwaves.push({
      id: `sw_${Date.now()}_${Math.random()}`,
      x,
      y,
      radius: 10,
      maxRadius,
      color,
      alpha: 0.9,
      decay: 0.04,
    });
  }

  // Utility: Create floating combat text
  public createFloatingText(text: string, x: number, y: number, color: string, size: number = 18) {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      color,
      size,
      life: 1.4,
      maxLife: 1.4,
      vy: -1.2,
    });
  }

  // Add game event to ticker
  public addGameEvent(type: GameEvent['type'], textAr: string, textEn: string, countryId?: CountryId) {
    const ev: GameEvent = {
      id: `ev_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      type,
      textAr,
      textEn,
      countryId,
    };
    this.events = [ev, ...this.events].slice(0, 15);
    if (this.onEventNotification) {
      this.onEventNotification(ev);
    }
  }

  // ==========================================
  // RENDERING ENGINE (Canvas 2D with High-Tech Glow)
  // ==========================================
  public render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const canvas = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Clear Screen with deep cosmic midnight slate
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#030712'; // Deepest midnight
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();

    // Camera Transform (Center of Screen)
    const screenCenterX = canvas.width / 2;
    const screenCenterY = canvas.height / 2;

    ctx.translate(screenCenterX, screenCenterY);
    ctx.scale(this.cameraZoom * dpr, this.cameraZoom * dpr);
    ctx.translate(-this.cameraX, -this.cameraY);

    // Visible viewport bounding box in world coordinates (for culling)
    const viewHalfW = screenCenterX / (this.cameraZoom * dpr) + 200;
    const viewHalfH = screenCenterY / (this.cameraZoom * dpr) + 200;
    const minViewX = this.cameraX - viewHalfW;
    const maxViewX = this.cameraX + viewHalfW;
    const minViewY = this.cameraY - viewHalfH;
    const maxViewY = this.cameraY + viewHalfH;

    // 1. Draw World Grid & Boundaries
    this.renderWorldGrid(ctx, minViewX, maxViewX, minViewY, maxViewY);

    // 2. Draw 20 National Vaults & Defense Perimeters
    this.renderNationalVaults(ctx);

    // 3. Draw Energy Pellets & Debris Capsules
    this.renderPellets(ctx, minViewX, maxViewX, minViewY, maxViewY);

    // 4. Draw Laser Beams & Lightning Sparks
    this.renderLaserBeams(ctx);

    // 5. Draw Shockwaves
    this.renderShockwaves(ctx);

    // 6. Draw Player & Bot Cells with Glowing Auras
    this.renderCells(ctx, minViewX, maxViewX, minViewY, maxViewY);

    // 7. Draw Particles
    this.renderParticles(ctx);

    // 8. Draw Floating Combat Text
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  // Render Arena Grid and Boundary Walls
  private renderWorldGrid(ctx: CanvasRenderingContext2D, minX: number, maxX: number, minY: number, maxY: number) {
    const gridSize = 100;
    const startX = Math.max(0, Math.floor(minX / gridSize) * gridSize);
    const endX = Math.min(ARENA_CONFIG.WORLD_SIZE, Math.ceil(maxX / gridSize) * gridSize);
    const startY = Math.max(0, Math.floor(minY / gridSize) * gridSize);
    const endY = Math.min(ARENA_CONFIG.WORLD_SIZE, Math.ceil(maxY / gridSize) * gridSize);

    // Grid lines
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Center Galactic Energy Core
    const centerX = ARENA_CONFIG.WORLD_SIZE / 2;
    const centerY = ARENA_CONFIG.WORLD_SIZE / 2;
    const centerGrad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 600);
    centerGrad.addColorStop(0, 'rgba(0, 229, 255, 0.08)');
    centerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 600, 0, Math.PI * 2);
    ctx.fill();

    // Arena Outer Boundary Neon Shield
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 25;
    ctx.strokeRect(0, 0, ARENA_CONFIG.WORLD_SIZE, ARENA_CONFIG.WORLD_SIZE);
    ctx.shadowBlur = 0;
  }

  // Render the 20 Middle Eastern National Vaults & Towers
  private renderNationalVaults(ctx: CanvasRenderingContext2D) {
    const time = performance.now() * 0.002;

    this.vaults.forEach(vault => {
      const country = COUNTRIES_DATA[vault.countryId];
      if (!country) return;

      const { x, y, radius, glowLevel, storedEnergy, tower } = vault;

      // 1. Vault Glowing Territory Field
      const glowRadius = radius + 60 + glowLevel * 15;
      const grad = ctx.createRadialGradient(x, y, radius * 0.3, x, y, glowRadius);
      grad.addColorStop(0, `${country.primaryColor}55`);
      grad.addColorStop(0.5, `${country.glowColor}22`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Outer Rotating Cyber Ring
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * 0.5 * (vault.angleIndex % 2 === 0 ? 1 : -1));

      ctx.strokeStyle = country.glowColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 8, 4, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 3. Vault Core Hexagon / Circle Base
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = country.primaryColor;
      ctx.lineWidth = 5;
      ctx.shadowColor = country.glowColor;
      ctx.shadowBlur = 20 * glowLevel;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. National Emblem & Details Inside Vault
      ctx.font = 'bold 36px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(country.flag, x, y - 24);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px "Cairo", sans-serif';
      ctx.fillText(country.nameAr, x, y + 18);

      // Energy Bar inside Vault
      const barW = 100;
      const barH = 8;
      const fillW = Math.min(barW, (storedEnergy / 20000) * barW);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(x - barW / 2, y + 36, barW, barH);
      ctx.fillStyle = country.glowColor;
      ctx.fillRect(x - barW / 2, y + 36, fillW, barH);

      ctx.font = 'bold 12px "Outfit", monospace';
      ctx.fillStyle = country.secondaryColor;
      ctx.fillText(`${storedEnergy.toLocaleString()} EN`, x, y + 58);

      // ===================================
      // 5. DEFENSE TOWER & LASER CANNON
      // ===================================
      const tx = tower.x;
      const ty = tower.y;

      // Tower Scanning Radar Field
      ctx.strokeStyle = `${country.glowColor}25`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tx, ty, tower.range, 0, Math.PI * 2);
      ctx.stroke();

      // Tower Base & Charging Core
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = country.secondaryColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(tx, ty, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tower Charge Indicator Gauge Ring
      const chargeRatio = tower.charge / tower.maxCharge;
      ctx.strokeStyle = chargeRatio >= 1.0 ? '#ff3838' : country.glowColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(tx, ty, 36, -Math.PI / 2, -Math.PI / 2 + chargeRatio * Math.PI * 2);
      ctx.stroke();

      // Tower Cannon Icon
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('⚡', tx, ty);

      // Tower Label
      ctx.font = 'bold 11px "Cairo", sans-serif';
      ctx.fillStyle = chargeRatio >= 1.0 ? '#ff4757' : '#94a3b8';
      ctx.fillText(`برج ${country.code} (${Math.round(tower.charge)}%)`, tx, ty + 46);
    });
  }

  // Render Energy Pellets & Floating Debris Food
  private renderPellets(ctx: CanvasRenderingContext2D, minX: number, maxX: number, minY: number, maxY: number) {
    this.pellets.forEach(p => {
      if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) return;

      const pulse = Math.sin(p.pulsePhase) * 1.5;
      const r = Math.max(2, p.radius + pulse);

      ctx.save();
      if (p.type === 'debris' || p.type === 'capsule') {
        // High-value glowing crystal capsule
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = p.color;

        ctx.translate(p.x, p.y);
        ctx.rotate(p.pulsePhase);
        ctx.beginPath();
        // Diamond / Star shape
        ctx.moveTo(0, -r * 1.4);
        ctx.lineTo(r, 0);
        ctx.lineTo(0, r * 1.4);
        ctx.lineTo(-r, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Standard ambient pellet
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  // Render Laser Beams & Lightning
  private renderLaserBeams(ctx: CanvasRenderingContext2D) {
    this.laserBeams.forEach(beam => {
      const alpha = Math.max(0, 1 - beam.progress);

      ctx.save();
      // Outer Laser Glow
      ctx.strokeStyle = beam.color;
      ctx.lineWidth = 14 * alpha;
      ctx.shadowColor = beam.color;
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.moveTo(beam.fromX, beam.fromY);
      ctx.lineTo(beam.toX, beam.toY);
      ctx.stroke();

      // Laser Core Beam (Bright White)
      ctx.strokeStyle = beam.coreColor;
      ctx.lineWidth = 6 * alpha;
      ctx.beginPath();
      ctx.moveTo(beam.fromX, beam.fromY);
      ctx.lineTo(beam.toX, beam.toY);
      ctx.stroke();

      ctx.restore();
    });
  }

  // Render Shockwaves
  private renderShockwaves(ctx: CanvasRenderingContext2D) {
    this.shockwaves.forEach(sw => {
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 4 * sw.alpha;
      ctx.globalAlpha = sw.alpha;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  // Render Player and Bot Cells with dynamic glowing halos
  private renderCells(ctx: CanvasRenderingContext2D, minX: number, maxX: number, minY: number, maxY: number) {
    // Sort so larger cells render under smaller ones or smoothly
    const sorted = [...this.cells].sort((a, b) => a.mass - b.mass);

    sorted.forEach(cell => {
      if (cell.x + cell.radius < minX || cell.x - cell.radius > maxX || cell.y + cell.radius < minY || cell.y - cell.radius > maxY) {
        return;
      }

      const country = COUNTRIES_DATA[cell.countryId] || COUNTRIES_DATA.KSA;
      const { x, y, radius, mass, name, color, secondaryColor } = cell;

      ctx.save();

      // 1. Dynamic Glowing Aura (Scales with ball mass and nation presence)
      const glowDistance = radius * 0.45;
      const auraGrad = ctx.createRadialGradient(x, y, radius * 0.7, x, y, radius + glowDistance);
      auraGrad.addColorStop(0, `${country.glowColor}99`);
      auraGrad.addColorStop(0.6, `${country.primaryColor}33`);
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(x, y, radius + glowDistance, 0, Math.PI * 2);
      ctx.fill();

      // 2. Cell Main Body (High-tech Radial Gradient)
      const bodyGrad = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.25, radius * 0.1, x, y, radius);
      bodyGrad.addColorStop(0, country.secondaryColor);
      bodyGrad.addColorStop(0.4, color);
      bodyGrad.addColorStop(1, '#060c18');

      ctx.fillStyle = bodyGrad;
      ctx.shadowColor = country.glowColor;
      ctx.shadowBlur = Math.min(30, 8 + Math.sqrt(mass) * 1.5);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. Cybernetic Neon Border Ring
      ctx.strokeStyle = cell.isPlayer ? '#ffffff' : country.glowColor;
      ctx.lineWidth = cell.isPlayer ? 4 : 2.5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 4. National Emblem / Flag in Center
      const emojiSize = Math.max(14, Math.min(38, radius * 0.55));
      ctx.font = `bold ${emojiSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(country.flag, x, y - radius * 0.15);

      // 5. Name Label with crisp contrast
      const nameSize = Math.max(11, Math.min(18, radius * 0.3));
      ctx.font = `bold ${nameSize}px "Cairo", "Outfit", sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(name, x, y + radius * 0.25);

      // 6. Mass Points
      const massSize = Math.max(9, Math.min(14, radius * 0.22));
      ctx.font = `bold ${massSize}px "Outfit", monospace`;
      ctx.fillStyle = country.secondaryColor;
      ctx.fillText(`${Math.round(mass)}`, x, y + radius * 0.52);

      // 7. Warning Crosshair if targeted by enemy tower
      if (cell.laserWarning) {
        ctx.strokeStyle = '#ff3838';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, radius + 16, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  // Render Engine Particles
  private renderParticles(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // Render Floating Combat Text
  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    this.floatingTexts.forEach(ft => {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.save();
      ctx.font = `bold ${ft.size}px "Cairo", "Outfit", sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
}

export const gameEngine = new GameEngine();
