
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';

export enum GameStatus {
  LOADING = 'LOADING',
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export enum Difficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD'
}

export interface ObstacleData {
  id: string;
  distance: number;     // Distance from center (starts high, shrinks to 0)
  angleStart: number;   // Gap start angle (radians)
  gapSize: number;      // Size of the gap (radians)
  // speed removed as we use global speed
  color: string;
  sides: number;        // 6 for hexagon
  passed: boolean;
}

export interface HandPositions {
  left: THREE.Vector3 | null;
  right: THREE.Vector3 | null;
  // We only need position for angle calculation
}

export const COLORS = {
  player: '#e2e8f0', // White/Slate
  wall: '#f43f5e',   // Rose
  bg: '#0f172a',      // Dark Slate
  left: '#f43f5e',   // Red/Rose (for hand tracking visual)
  right: '#3b82f6'   // Blue (for hand tracking visual)
};
