import { UserWallet, WalletTransaction, TransactionType } from '../types';
import { ARENA_CONFIG } from '../data/countries';

const STORAGE_KEY = 'agarmideast_secure_vault_v1';
const SECRET_SEED = 'AGAR_SOVEREIGN_MIDEAST_SECURITY_SALT_9948271';

// Robust string hashing for cryptographic integrity verification
function computeHash(dataString: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < dataString.length; i++) {
    hash ^= dataString.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
    hash = hash >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function generateSignature(tx: Omit<WalletTransaction, 'signature'>): string {
  const payload = `${tx.id}:${tx.timestamp}:${tx.type}:${tx.amount}:${tx.balanceAfter}:${SECRET_SEED}`;
  return 'SIG_0x' + computeHash(payload);
}

function verifyTransaction(tx: WalletTransaction): boolean {
  const expected = generateSignature(tx);
  return tx.signature === expected;
}

function calculateWalletIntegrity(wallet: Omit<UserWallet, 'integrityHash'>): string {
  const payload = `${wallet.publicKey}:${wallet.energyBalance}:${wallet.stakedInVault}:${wallet.totalHarvested}:${wallet.transactions.length}:${SECRET_SEED}`;
  return 'PROOF_0x' + computeHash(payload);
}

function generatePublicKey(): string {
  const rand1 = Math.random().toString(36).substring(2, 10).toUpperCase();
  const rand2 = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `SA-VAULT-${rand1}-${rand2}`;
}

export class SecurityWalletService {
  private wallet: UserWallet;

  constructor() {
    this.wallet = this.loadAndVerifyWallet();
  }

  private createInitialWallet(): UserWallet {
    const pubKey = generatePublicKey();
    const initTx: WalletTransaction = {
      id: 'TX-INIT-' + Date.now().toString(36),
      timestamp: Date.now(),
      type: 'INITIAL_GRANT',
      amount: ARENA_CONFIG.INITIAL_WALLET_BALANCE,
      balanceAfter: ARENA_CONFIG.INITIAL_WALLET_BALANCE,
      descriptionAr: 'منحة الطاقة السيادية التأسيسية لحماية الوطن',
      descriptionEn: 'Foundational Sovereign Energy Grant for Homeland Defense',
      signature: '',
    };
    initTx.signature = generateSignature(initTx);

    const baseWallet: Omit<UserWallet, 'integrityHash'> = {
      publicKey: pubKey,
      energyBalance: ARENA_CONFIG.INITIAL_WALLET_BALANCE,
      stakedInVault: 0,
      totalHarvested: 0,
      totalShatteredBounties: 0,
      transactions: [initTx],
    };

    const integrityHash = calculateWalletIntegrity(baseWallet);
    const completeWallet: UserWallet = {
      ...baseWallet,
      integrityHash,
    };

    this.saveWallet(completeWallet);
    return completeWallet;
  }

  private loadAndVerifyWallet(): UserWallet {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return this.createInitialWallet();
      }

      const parsed: UserWallet = JSON.parse(raw);
      if (!parsed || typeof parsed.energyBalance !== 'number') {
        return this.createInitialWallet();
      }

      // Verify wallet integrity proof
      const { integrityHash, ...walletData } = parsed;
      const expectedHash = calculateWalletIntegrity(walletData);

      if (integrityHash !== expectedHash) {
        console.warn('⚠️ Security Alert: Wallet integrity mismatch detected. Resetting to secure baseline.');
        return this.createInitialWallet();
      }

      // Verify all transaction signatures
      const allValid = parsed.transactions.every(tx => verifyTransaction(tx));
      if (!allValid) {
        console.warn('⚠️ Security Alert: Corrupted transaction signatures detected.');
        return this.createInitialWallet();
      }

      return parsed;
    } catch {
      return this.createInitialWallet();
    }
  }

  private saveWallet(wallet: UserWallet) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
      this.wallet = wallet;
    } catch (e) {
      console.error('Failed to persist wallet', e);
    }
  }

  public getWallet(): UserWallet {
    return { ...this.wallet };
  }

  public getBalance(): number {
    return this.wallet.energyBalance;
  }

  public getPublicKey(): string {
    return this.wallet.publicKey;
  }

  // Charge player's ball from sovereign wallet balance
  public chargeBall(amount: number): { success: boolean; chargedAmount: number; error?: string } {
    if (amount <= 0) return { success: false, chargedAmount: 0, error: 'المبلغ غير صالح' };
    if (this.wallet.energyBalance < amount) {
      return { success: false, chargedAmount: 0, error: 'رصيد الطاقة في المحفظة غير كافٍ' };
    }

    const newBalance = this.wallet.energyBalance - amount;
    const tx: WalletTransaction = {
      id: 'TX-CHG-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      type: 'CHARGE_BALL',
      amount: -amount,
      balanceAfter: newBalance,
      descriptionAr: `شحن كرة الطاقة بالميدان بـ ${amount} وحدة طاقة سيادية`,
      descriptionEn: `Injected ${amount} sovereign energy into active combat orb`,
      signature: '',
    };
    tx.signature = generateSignature(tx);

    const updatedTransactions = [tx, ...this.wallet.transactions].slice(0, 40);
    const updatedBase: Omit<UserWallet, 'integrityHash'> = {
      ...this.wallet,
      energyBalance: newBalance,
      transactions: updatedTransactions,
    };

    const integrityHash = calculateWalletIntegrity(updatedBase);
    this.saveWallet({ ...updatedBase, integrityHash });

    return { success: true, chargedAmount: amount };
  }

  // Deposit/withdraw active ball mass into sovereign wallet points
  public withdrawMassToWallet(
    massToConvert: number,
    multiplier: number = 1.0,
    sourceDescAr: string = 'تفريغ وتخزين طاقة الكرة في المحفظة السيادية'
  ): { success: boolean; earnedPoints: number; newBalance: number } {
    if (massToConvert <= 0) return { success: false, earnedPoints: 0, newBalance: this.wallet.energyBalance };

    const earnedPoints = Math.round(massToConvert * multiplier);
    const newBalance = this.wallet.energyBalance + earnedPoints;
    const newHarvested = this.wallet.totalHarvested + earnedPoints;

    const tx: WalletTransaction = {
      id: 'TX-WDR-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      type: 'WITHDRAW_TO_WALLET',
      amount: earnedPoints,
      balanceAfter: newBalance,
      descriptionAr: `${sourceDescAr} (+${earnedPoints} نقطة)`,
      descriptionEn: `Crystallized ${massToConvert} mass into ${earnedPoints} sovereign points`,
      signature: '',
    };
    tx.signature = generateSignature(tx);

    const updatedTransactions = [tx, ...this.wallet.transactions].slice(0, 40);
    const updatedBase: Omit<UserWallet, 'integrityHash'> = {
      ...this.wallet,
      energyBalance: newBalance,
      totalHarvested: newHarvested,
      transactions: updatedTransactions,
    };

    const integrityHash = calculateWalletIntegrity(updatedBase);
    this.saveWallet({ ...updatedBase, integrityHash });

    return { success: true, earnedPoints, newBalance };
  }

  // Tower defense reward dividend
  public addDefenseDividend(amount: number, countryNameAr: string) {
    if (amount <= 0) return;
    const newBalance = this.wallet.energyBalance + amount;
    const tx: WalletTransaction = {
      id: 'TX-DEF-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      type: 'TOWER_DEFENSE_REWARD',
      amount: amount,
      balanceAfter: newBalance,
      descriptionAr: `مكافأة الدفاع الوطني من برج ${countryNameAr}`,
      descriptionEn: `Homeland defense reward from ${countryNameAr} laser tower`,
      signature: '',
    };
    tx.signature = generateSignature(tx);

    const updatedBase: Omit<UserWallet, 'integrityHash'> = {
      ...this.wallet,
      energyBalance: newBalance,
      transactions: [tx, ...this.wallet.transactions].slice(0, 40),
    };
    const integrityHash = calculateWalletIntegrity(updatedBase);
    this.saveWallet({ ...updatedBase, integrityHash });
  }

  // Shatter bounty reward
  public addShatterBounty(amount: number, enemyCountryNameAr: string) {
    if (amount <= 0) return;
    const newBalance = this.wallet.energyBalance + amount;
    const tx: WalletTransaction = {
      id: 'TX-SHT-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      type: 'SHATTER_BOUNTY',
      amount: amount,
      balanceAfter: newBalance,
      descriptionAr: `مكافأة تفتيت كرة معادية تابعة لـ ${enemyCountryNameAr}`,
      descriptionEn: `Shatter bounty for fragmenting hostile orb from ${enemyCountryNameAr}`,
      signature: '',
    };
    tx.signature = generateSignature(tx);

    const updatedBase: Omit<UserWallet, 'integrityHash'> = {
      ...this.wallet,
      energyBalance: newBalance,
      totalShatteredBounties: this.wallet.totalShatteredBounties + amount,
      transactions: [tx, ...this.wallet.transactions].slice(0, 40),
    };
    const integrityHash = calculateWalletIntegrity(updatedBase);
    this.saveWallet({ ...updatedBase, integrityHash });
  }

  // Staking in National Vault
  public stakeInVault(amount: number): boolean {
    if (amount <= 0 || this.wallet.energyBalance < amount) return false;

    const newBalance = this.wallet.energyBalance - amount;
    const newStaked = this.wallet.stakedInVault + amount;

    const tx: WalletTransaction = {
      id: 'TX-STK-' + Date.now().toString(36),
      timestamp: Date.now(),
      type: 'VAULT_STAKE_DIVIDEND',
      amount: -amount,
      balanceAfter: newBalance,
      descriptionAr: `استثمار ${amount} نقطة في المخزن الوطني لتوليد درع الحماية`,
      descriptionEn: `Staked ${amount} energy in National Vault for defense yield`,
      signature: '',
    };
    tx.signature = generateSignature(tx);

    const updatedBase: Omit<UserWallet, 'integrityHash'> = {
      ...this.wallet,
      energyBalance: newBalance,
      stakedInVault: newStaked,
      transactions: [tx, ...this.wallet.transactions].slice(0, 40),
    };
    const integrityHash = calculateWalletIntegrity(updatedBase);
    this.saveWallet({ ...updatedBase, integrityHash });
    return true;
  }

  public unstakeFromVault(amount: number): boolean {
    if (amount <= 0 || this.wallet.stakedInVault < amount) return false;

    const newBalance = this.wallet.energyBalance + amount;
    const newStaked = this.wallet.stakedInVault - amount;

    const tx: WalletTransaction = {
      id: 'TX-USTK-' + Date.now().toString(36),
      timestamp: Date.now(),
      type: 'VAULT_STAKE_DIVIDEND',
      amount: amount,
      balanceAfter: newBalance,
      descriptionAr: `استرداد ${amount} نقطة من استثمار المخزن الوطني`,
      descriptionEn: `Unstaked ${amount} energy back to sovereign balance`,
      signature: '',
    };
    tx.signature = generateSignature(tx);

    const updatedBase: Omit<UserWallet, 'integrityHash'> = {
      ...this.wallet,
      energyBalance: newBalance,
      stakedInVault: newStaked,
      transactions: [tx, ...this.wallet.transactions].slice(0, 40),
    };
    const integrityHash = calculateWalletIntegrity(updatedBase);
    this.saveWallet({ ...updatedBase, integrityHash });
    return true;
  }
}

export const secureWallet = new SecurityWalletService();
