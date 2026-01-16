
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameStatus, Difficulty } from './types';
import { BGM_URL } from './constants';
import { useMediaPipe } from './hooks/useMediaPipe';
import GameScene from './components/GameScene';
import WebcamPreview from './components/WebcamPreview';
import { Play, RotateCcw, Hand, Heart, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.LOADING);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const [timeSurvived, setTimeSurvived] = useState(0);
  const [bestTime, setBestTime] = useState(0);
  const [lives, setLives] = useState(1);
  const [maxLives, setMaxLives] = useState(1);
  const [gameId, setGameId] = useState(0); // Used to force reset GameScene
  
  const audioRef = useRef<HTMLAudioElement>(new Audio(BGM_URL));
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Game logic refs
  const gameTimeRef = useRef(0);
  
  const { isCameraReady, handPositionsRef, lastResultsRef, error: cameraError } = useMediaPipe(videoRef);

  useEffect(() => {
      // Audio Loop
      if (audioRef.current) {
          audioRef.current.loop = true;
          audioRef.current.volume = 0.6;
      }
  }, []);

  // Timer loop
  useEffect(() => {
      let interval: any;
      if (gameStatus === GameStatus.PLAYING) {
          interval = setInterval(() => {
              setTimeSurvived(t => t + 0.1); // Update UI every 100ms
          }, 100);
      }
      return () => clearInterval(interval);
  }, [gameStatus]);

  const startGame = async () => {
    if (!isCameraReady) return;
    
    // Set Lives based on Difficulty
    let initialLives = 1;
    if (difficulty === Difficulty.EASY) initialLives = 3;
    if (difficulty === Difficulty.NORMAL) initialLives = 2;
    if (difficulty === Difficulty.HARD) initialLives = 1;

    setLives(initialLives);
    setMaxLives(initialLives);

    setTimeSurvived(0);
    gameTimeRef.current = 0;
    
    // Increment Game ID to force GameScene remount
    setGameId(prev => prev + 1);

    try {
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
      }
      setGameStatus(GameStatus.PLAYING);
    } catch (e) {
        console.error("Audio play failed", e);
    }
  };

  const handleHit = useCallback(() => {
      setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
              setGameStatus(GameStatus.GAME_OVER);
              if (audioRef.current) {
                  audioRef.current.pause();
              }
              setBestTime(prevBest => Math.max(prevBest, gameTimeRef.current));
              return 0;
          }
          return newLives;
      });
  }, []);

  const handleGameOver = useCallback(() => {
     // This is called directly if something forces game over, but handleHit usually manages it.
     setGameStatus(GameStatus.GAME_OVER);
     setBestTime(prev => Math.max(prev, gameTimeRef.current));
  }, []);

  useEffect(() => {
      if (gameStatus === GameStatus.LOADING && isCameraReady) {
          setGameStatus(GameStatus.IDLE);
      }
  }, [isCameraReady, gameStatus]);

  const formatTime = (seconds: number) => {
      return seconds.toFixed(2);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono select-none">
      <video 
        ref={videoRef} 
        className="absolute opacity-0 pointer-events-none"
        playsInline
        muted
        autoPlay
        style={{ width: '640px', height: '480px' }}
      />

      <Canvas shadows dpr={[1, 2]}>
          <GameScene 
            key={gameId} // Forces complete reset of scene state on new game
            gameStatus={gameStatus}
            handPositionsRef={handPositionsRef}
            onHit={handleHit}
            gameTimeRef={gameTimeRef}
          />
      </Canvas>

      <WebcamPreview 
          videoRef={videoRef} 
          resultsRef={lastResultsRef} 
          isCameraReady={isCameraReady} 
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
          
          {/* Top HUD */}
          <div className="flex justify-between items-start text-white w-full">
             <div>
                 <p className="text-sm text-gray-400">CURRENT TIME</p>
                 <h2 className="text-4xl font-bold tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                     {formatTime(timeSurvived)}s
                 </h2>
             </div>

             {/* Lives HUD */}
             {gameStatus === GameStatus.PLAYING && (
                 <div className="flex gap-1 items-center bg-black/50 p-2 rounded-lg border border-red-500/30">
                     {Array.from({ length: maxLives }).map((_, i) => (
                         <Heart 
                             key={i} 
                             size={24} 
                             className={`${i < lives ? "fill-red-500 text-red-500" : "fill-gray-800 text-gray-800"}`} 
                         />
                     ))}
                 </div>
             )}

             <div className="text-right">
                 <p className="text-xs text-gray-500">BEST TIME</p>
                 <p className="text-xl text-yellow-400">{formatTime(bestTime)}s</p>
             </div>
          </div>

          {/* Center Screens */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              
              {gameStatus === GameStatus.LOADING && (
                  <div className="bg-black/80 p-10 flex flex-col items-center border border-gray-700">
                      <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin mb-4"></div>
                      <p className="text-white tracking-widest text-xs animate-pulse">SYSTEM STARTUP...</p>
                      {cameraError && <p className="text-red-500 mt-2 font-bold">{cameraError}</p>}
                  </div>
              )}

              {gameStatus === GameStatus.IDLE && (
                  <div className="text-center bg-black/60 p-12 backdrop-blur-md border-y-2 border-white/20 w-full max-w-2xl flex flex-col items-center">
                      <h1 className="text-7xl font-black text-white mb-2 tracking-tighter italic transform -skew-x-12 drop-shadow-[4px_4px_0px_#f43f5e]">
                          IMITATION<br/>HEXAGON
                      </h1>
                      <div className="mt-4 space-y-1 text-white/80">
                           <p className="flex items-center justify-center gap-2">
                               <Hand size={20} /> ONE HAND CONTROL
                           </p>
                           <p className="text-xs text-gray-400">Survival Game</p>
                      </div>

                      {/* Difficulty Selection */}
                      <div className="mt-8 w-full">
                          <p className="text-sm text-gray-400 mb-2 uppercase tracking-widest">Select Difficulty</p>
                          <div className="flex justify-center gap-4">
                              <button 
                                  onClick={() => setDifficulty(Difficulty.EASY)}
                                  className={`px-6 py-3 border font-bold skew-x-[-12deg] transition-all ${difficulty === Difficulty.EASY ? 'bg-green-500 text-black border-green-500 scale-110 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'border-gray-600 text-gray-400 hover:border-green-500 hover:text-green-500'}`}
                              >
                                  EASY
                                  <span className="block text-[10px] font-normal opacity-80 mt-1">3 LIVES</span>
                              </button>
                              <button 
                                  onClick={() => setDifficulty(Difficulty.NORMAL)}
                                  className={`px-6 py-3 border font-bold skew-x-[-12deg] transition-all ${difficulty === Difficulty.NORMAL ? 'bg-blue-500 text-black border-blue-500 scale-110 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-500'}`}
                              >
                                  NORMAL
                                  <span className="block text-[10px] font-normal opacity-80 mt-1">2 LIVES</span>
                              </button>
                              <button 
                                  onClick={() => setDifficulty(Difficulty.HARD)}
                                  className={`px-6 py-3 border font-bold skew-x-[-12deg] transition-all ${difficulty === Difficulty.HARD ? 'bg-red-500 text-black border-red-500 scale-110 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-500'}`}
                              >
                                  HARD
                                  <span className="block text-[10px] font-normal opacity-80 mt-1">1 LIFE</span>
                              </button>
                          </div>
                      </div>
                      
                      {!isCameraReady ? (
                           <p className="mt-10 text-red-400 animate-pulse">INITIALIZING CAMERA...</p>
                      ) : (
                          <button 
                              onClick={startGame}
                              className="mt-10 bg-white text-black text-3xl font-bold py-4 px-20 hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 skew-x-[-12deg] shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                          >
                              START
                          </button>
                      )}
                  </div>
              )}

              {gameStatus === GameStatus.GAME_OVER && (
                  <div className="text-center bg-black/70 p-10 rounded-xl backdrop-blur-lg border border-red-900/50">
                      <h1 className="text-6xl font-black text-red-500 mb-2 tracking-tight drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">GAME OVER</h1>
                      <p className="text-gray-400 mb-6">{difficulty} MODE</p>
                      
                      <div className="bg-white/10 p-6 mb-8 rounded backdrop-blur-md border border-white/10">
                          <p className="text-gray-300 text-sm mb-1">SURVIVED FOR</p>
                          <p className="text-5xl font-bold text-white">{formatTime(timeSurvived)}s</p>
                      </div>
                      
                      <div className="flex gap-4 justify-center">
                          <button 
                              onClick={() => setGameStatus(GameStatus.IDLE)}
                              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black text-lg font-bold py-3 px-8 transition-colors flex items-center gap-2"
                          >
                             <RotateCcw size={18} /> BACK TO MENU
                          </button>
                          <button 
                              onClick={startGame}
                              className="bg-red-600 hover:bg-red-500 text-white border-2 border-red-600 text-lg font-bold py-3 px-8 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                          >
                             <Play size={18} /> RETRY
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default App;
