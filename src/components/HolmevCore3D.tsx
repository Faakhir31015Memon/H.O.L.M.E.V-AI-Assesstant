import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Ring } from '@react-three/drei';
import * as THREE from 'three';
import { useSystem } from '../context/SystemContext';

// Rotating rings component inside the R3F Canvas context
const ReactorRings: React.FC = () => {
  const { systemState, overkillMode } = useSystem();
  
  const outerRingRef = useRef<THREE.Mesh>(null);
  const midRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    
    // Determine speed multipliers based on states
    let speedMult = 1.0;
    if (systemState === 'LISTENING') speedMult = 2.5;
    if (systemState === 'PROCESSING') speedMult = 5.0;
    if (overkillMode) speedMult *= 2.0;

    // Outer Ring rotation (X & Y)
    if (outerRingRef.current) {
      outerRingRef.current.rotation.y = elapsed * 0.15 * speedMult;
      outerRingRef.current.rotation.x = Math.PI / 4;
    }

    // Mid Ring rotation (Y & Z)
    if (midRingRef.current) {
      midRingRef.current.rotation.z = -elapsed * 0.25 * speedMult;
      midRingRef.current.rotation.y = Math.PI / 6;
    }

    // Inner Ring rotation (Z & X)
    if (innerRingRef.current) {
      innerRingRef.current.rotation.x = elapsed * 0.4 * speedMult;
      innerRingRef.current.rotation.z = Math.PI / 3;
    }

    // Core scaling pulse
    if (coreRef.current) {
      let pulseFreq = 1.5;
      let pulseAmp = 0.05;
      
      if (systemState === 'LISTENING') {
        pulseFreq = 8.0;
        pulseAmp = 0.15;
      } else if (systemState === 'PROCESSING') {
        pulseFreq = 15.0;
        pulseAmp = 0.08;
      }

      const pulse = 1.0 + Math.sin(elapsed * pulseFreq) * pulseAmp;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const primaryColor = overkillMode ? '#ff3c00' : '#00f3ff';
  const secondaryColor = overkillMode ? '#ffb700' : '#0055ff';

  return (
    <group>
      {/* Outer Rotating Segmented Ring */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[1.9, 0.04, 8, 48]} />
        <meshBasicMaterial 
          color={primaryColor} 
          wireframe 
          transparent 
          opacity={0.4} 
        />
      </mesh>

      {/* Middle Rotating Dashed-style Segmented Ring */}
      <mesh ref={midRingRef}>
        <torusGeometry args={[1.5, 0.03, 6, 32]} />
        <meshBasicMaterial 
          color={secondaryColor} 
          wireframe 
          transparent 
          opacity={0.5} 
        />
      </mesh>

      {/* Inner Fast Ring */}
      <mesh ref={innerRingRef}>
        <torusGeometry args={[1.1, 0.02, 4, 24]} />
        <meshBasicMaterial 
          color={primaryColor} 
          wireframe 
          transparent 
          opacity={0.7} 
        />
      </mesh>

      {/* Central Solid Pulsing Core Sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial 
          color={primaryColor} 
          transparent 
          opacity={0.8} 
        />
      </mesh>
      
      {/* Dynamic glow helper mesh */}
      <mesh>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial 
          color={primaryColor} 
          transparent 
          opacity={0.12} 
        />
      </mesh>
    </group>
  );
};

export const HolmevCore3D: React.FC = () => {
  const { systemState, overkillMode } = useSystem();

  // Particle configurations based on state
  const getParticleProps = () => {
    const isOverkill = overkillMode;
    const color = isOverkill ? '#ff5500' : systemState === 'PROCESSING' ? '#ffb700' : '#00f3ff';
    
    switch (systemState) {
      case 'LISTENING':
        return { count: 60, scale: 2.2, size: 2.5, speed: 2.2, color };
      case 'PROCESSING':
        return { count: 120, scale: 2.5, size: 3.5, speed: 4.5, color };
      case 'IDLE':
      default:
        return { count: 25, scale: 1.8, size: 1.5, speed: 0.6, color };
    }
  };

  const particles = getParticleProps();

  return (
    <div className="w-full h-full relative flex items-center justify-center min-h-[320px]">
      
      {/* 3D R3F Canvas */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 60 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color={overkillMode ? '#ff3c00' : '#00f3ff'} />
          
          <ReactorRings />
          
          {/* Glowing Drei Sparkles Particles */}
          <Sparkles 
            count={particles.count}
            scale={particles.scale}
            size={particles.size}
            speed={particles.speed}
            color={particles.color}
          />
        </Canvas>
      </div>

      {/* Decorative compass HUD ticks overlay */}
      <div className="absolute w-[280px] h-[280px] rounded-full border border-cyber-cyan/5 pointer-events-none flex items-center justify-center">
        <div className="absolute w-full h-[1px] bg-cyber-cyan/5" />
        <div className="absolute w-[1px] h-full bg-cyber-cyan/5" />
        <div className="absolute w-[240px] h-[240px] rounded-full border border-dashed border-cyber-cyan/10 animate-spin-slow" />
        <div className="absolute w-[200px] h-[200px] rounded-full border border-dashed border-cyber-blue/10 animate-spin-reverse-slow" />
      </div>
      
      {/* Inner state message panels */}
      <div className="absolute bottom-4 text-center pointer-events-none select-none z-10">
        <div className="font-orbitron font-extrabold text-sm tracking-[3px] text-cyber-cyan uppercase drop-shadow-[0_0_10px_var(--primary-accent)]">
          {overkillMode ? 'H.O.L.M.E.V. // OVERCLOCK' : systemState === 'LISTENING' ? 'H.O.L.M.E.V. LISTENING' : systemState === 'PROCESSING' ? 'H.O.L.M.E.V. PROCESSING' : 'H.O.L.M.E.V. ONLINE'}
        </div>
        <div className="font-rajdhani text-[10px] font-semibold text-cyber-light/60 tracking-[3px] mt-1 uppercase">
          {overkillMode ? 'SYSTEM STATE: FULL OVERCLOCK' : systemState === 'LISTENING' ? 'CAPTURING AUDIO MATRIX' : systemState === 'PROCESSING' ? 'COMPUTING SYMBOLS' : 'SYSTEM STATUS: STANDING BY'}
        </div>
      </div>
      
    </div>
  );
};
