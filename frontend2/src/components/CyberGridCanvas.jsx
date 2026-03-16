import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function NeuralNodes({ tNorm, colStr }) {
  const nodesRef = useRef();
  
  const nodes = useMemo(() => {
    return Array.from({ length: 28 }).map(() => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      )
    }));
  }, []);

  useFrame(() => {
    if (nodesRef.current) {
      nodesRef.current.children.forEach((child, i) => {
        const node = nodes[i];
        child.position.add(node.velocity.clone().multiplyScalar(1 + tNorm * 2));
        
        if (child.position.x > 10 || child.position.x < -10) node.velocity.x *= -1;
        if (child.position.y > 5 || child.position.y < -5) node.velocity.y *= -1;
        if (child.position.z > 2 || child.position.z < -5) node.velocity.z *= -1;
      });
    }
  });

  return (
    <group ref={nodesRef}>
      {nodes.map((_, i) => (
        <Sphere key={i} args={[0.06, 16, 16]} position={nodes[i].position}>
          <meshBasicMaterial color={colStr} transparent opacity={0.6 + tNorm * 0.4} />
        </Sphere>
      ))}
    </group>
  );
}

function GridOverlay({ colStr }) {
  const gridRef = useRef();
  useFrame(({ clock }) => {
    if(gridRef.current) {
      gridRef.current.position.z = (clock.getElapsedTime() * 0.5) % 1;
    }
  });

  return (
    <group position={[0, -2, -5]} rotation={[Math.PI / 2, 0, 0]}>
      <gridHelper ref={gridRef} args={[50, 50, colStr, colStr]} material-transparent material-opacity={0.15} />
    </group>
  );
}

export default function CyberGridCanvas({ tNorm, threatColor }) {
  const colStr = `rgb(${threatColor.r}, ${threatColor.g}, ${threatColor.b})`;

  return (
    <div className="w-full h-full opacity-60 mix-blend-screen pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <fog attach="fog" args={['#080514', 2, 15]} />
        <ambientLight intensity={0.5} />
        <GridOverlay colStr={colStr} />
        <NeuralNodes tNorm={tNorm} colStr={colStr} />
        
        {/* Floating dust particles */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={200}
              array={new Float32Array(200 * 3).map(() => (Math.random() - 0.5) * 15)}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial color={colStr} size={0.03} transparent opacity={0.4} />
        </points>
      </Canvas>
    </div>
  );
}
