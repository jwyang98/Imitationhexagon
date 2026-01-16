/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PLAYER_RADIUS } from '../constants';

interface PlayerCursorProps {
  angle: number; // Current angle in radians
}

const PlayerCursor: React.FC<PlayerCursorProps> = ({ angle }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Calculate position on the circle based on angle
    const x = Math.cos(angle) * PLAYER_RADIUS;
    const y = Math.sin(angle) * PLAYER_RADIUS;

    meshRef.current.position.set(x, y, 0);
    
    // Rotate the triangle to face outward/inward appropriately
    // angle + PI/2 makes it tangent to the circle
    meshRef.current.rotation.z = angle - Math.PI / 2;

    // Pulse effect
    const scale = 1 + Math.sin(state.clock.elapsedTime * 20) * 0.1;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={meshRef}>
      {/* The Triangle Cursor */}
      <mesh>
        <coneGeometry args={[0.4, 0.8, 3]} /> {/* Triangle shape */}
        <meshBasicMaterial color="#fbbf24" /> {/* Amber color */}
      </mesh>
      
      {/* Glow */}
      <pointLight color="#fbbf24" distance={3} intensity={5} />
    </group>
  );
};

export default PlayerCursor;