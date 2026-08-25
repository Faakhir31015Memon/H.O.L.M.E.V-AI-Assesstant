import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useSystem } from '../context/SystemContext';

/* ================================================
   SEGMENTED RING - Creates a flat ring with gaps
   (like JARVIS arc reactor segments)
   ================================================ */
interface SegmentedRingProps {
  radius: number;
  tubeRadius: number;
  segments: number;
  gapRatio: number;
  color: string;
  emissiveIntensity: number;
  rotationAxis: 'x' | 'y' | 'z';
  speed: number;
  tiltX?: number;
  tiltZ?: number;
  opacity?: number;
}

const SegmentedRing: React.FC<SegmentedRingProps> = ({
  radius, tubeRadius, segments, gapRatio, color,
  emissiveIntensity, rotationAxis, speed, tiltX = 0, tiltZ = 0, opacity = 1
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { systemState, overkillMode } = useSystem();

  useFrame((state) => {
    if (!groupRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    
    let speedMult = 1.0;
    if (systemState === 'LISTENING') speedMult = 3.0;
    if (systemState === 'PROCESSING') speedMult = 6.0;
    if (overkillMode) speedMult *= 2.0;

    groupRef.current.rotation[rotationAxis] = elapsed * speed * speedMult;
  });

  // Create arc segments with gaps
  const arcs = useMemo(() => {
    const arcAngle = (Math.PI * 2 / segments) * (1 - gapRatio);
    const totalAngle = Math.PI * 2 / segments;
    const result = [];
    
    for (let i = 0; i < segments; i++) {
      const startAngle = i * totalAngle;
      result.push(
        <mesh key={i} rotation={[0, 0, startAngle]}>
          <torusGeometry args={[radius, tubeRadius, 4, 32, arcAngle]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            transparent
            opacity={opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      );
    }
    return result;
  }, [radius, tubeRadius, segments, gapRatio, color, emissiveIntensity, opacity]);

  return (
    <group ref={groupRef} rotation={[tiltX, 0, tiltZ]}>
      {arcs}
    </group>
  );
};

/* ================================================
   SOLID RING - Continuous thin glowing ring
   ================================================ */
interface SolidRingProps {
  radius: number;
  tubeRadius: number;
  color: string;
  emissiveIntensity: number;
  rotationAxis: 'x' | 'y' | 'z';
  speed: number;
  tiltX?: number;
  tiltZ?: number;
  opacity?: number;
}

const SolidRing: React.FC<SolidRingProps> = ({
  radius, tubeRadius, color, emissiveIntensity,
  rotationAxis, speed, tiltX = 0, tiltZ = 0, opacity = 1
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { systemState, overkillMode } = useSystem();

  useFrame((state) => {
    if (!meshRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    let speedMult = 1.0;
    if (systemState === 'LISTENING') speedMult = 3.0;
    if (systemState === 'PROCESSING') speedMult = 6.0;
    if (overkillMode) speedMult *= 2.0;
    meshRef.current.rotation[rotationAxis] = elapsed * speed * speedMult;
  });

  return (
    <mesh ref={meshRef} rotation={[tiltX, 0, tiltZ]}>
      <torusGeometry args={[radius, tubeRadius, 8, 128]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

/* ================================================
   PULSATING CORE - Glowing reactor center
   ================================================ */
const ReactorCore: React.FC = () => {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const { systemState, overkillMode } = useSystem();

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    let pulseFreq = 1.5, pulseAmp = 0.06;

    if (systemState === 'LISTENING') { pulseFreq = 6.0; pulseAmp = 0.18; }
    if (systemState === 'PROCESSING') { pulseFreq = 12.0; pulseAmp = 0.1; }
    if (overkillMode) { pulseFreq *= 1.5; }

    const pulse = 1.0 + Math.sin(elapsed * pulseFreq) * pulseAmp;
    const glowPulse = 1.0 + Math.sin(elapsed * pulseFreq * 0.7) * pulseAmp * 2;
    
    if (coreRef.current) {
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
    if (glowRef.current) {
      glowRef.current.scale.set(glowPulse, glowPulse, glowPulse);
    }
    if (outerGlowRef.current) {
      const outerPulse = 1.0 + Math.sin(elapsed * pulseFreq * 0.4 + 1) * pulseAmp * 3;
      outerGlowRef.current.scale.set(outerPulse, outerPulse, outerPulse);
    }
  });

  const coreColor = overkillMode ? '#ff3c00' : '#00f3ff';
  const coreIntensity = systemState === 'LISTENING' ? 8 : systemState === 'PROCESSING' ? 12 : 5;

  return (
    <group>
      {/* Inner bright core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={coreColor}
          emissiveIntensity={coreIntensity}
        />
      </mesh>

      {/* Middle glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.45, 24, 24]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={3}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Outer ambient glow */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={1.5}
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* Point light from core */}
      <pointLight
        color={coreColor}
        intensity={systemState === 'PROCESSING' ? 4 : systemState === 'LISTENING' ? 3 : 1.5}
        distance={6}
        decay={2}
      />
    </group>
  );
};

/* ================================================
   MAIN 3D SCENE - All rings + core + particles
   ================================================ */
const ReactorScene: React.FC = () => {
  const { systemState, overkillMode } = useSystem();
  
  const cyan = overkillMode ? '#ff3c00' : '#00f3ff';
  const blue = overkillMode ? '#ffb700' : '#0055ff';
  const dimCyan = overkillMode ? '#ff5500' : '#00a8cc';

  const particleCount = systemState === 'PROCESSING' ? 150 : systemState === 'LISTENING' ? 80 : 35;
  const particleSpeed = systemState === 'PROCESSING' ? 5 : systemState === 'LISTENING' ? 2.5 : 0.5;
  const particleColor = overkillMode ? '#ff5500' : systemState === 'PROCESSING' ? '#ffb700' : '#00f3ff';

  return (
    <>
      <ambientLight intensity={0.08} />

      {/* === RING LAYER 1: Outermost - Large thin ring, slow === */}
      <SolidRing 
        radius={2.4} tubeRadius={0.008} color={dimCyan}
        emissiveIntensity={2} rotationAxis="y" speed={0.08}
        tiltX={0.15} opacity={0.5}
      />

      {/* === RING LAYER 2: Outer segmented - 8 segments === */}
      <SegmentedRing
        radius={2.15} tubeRadius={0.015} segments={8} gapRatio={0.3}
        color={cyan} emissiveIntensity={4} rotationAxis="y" speed={0.15}
        tiltX={Math.PI / 5} opacity={0.8}
      />

      {/* === RING LAYER 3: Mid-outer dashed === */}
      <SegmentedRing
        radius={1.85} tubeRadius={0.025} segments={12} gapRatio={0.25}
        color={blue} emissiveIntensity={3} rotationAxis="y" speed={-0.22}
        tiltX={Math.PI / 7} tiltZ={0.1} opacity={0.7}
      />

      {/* === RING LAYER 4: Mid ring - thicker, fewer segments === */}
      <SegmentedRing
        radius={1.55} tubeRadius={0.035} segments={6} gapRatio={0.2}
        color={cyan} emissiveIntensity={5} rotationAxis="y" speed={0.3}
        tiltX={Math.PI / 4} tiltZ={-0.15} opacity={0.85}
      />

      {/* === RING LAYER 5: Inner ring - solid thin === */}
      <SolidRing
        radius={1.25} tubeRadius={0.012} color={dimCyan}
        emissiveIntensity={3} rotationAxis="y" speed={-0.18}
        tiltX={Math.PI / 3} opacity={0.6}
      />

      {/* === RING LAYER 6: Inner teeth - thick segmented === */}
      <SegmentedRing
        radius={1.0} tubeRadius={0.05} segments={16} gapRatio={0.35}
        color={cyan} emissiveIntensity={4} rotationAxis="y" speed={0.4}
        tiltX={Math.PI / 6} tiltZ={0.2} opacity={0.9}
      />

      {/* === RING LAYER 7: Innermost ring === */}
      <SolidRing
        radius={0.75} tubeRadius={0.01} color={blue}
        emissiveIntensity={3.5} rotationAxis="y" speed={-0.35}
        tiltX={Math.PI / 8} opacity={0.5}
      />

      {/* === REACTOR CORE === */}
      <ReactorCore />

      {/* === SPARKLE PARTICLES === */}
      <Sparkles
        count={particleCount}
        scale={3.5}
        size={3}
        speed={particleSpeed}
        color={particleColor}
      />

      {/* === BLOOM POST-PROCESSING === */}
      <EffectComposer>
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
};

/* ================================================
   SVG HUD OVERLAY - Tick marks, dashed rings, labels
   ================================================ */
const HudOverlay: React.FC = () => {
  const { overkillMode } = useSystem();
  const color = overkillMode ? '#ff3c00' : '#00f3ff';
  const dimColor = overkillMode ? 'rgba(255,60,0,0.15)' : 'rgba(0,243,255,0.12)';
  const midColor = overkillMode ? 'rgba(255,60,0,0.25)' : 'rgba(0,243,255,0.2)';

  // Generate tick marks around outer ring
  const ticks = useMemo(() => {
    const result = [];
    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * Math.PI * 2 - Math.PI / 2;
      const isMajor = i % 9 === 0;
      const r1 = isMajor ? 138 : 142;
      const r2 = 148;
      const x1 = 150 + Math.cos(angle) * r1;
      const y1 = 150 + Math.sin(angle) * r1;
      const x2 = 150 + Math.cos(angle) * r2;
      const y2 = 150 + Math.sin(angle) * r2;

      result.push(
        <line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={isMajor ? color : dimColor}
          strokeWidth={isMajor ? 1 : 0.5}
          opacity={isMajor ? 0.8 : 0.4}
        />
      );
    }
    return result;
  }, [color, dimColor]);

  // Degree labels at cardinal positions
  const degreeLabels = useMemo(() => {
    const labels = ['000°', '090°', '180°', '270°'];
    const positions = [
      { x: 150, y: 12 },
      { x: 288, y: 153 },
      { x: 150, y: 294 },
      { x: 12, y: 153 },
    ];
    return labels.map((label, i) => (
      <text
        key={label}
        x={positions[i].x}
        y={positions[i].y}
        fill={color}
        fontSize="7"
        fontFamily="'Share Tech Mono', monospace"
        textAnchor="middle"
        opacity={0.5}
      >
        {label}
      </text>
    ));
  }, [color]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      viewBox="0 0 300 300"
      style={{ zIndex: 15 }}
    >
      {/* Outermost decorative ring */}
      <circle cx="150" cy="150" r="148" fill="none" stroke={dimColor} strokeWidth="0.5" />
      
      {/* Tick marks */}
      {ticks}
      
      {/* Degree labels */}
      {degreeLabels}
      
      {/* Dashed mid ring */}
      <circle cx="150" cy="150" r="130" fill="none" stroke={midColor} strokeWidth="0.8" strokeDasharray="15 8 4 8" />
      
      {/* Inner boundary rings */}
      <circle cx="150" cy="150" r="110" fill="none" stroke={dimColor} strokeWidth="0.5" strokeDasharray="30 15 5 15" />
      <circle cx="150" cy="150" r="88" fill="none" stroke={dimColor} strokeWidth="0.5" />
      
      {/* Crosshair lines */}
      <line x1="150" y1="20" x2="150" y2="60" stroke={dimColor} strokeWidth="0.5" />
      <line x1="150" y1="240" x2="150" y2="280" stroke={dimColor} strokeWidth="0.5" />
      <line x1="20" y1="150" x2="60" y2="150" stroke={dimColor} strokeWidth="0.5" />
      <line x1="240" y1="150" x2="280" y2="150" stroke={dimColor} strokeWidth="0.5" />

      {/* Corner data readouts */}
      <text x="28" y="36" fill={color} fontSize="6" fontFamily="'Share Tech Mono', monospace" opacity={0.35}>
        ARC.CORE.v9
      </text>
      <text x="230" y="36" fill={color} fontSize="6" fontFamily="'Share Tech Mono', monospace" opacity={0.35}>
        SYNC: 0.9998
      </text>
      <text x="28" y="278" fill={color} fontSize="6" fontFamily="'Share Tech Mono', monospace" opacity={0.35}>
        θ VECTOR LOCK
      </text>
      <text x="218" y="278" fill={color} fontSize="6" fontFamily="'Share Tech Mono', monospace" opacity={0.35}>
        PHASE: NOMINAL
      </text>
    </svg>
  );
};

/* ================================================
   CANVAS CIRCULAR WAVEFORM - Audio-reactive ring
   ================================================ */
const CircularWaveform: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { systemState, overkillMode } = useSystem();
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const time = performance.now() / 1000;

    ctx.clearRect(0, 0, w, h);

    const points = overkillMode ? 160 : 120;
    const baseRadius = w * 0.33;

    let waveNoise = 3;
    let speedScale = 1.0;
    let complexity = 5;

    if (systemState === 'LISTENING') {
      waveNoise = 22; speedScale = 4.0; complexity = 8;
    } else if (systemState === 'PROCESSING') {
      waveNoise = 14; speedScale = 8.0; complexity = 18;
    }
    if (overkillMode) { waveNoise *= 1.3; speedScale *= 1.4; }

    // Generate wave path points
    const pathPoints: { x: number; y: number; r: number; theta: number }[] = [];
    for (let i = 0; i < points; i++) {
      const theta = (i / points) * Math.PI * 2;
      let offset = Math.sin(theta * complexity + time * 3.5 * speedScale) * waveNoise * 0.5;
      offset += Math.cos(theta * (complexity / 2) - time * 2.2 * speedScale) * waveNoise * 0.3;
      offset += Math.sin(theta * (complexity * 2) + time * 6 * speedScale) * waveNoise * 0.2;

      if (systemState === 'LISTENING') {
        offset += (Math.random() - 0.5) * 6;
      }

      const r = baseRadius + offset;
      pathPoints.push({
        x: cx + Math.cos(theta) * r,
        y: cy + Math.sin(theta) * r,
        r, theta
      });
    }

    // Draw radiating bars
    ctx.lineWidth = 1;
    const barFrequency = overkillMode ? 3 : 2;
    for (let i = 0; i < points; i += barFrequency) {
      const p = pathPoints[i];
      const innerX = cx + Math.cos(p.theta) * (baseRadius - 15);
      const innerY = cy + Math.sin(p.theta) * (baseRadius - 15);
      const amplitude = Math.abs(p.r - baseRadius);
      const alpha = Math.min(0.6, 0.05 + (amplitude / waveNoise) * 0.5);

      ctx.strokeStyle = overkillMode
        ? `rgba(255, 183, 0, ${alpha})`
        : `rgba(0, 243, 255, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    // Draw main wave path
    ctx.strokeStyle = overkillMode ? '#ff3c00' : '#00f3ff';
    ctx.shadowColor = overkillMode ? '#ffb700' : '#0055ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < points; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Listening particles
    if (systemState === 'LISTENING') {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = baseRadius + Math.random() * 35;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 1 + Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [systemState, overkillMode]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={500}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 12 }}
    />
  );
};

/* ================================================
   EXPORTED COMPONENT - Full reactor assembly
   ================================================ */
export const HolmevCore3D: React.FC = () => {
  const { systemState, overkillMode } = useSystem();

  const statusText = overkillMode
    ? 'H.O.L.M.E.V. // OVERCLOCK'
    : systemState === 'LISTENING'
    ? 'H.O.L.M.E.V. LISTENING'
    : systemState === 'PROCESSING'
    ? 'PROCESSING LOGIC...'
    : 'H.O.L.M.E.V. ONLINE';

  const subText = overkillMode
    ? 'SYSTEM STATE: FULL OVERCLOCK'
    : systemState === 'LISTENING'
    ? 'CAPTURING AUDIO HARMONICS'
    : systemState === 'PROCESSING'
    ? 'SYNCHRONIZING VECTORS'
    : 'SYSTEM STATUS: STANDING BY';

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center min-h-[360px]">

      {/* Three.js 3D Canvas */}
      <div className="absolute inset-0" style={{ zIndex: 5 }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 55 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <ReactorScene />
        </Canvas>
      </div>

      {/* SVG HUD Overlay */}
      <HudOverlay />

      {/* Canvas Circular Waveform */}
      <CircularWaveform />

      {/* Status Text Below Core */}
      <div className="absolute bottom-3 text-center pointer-events-none select-none" style={{ zIndex: 20 }}>
        <div className={`font-orbitron font-extrabold text-sm tracking-[3px] uppercase transition-all duration-500 ${
          overkillMode 
            ? 'text-red-500 drop-shadow-[0_0_12px_rgba(255,60,0,0.8)]' 
            : 'text-cyber-cyan drop-shadow-[0_0_12px_rgba(0,243,255,0.6)]'
        }`}>
          {statusText}
        </div>
        <div className={`font-rajdhani text-[10px] font-semibold tracking-[3px] mt-1 uppercase transition-all duration-500 ${
          overkillMode ? 'text-red-400/60' : 'text-cyber-cyan/50'
        }`}>
          {subText}
        </div>
      </div>

    </div>
  );
};
