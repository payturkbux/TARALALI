import React, { useState } from 'react';
import {
  Wallet,
  ShieldCheck,
  Zap,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Key,
  TrendingUp,
  X,
  Coins,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { secureWallet } from '../services/securityWallet';
import { gameEngine } from '../game/GameEngine';
import { COUNTRIES_DATA } from '../data/countries';
import { CountryId } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCountryId: CountryId;
  onWalletUpdated: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  playerCountryId,
  onWalletUpdated,
}) => {
  const [chargeInput, setChargeInput] = useState<number>(50);
  const [stakeInput, setStakeInput] = useState<number>(50);
  const [activeTab, setActiveTab] = useState<'manage' | 'stake' | 'ledger'>('manage');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const wallet = secureWallet.getWallet();
  const country = COUNTRIES_DATA[playerCountryId] || COUNTRIES_DATA.KSA;
  const isAlive = gameEngine.isPlayerAlive;
  const playerMass = Math.round(gameEngine.playerTotalMass);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleChargeBall = () => {
    if (!isAlive) {
      showFeedback('error', 'يجب أن تكون في قيد اللعب داخل الساحة لشحن الكرة');
      return;
    }
    if (chargeInput <= 0 || chargeInput > wallet.energyBalance) {
      showFeedback('error', 'الرصيد في المحفظة غير كافٍ');
      return;
    }

    const success = gameEngine.injectWalletEnergyIntoPlayer(chargeInput);
    if (success) {
      showFeedback('success', `تم شحن كرة الطاقة بـ ${chargeInput} نقطة بنجاح!`);
      onWalletUpdated();
    } else {
      showFeedback('error', 'فشلت عملية الشحن، يرجى المحاولة ثانية');
    }
  };

  const handleDepositMass = () => {
    if (!isAlive) {
      showFeedback('error', 'لا توجد كرة نشطة في الميدان لتفريغ طاقتها');
      return;
    }

    const result = gameEngine.depositPlayerEnergyToWallet();
    if (result.success) {
      showFeedback('success', `تم حفظ وتخزين ${result.depositedPoints} نقطة سيادية في محفظتك!`);
      onWalletUpdated();
    } else {
      showFeedback('error', 'كتلة كرتك صغيرة جداً حالياً، اجمع طاقة أكثر أولاً');
    }
  };

  const handleStake = () => {
    if (stakeInput <= 0 || stakeInput > wallet.energyBalance) {
      showFeedback('error', 'الرصيد المتاح غير كافٍ للاستثمار');
      return;
    }
    const ok = secureWallet.stakeInVault(stakeInput);
    if (ok) {
      showFeedback('success', `تم استثمار ${stakeInput} نقطة في مخزن ${country.nameAr}!`);
      onWalletUpdated();
    }
  };

  const handleUnstake = () => {
    if (wallet.stakedInVault <= 0) {
      showFeedback('error', 'لا يوجد رصيد مستثمر حالياً');
      return;
    }
    const ok = secureWallet.unstakeFromVault(wallet.stakedInVault);
    if (ok) {
      showFeedback('success', 'تم استرداد كامل الطاقة المستثمرة إلى رصيد المحفظة!');
      onWalletUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div
        id="wallet-modal-container"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl shadow-amber-950/50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                <span>محفظة الطاقة والسيادة الوطنية</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>أصل محمي وموثق</span>
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                سجل طاقة مشفر غير قابل للتلاعب مرتبط بمخازن الشرق الأوسط
              </p>
            </div>
          </div>

          <button
            id="close-wallet-modal"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Overview Card */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border-b border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Liquid Balance */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30">
              <div className="text-xs font-semibold text-amber-400/80 mb-1">رصيد الطاقة المتاح</div>
              <div className="text-2xl font-black text-white flex items-baseline gap-1">
                <span>{wallet.energyBalance.toLocaleString()}</span>
                <span className="text-xs text-amber-400 font-normal">نقطة EN</span>
              </div>
            </div>

            {/* Staked in National Vault */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30">
              <div className="text-xs font-semibold text-cyan-400/80 mb-1">المستثمر في مخزن {country.code}</div>
              <div className="text-2xl font-black text-white flex items-baseline gap-1">
                <span>{wallet.stakedInVault.toLocaleString()}</span>
                <span className="text-xs text-cyan-400 font-normal">نقطة</span>
              </div>
            </div>

            {/* Total Harvested Bounties */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30">
              <div className="text-xs font-semibold text-emerald-400/80 mb-1">إجمالي الحصاد والتفتيت</div>
              <div className="text-2xl font-black text-white flex items-baseline gap-1">
                <span>{wallet.totalHarvested.toLocaleString()}</span>
                <span className="text-xs text-emerald-400 font-normal">نقطة</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Address Stamp */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="flex items-center gap-1.5 font-mono text-slate-300">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>المعرّف السيادي: {wallet.publicKey}</span>
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>توقيع الحماية: {wallet.integrityHash.substring(0, 14)}...</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 pt-2">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            شحن وتفريغ طاقة الميدان
          </button>
          <button
            onClick={() => setActiveTab('stake')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'stake'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            الاستثمار بالمخزن الوطني
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            سجل العمليات الموثق ({wallet.transactions.length})
          </button>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 no-scrollbar space-y-4">
          {activeTab === 'manage' && (
            <div className="space-y-4">
              {/* Action 1: Inject to Ball */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">شحن كرة الطاقة بالميدان</h4>
                      <p className="text-xs text-slate-400">تحويل نقاط المحفظة إلى كتلة مباشرة لزيادة حجمك وسرعتك</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-cyan-300">
                    الكتلة الحالية: {playerMass}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[25, 50, 100, 250].map(val => (
                    <button
                      key={val}
                      onClick={() => setChargeInput(val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        chargeInput === val
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      +{val}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    max={wallet.energyBalance}
                    value={chargeInput}
                    onChange={e => setChargeInput(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-24 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white text-center focus:border-cyan-400 outline-none"
                  />
                  <button
                    onClick={handleChargeBall}
                    disabled={!isAlive || wallet.energyBalance < chargeInput}
                    className="flex-1 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950/50"
                  >
                    <Zap className="w-4 h-4" />
                    <span>شحن الكرة الآن</span>
                  </button>
                </div>
              </div>

              {/* Action 2: Withdraw Mass into Wallet */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">تفريغ وتخزين طاقة الكرة (Crystallize)</h4>
                      <p className="text-xs text-slate-400">سحب كتلة الكرة المكتسبة وحفظها كنقاط سيادية آمنة للأبد</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">
                    حافز الدولة: {country.nameAr}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    سيتم الإبقاء على الكتلة الأساسية (20) وتحويل الفائض فوراً لمحفظتك وللمخزن الوطني.
                  </div>
                  <button
                    onClick={handleDepositMass}
                    disabled={!isAlive || playerMass <= 30}
                    className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/50"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    <span>تفريغ وتخزين الكتلة</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stake' && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-cyan-500/30 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">الاستثمار في مخزن {country.nameAr} ({country.code})</h4>
                  <p className="text-xs text-slate-400">
                    استثمر نقاطك لتقوية درع وبرج حماية وطنك وتحصيل عوائد سيادية دورية
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">خاصية الدولة: </span>
                  <span className="font-bold text-white">{country.perkName}</span>
                </div>
                <div>
                  <span className="text-slate-400">عائد الدفاع: </span>
                  <span className="font-bold text-emerald-400">+15 نقطة لكل صد ليزري</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={wallet.energyBalance}
                  value={stakeInput}
                  onChange={e => setStakeInput(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-32 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white text-center focus:border-cyan-400 outline-none"
                />
                <button
                  onClick={handleStake}
                  disabled={wallet.energyBalance < stakeInput}
                  className="flex-1 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-black text-xs transition-all cursor-pointer"
                >
                  استثمار النقاط في المخزن
                </button>
                <button
                  onClick={handleUnstake}
                  disabled={wallet.stakedInVault <= 0}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  استرداد المستثمر
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 flex items-center justify-between mb-2">
                <span>سلسلة السجلات والعمليات (موقعة وموثقة رقمياً)</span>
                <span>تحديث لحظي</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                {wallet.transactions.map((tx, idx) => (
                  <div
                    key={tx.id || idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      <div>
                        <div className="font-bold text-white">{tx.descriptionAr}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(tx.timestamp).toLocaleTimeString('ar-SA')} • {tx.signature}
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <div
                        className={`font-black ${
                          tx.amount >= 0 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} EN
                      </div>
                      <div className="text-[10px] text-slate-400">
                        الرصيد: {tx.balanceAfter}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
