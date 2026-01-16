/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { GameStatus, ObstacleData, HandPositions } from '../types';
import { SPAWN_DISTANCE, INITIAL_SPEED, PLAYER_RADIUS } from '../constants';
import HexagonWall from './Note';
import PlayerCursor from './Saber';

// Augment JSX namespace to satisfy TypeScript build
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: any;
    }
  }
}

interface GameSceneProps {
  gameStatus: GameStatus;
  handPositionsRef: React.MutableRefObject<any>;
  onHit: () => void;
  gameTimeRef: React.MutableRefObject<number>;
}

const GameScene: React.FC<GameSceneProps> = ({ 
    gameStatus, 
    handPositionsRef, 
    onHit,
    gameTimeRef
}) => {
  const [walls, setWalls] = useState<ObstacleData[]>([]);
  const [playerAngle, setPlayerAngle] = useState(0);
  const [worldRotation, setWorldRotation] = useState(0);
  const [shake, setShake] = useState(0);
  
  // Game State Refs
  const speedRef = useRef(INITIAL_SPEED);
  const nextSpawnRef = useRef(0);
  const frameCountRef = useRef(0);

  // Helper to normalize angle to 0 ~ 2PI
  const normalizeAngle = (a: number) => {
      let angle = a % (Math.PI * 2);
      if (angle < 0) angle += Math.PI * 2;
      return angle;
  }

  useFrame((state, delta) => {
    if (gameStatus === GameStatus.LOADING) return;

    // 0. Update Game Time and calculate difficulty Speed
    const currentTime = gameTimeRef.current;
    
    if (gameStatus === GameStatus.PLAYING) {
        gameTimeRef.current += delta;
        
        let duration = 5;
        if (currentTime > 60) duration = 2;
        else if (currentTime > 40) duration = 3;
        else if (currentTime > 20) duration = 4;
        
        // Use current SPAWN_DISTANCE to calculate required speed
        speedRef.current = SPAWN_DISTANCE / duration;
    }

    // 1. Hand Tracking -> Player Angle
    const hands = handPositionsRef.current as HandPositions;
    const activeHand = hands.right || hands.left;

    if (activeHand) {
        const centerX = 0;
        const centerY = 1.5;
        const angle = Math.atan2(activeHand.y - centerY, activeHand.x - centerX);
        setPlayerAngle(angle);
    }

    // 2. Visual World Rotation & Shake decay
    if (gameStatus === GameStatus.PLAYING) {
        setWorldRotation(r => r + delta * 0.5);
        if (shake > 0) setShake(s => Math.max(0, s - delta * 5));
    }

    if (gameStatus !== GameStatus.PLAYING) return;

    // 3. COMBINED LOGIC: Spawn & Update Walls
    let newWall: ObstacleData | null = null;
    
    if (state.clock.elapsedTime > nextSpawnRef.current) {
        const gapSize = Math.PI / 2; // 90 degrees gap
        const randomAngle = Math.random() * Math.PI * 2;
        
        // Determine Color based on Time
        let colorA = '#f43f5e'; // Default Rose
        let colorB = '#3b82f6'; // Default Blue

        if (currentTime > 60) {
            // Phase 4: Purple (Final)
            colorA = '#9333ea'; // Purple 600
            colorB = '#d8b4fe'; // Purple 300
        } else if (currentTime > 40) {
            // Phase 3: Dark Red only (Danger)
            colorA = '#7f1d1d'; // Red 900
            colorB = '#991b1b'; // Red 800
        } else if (currentTime > 20) {
            // Phase 2: Green & Yellow
            colorA = '#22c55e'; // Green 500
            colorB = '#eab308'; // Yellow 500
        }

        newWall = {
            id: `wall-${frameCountRef.current++}`,
            distance: SPAWN_DISTANCE,
            angleStart: randomAngle,
            gapSize: gapSize,
            color: frameCountRef.current % 2 === 0 ? colorA : colorB,
            sides: 6,
            passed: false
        };
        
        // Update spawn timer
        const interval = Math.max(0.6, 25 / speedRef.current); 
        nextSpawnRef.current = state.clock.elapsedTime + interval;
    }

    // Single State Update for Atomicity
    setWalls(prev => {
        // Start with existing walls + new wall if any
        const currentWalls = newWall ? [...prev, newWall] : [...prev];
        const nextWalls: ObstacleData[] = [];
        
        const GAP_PADDING = 0.25; 
        const localPlayerAngle = normalizeAngle(playerAngle - worldRotation);
        const COLLISION_START_DIST = 4.0; 
        const COLLISION_END_DIST = 3.4;

        for (const wall of currentWalls) {
            // Create a copy to avoid mutating state directly
            const updatedWall = { ...wall };
            
            // Move wall using GLOBAL speed
            updatedWall.distance -= delta * speedRef.current;

            // Collision Check
            if (!updatedWall.passed && updatedWall.distance < COLLISION_START_DIST && updatedWall.distance > COLLISION_END_DIST) {
                const wStart = normalizeAngle(updatedWall.angleStart);
                let relativeP = normalizeAngle(localPlayerAngle - wStart);

                const safeStart = GAP_PADDING;
                const safeEnd = updatedWall.gapSize - GAP_PADDING;

                const isSafe = relativeP > safeStart && relativeP < safeEnd;

                if (!isSafe) {
                    updatedWall.passed = true;
                    onHit();
                    setShake(1.0);
                }
            }

            if (updatedWall.distance < COLLISION_END_DIST) {
                updatedWall.passed = true;
            }

            // Keep wall until it disappears
            if (updatedWall.distance > 0.5) {
                nextWalls.push(updatedWall);
            }
        }

        return nextWalls;
    });
  });

  return (
    <>
      <color attach="background" args={['#111']} />
      
      {/* Post Processing */}
      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.5} />
        {shake > 0 && (
            <ChromaticAberration 
                offset={new THREE.Vector2(0.01 * shake, 0.01 * shake)}
                radialModulation={false}
                modulationOffset={0}
            />
        )}
      </EffectComposer>

      {/* Camera: Zoomed in to Z=50 for larger visuals */}
      <PerspectiveCamera makeDefault position={[0, 0, 50]} fov={60} />

      {/* Shake Wrapper */}
      <group position={[Math.random() * shake * 0.5, Math.random() * shake * 0.5, 0]}>
          
          {/* The Rotating World Group */}
          <group rotation={[0, 0, worldRotation]}>
              
              {/* Central Pivot visual */}
              <mesh>
                 <ringGeometry args={[PLAYER_RADIUS - 0.2, PLAYER_RADIUS, 6]} />
                 <meshBasicMaterial color="#333" />
              </mesh>

              <PlayerCursor angle={playerAngle - worldRotation} />

              {walls.map(wall => (
                  <HexagonWall key={wall.id} data={wall} />
              ))}

          </group>
          
          {/* Dynamic Background Grid */}
          <gridHelper args={[200, 40, 0x444444, 0x222222]} rotation={[Math.PI/2, 0, worldRotation * 0.5]} position={[0,0,-10]} />
      </group>
    </>
  );
};

export default GameScene;