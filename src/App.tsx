import React, { useState, useEffect, useCallback } from 'react';
import { CountryId, LeaderboardEntry, NationalRanking, GameEvent } from './types';
import { gameEngine } from './game/GameEngine';
import { secureWallet } from './services/securityWallet';
import { soundManager } from './services/sound';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { ControlsOverlay } from './components/ControlsOverlay';
import { StartScreen } from './components/StartScreen';
import { WalletModal } from './components/WalletModal';
import { CountrySelectModal } from './components/CountrySelectModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GameOverModal } from './components/GameOverModal';
import { EventFeed } from './components/EventFeed';

export default function App() {
  // Game Flow States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [earnedEnergyOnDeath, setEarnedEnergyOnDeath] = useState<number>(0);

  // Player Profile
  const [playerName, setPlayerName] = useState<string>('فارس_الصحراء');
  const [playerCountryId, setPlayerCountryId] = useState<CountryId>('KSA');

  // Live Stats
  const [mass, setMass] = useState<number>(20);
  const [rank, setRank] = useState<number>(1);
  const [kills, setKills] = useState<number>(0);
  const [vaultEnergy, setVaultEnergy] = useState<number>(5000);
  const [towerCharge, setTowerCharge] = useState<number>(25);
  const [walletBalance, setWalletBalance] = useState<number>(secureWallet.getBalance());
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted);

  // Leaderboard & Events
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nationalRankings, setNationalRankings] = useState<NationalRanking[]>([]);
  const [events, setEvents] = useState<GameEvent[]>([]);

  // Modals
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isCountrySelectOpen, setIsCountrySelectOpen] = useState<boolean>(false);

  // Refresh wallet balance from service
  const refreshWallet = useCallback(() => {
    setWalletBalance(secureWallet.getBalance());
  }, []);

  // Hook game engine events
  useEffect(() => {
    gameEngine.onLeaderboardUpdate = (lb, nr) => {
      setLeaderboard(lb);
      setNationalRankings(nr);
    };

    gameEngine.onPlayerStatsUpdate = stats => {
      setMass(stats.mass);
      setKills(stats.kills);
      setRank(stats.rank);
      setVaultEnergy(stats.vaultEnergy);
      setTowerCharge(stats.towerCharge);
    };

    gameEngine.onPlayerDeath = (reason, earnedPoints) => {
      setIsGameOver(true);
      setGameOverReason(reason);
      setEarnedEnergyOnDeath(earnedPoints);
      refreshWallet();
    };

    gameEngine.onEventNotification = ev => {
      setEvents(prev => [ev, ...prev].slice(0, 10));
    };

    refreshWallet();
  }, [refreshWallet]);

  // Start or Respawn game
  const handleStartGame = (name: string, countryId: CountryId, startingCharge: number) => {
    setPlayerName(name);
    setPlayerCountryId(countryId);
    setIsPlaying(true);
    setIsGameOver(false);
    gameEngine.spawnPlayer(name, countryId, startingCharge);
    refreshWallet();
  };

  // Quick Deposit mass from HUD button
  const handleQuickDeposit = () => {
    const res = gameEngine.depositPlayerEnergyToWallet();
    if (res.success) {
      refreshWallet();
    }
  };

  // Quick Charge 50 mass from HUD button
  const handleQuickCharge = () => {
    const res = gameEngine.injectWalletEnergyIntoPlayer(50);
    if (res) {
      refreshWallet();
    }
  };

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* 1. Main 60 FPS HTML5 Canvas Viewport */}
      <GameCanvas />

      {/* 2. Top-right Live Event Ticker Feed */}
      <EventFeed events={events} />

      {/* 3. In-Game HUD (Only shown when active in match) */}
      {isPlaying && !isGameOver && (
        <>
          <HUD
            playerCountryId={playerCountryId}
            playerName={playerName}
            mass={mass}
            rank={rank}
            kills={kills}
            vaultEnergy={vaultEnergy}
            towerCharge={towerCharge}
            walletBalance={walletBalance}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onOpenWallet={() => setIsWalletOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenCountrySelect={() => setIsCountrySelectOpen(true)}
            onQuickDeposit={handleQuickDeposit}
            onQuickCharge={handleQuickCharge}
          />

          {/* Touch / Quick Key Action Buttons */}
          <ControlsOverlay onQuickDeposit={handleQuickDeposit} />
        </>
      )}

      {/* 4. Start Screen Overlay */}
      {!isPlaying && (
        <StartScreen
          onStartGame={handleStartGame}
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        />
      )}

      {/* 5. Game Over / Respawn Modal */}
      {isGameOver && (
        <GameOverModal
          isOpen={isGameOver}
          reason={gameOverReason}
          earnedEnergy={earnedEnergyOnDeath}
          playerCountryId={playerCountryId}
          playerName={playerName}
          peakMass={gameEngine.playerMaxMassReached}
          kills={gameEngine.playerKills}
          debrisCollected={gameEngine.playerDebrisCollected}
          onRespawn={startingCharge => handleStartGame(playerName, playerCountryId, startingCharge)}
          onChangeCountry={() => setIsCountrySelectOpen(true)}
          onOpenWallet={() => setIsWalletOpen(true)}
        />
      )}

      {/* 6. Sovereign Encrypted Wallet Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        playerCountryId={playerCountryId}
        onWalletUpdated={refreshWallet}
      />

      {/* 7. 20 Middle Eastern Countries Dossier Modal */}
      <CountrySelectModal
        isOpen={isCountrySelectOpen}
        onClose={() => setIsCountrySelectOpen(false)}
        selectedCountryId={playerCountryId}
        onSelectCountry={id => {
          setPlayerCountryId(id);
          if (isPlaying) {
            gameEngine.spawnPlayer(playerName, id, 0);
          }
          setIsCountrySelectOpen(false);
        }}
      />

      {/* 8. National Sovereignty & Champions Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        leaderboard={leaderboard}
        nationalRankings={nationalRankings}
      />
    </div>
  );
}
