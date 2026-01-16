/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ObstacleData } from '../types';

interface WallProps {
  data: ObstacleData;
}

const HexagonWall: React.FC<WallProps> = ({ data }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Using standard mesh scaling for the "Shrinking" effect is easiest
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.scale.setScalar(data.distance);
    }
  });

  // Calculate Geometry for a "Ring" with a gap
  const ringArgs = useMemo<[number, number, number, number, number, number]>(() => {
     const innerR = 0.9;
     const outerR = 1.0;
     const thetaSegments = 6; // Makes it a Hexagon!
     
     // The geometry is static, we rotate the mesh to align the gap
     const length = (Math.PI * 2) - data.gapSize;
     return [innerR, outerR, thetaSegments, 1, 0, length];
  }, [data.gapSize]);

  // Rotation to align the empty space (Gap) correctly
  // The ring draws from 0 to length. The gap is from length to 2PI.
  // We want that 'gap area' to be at data.angleStart.
  const rotationZ = data.angleStart + data.gapSize; 

  return (
    <group ref={groupRef} rotation={[0, 0, rotationZ]}>
        <mesh>
            <ringGeometry args={ringArgs} />
            <meshBasicMaterial color={data.color} side={THREE.DoubleSide} />
        </mesh>
        {/* Wireframe outline for style */}
        <mesh>
             <ringGeometry args={[ringArgs[0], ringArgs[0] + 0.02, 6, 1, 0, ringArgs[5]]} />
             <meshBasicMaterial color="#ffffff" />
        </mesh>
    </group>
  );
};

export default HexagonWall;