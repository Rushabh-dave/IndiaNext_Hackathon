import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function NetworkNodes() {
  const groupRef = useRef()
  const nodesCount = 60
  const connectionsCount = 80

  const nodePositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < nodesCount; i++) {
      positions.push([
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
      ])
    }
    return positions
  }, [])

  const connectionLines = useMemo(() => {
    const lines = []
    for (let i = 0; i < connectionsCount; i++) {
      const a = Math.floor(Math.random() * nodesCount)
      const b = Math.floor(Math.random() * nodesCount)
      if (a !== b) {
        lines.push([nodePositions[a], nodePositions[b]])
      }
    }
    return lines
  }, [nodePositions])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.03
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      {nodePositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color={i % 5 === 0 ? '#06b6d4' : '#22c55e'} />
        </mesh>
      ))}

      {connectionLines.map((line, i) => {
        const points = line.map(p => new THREE.Vector3(...p))
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        return (
          <line key={i} geometry={geometry}>
            <lineBasicMaterial
              color={i % 3 === 0 ? '#22c55e' : '#06b6d4'}
              transparent
              opacity={0.15}
            />
          </line>
        )
      })}
    </group>
  )
}

function Particles() {
  const particlesRef = useRef()
  const count = 200

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20
      arr[i * 3 + 2] = (Math.random() - 0.5) * 15
    }
    return arr
  }, [])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.01
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#22c55e" size={0.05} transparent opacity={0.4} />
    </points>
  )
}

function GridPlane() {
  const meshRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05
    }
  })

  return (
    <gridHelper
      ref={meshRef}
      args={[30, 30, '#22c55e', '#22c55e']}
      position={[0, -5, 0]}
      rotation={[0, 0, 0]}
    />
  )
}

export default function CyberNetworkScene({ height = '100%' }) {
  return (
    <div style={{ width: '100%', height, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <NetworkNodes />
        <Particles />
        <GridPlane />
        <fog attach="fog" args={['#0f172a', 15, 30]} />
      </Canvas>
    </div>
  )
}
