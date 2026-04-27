import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, SpotLight, Stars, Trail, Float, Sparkles } from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// ─── BACKGROUND VOLUMETRICS ──────────────────────────────────────────────────
const VolumetricBackgrounds = () => {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4, 10, -3),
      new THREE.Vector3(-3.5, 5, -2),
      new THREE.Vector3(-4.5, 0, -4),
      new THREE.Vector3(-3, -5, -3),
      new THREE.Vector3(-5, -10, -5),
      new THREE.Vector3(-3.5, -15, -4),
      new THREE.Vector3(-4.5, -20, -3),
      new THREE.Vector3(-3, -25, -5),
      new THREE.Vector3(-4, -30, -3),
    ], false, 'catmullrom', 0.5);
  }, []);

  return (
    <group>
      {/* Serpentine stream of glowing peach fluid (Left Side) */}
      <mesh>
        <tubeGeometry args={[curve, 200, 0.4, 16, false]} />
        <meshPhysicalMaterial 
          color="#ffdab9" 
          emissive="#d97706" 
          emissiveIntensity={1.2} 
          transmission={0.8} 
          transparent opacity={0.6} 
          roughness={0.3} 
          clearcoat={1} 
        />
      </mesh>

      {/* Kinetic Golden Dust (Right Side) */}
      <Sparkles count={800} scale={[2, 30, 2]} position={[4, -10, -2]} color="#fbbf24" size={4} speed={0.4} opacity={0.6} noise={0.2} />
    </group>
  );
};

// ─── PANEL 1: Top-Left (Dancer) ───────────────────────────────────────────────
const GoldenDancer = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(t * 0.8) * 0.3;
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.z = Math.sin(t * 0.4) * 0.1;
    }
  });

  return (
    <group position={[-2.5, 0, -4]}>
      <Trail width={2} length={10} color={new THREE.Color('#fbbf24')} attenuation={(t) => t * t}>
        <mesh ref={meshRef}>
          <coneGeometry args={[0.5, 2.5, 32]} />
          <meshPhysicalMaterial color="#333333" emissive="#111111" roughness={0.2} metalness={0.9} />
        </mesh>
      </Trail>
    </group>
  );
};

// ─── PANEL 2: Top-Middle (Kinetic Swirl) ──────────────────────────────────────
const KineticSwarm = () => {
  return (
    <group position={[0, -1, -5]}>
      <Sparkles count={400} scale={[2, 2, 2]} color="#fcd34d" size={6} speed={1.5} opacity={0.8} />
    </group>
  );
};

// ─── PANEL 3 & 7: Masks (Top-Right / Bottom-Left) ─────────────────────────────
const DramaMasks = ({ position }: { position: [number, number, number] }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
      groupRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1} position={position}>
      <group ref={groupRef}>
        {/* Comedy (Blue) */}
        <mesh position={[0.5, 0.2, 0.2]} rotation={[0, 0.2, 0]}>
          <torusGeometry args={[0.7, 0.15, 32, 64]} />
          <meshPhysicalMaterial color="#2563eb" emissive="#1e3a8a" roughness={0.1} metalness={0.8} />
        </mesh>
        {/* Tragedy (Gold) */}
        <mesh position={[-0.5, -0.2, -0.2]} rotation={[0, -0.2, 0]}>
          <torusGeometry args={[0.7, 0.15, 32, 64]} />
          <meshPhysicalMaterial color="#fbbf24" emissive="#b45309" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>
    </Float>
  );
};

// ─── PANEL 5: Middle-Middle (Music Explosion) ─────────────────────────────────
const MusicExplosion = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  return (
    <group position={position} scale={scale} ref={groupRef}>
      {/* Box (Speaker/Wood) */}
      <mesh position={[2, 1, -1]} rotation={[Math.PI/4, Math.PI/4, 0]}>
        <boxGeometry args={[1, 1.5, 1]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Cylinder (Brass Horn) */}
      <mesh position={[-2, -1, 1]} rotation={[1, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.6, 2, 32]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Piano Keys */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-1 + i*0.4, 0.5 - i*0.2, 1.5]} rotation={[0.2, i*0.1, 0.1]}>
          <boxGeometry args={[0.2, 1, 0.05]} />
          <meshStandardMaterial color={i === 2 || i === 4 ? "#111111" : "#ffffff"} />
        </mesh>
      ))}
      <mesh position={[0, -1.5, -0.5]} rotation={[0.2, 0.2, 0]}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial color="#444444" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
};

// ─── MAIN OVERLAY ARCHITECTURE ────────────────────────────────────────────────
export default function FluidCanvas() {
  const masterGroupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // The grid is 3 rows (100vh each) so 300vh total.
    // The master group moves UP by exactly 20 units to parallel the DOM scrolling.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      },
    });

    tl.to(masterGroupRef.current!.position, {
      y: 20, 
      ease: "none",
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(s => s.kill());
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        backgroundColor: "#050505" // Charcoal Black volumetric void
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <color attach="background" args={['#050505']} />
        
        {/* Background Depth particles */}
        <Stars radius={100} depth={50} count={4000} factor={3} saturation={0} fade speed={0.5} />

        <ambientLight intensity={0.5} color="#ffffff" />
        <SpotLight position={[10, 10, 10]} angle={0.4} penumbra={1} intensity={6} color="#fcd34d" castShadow />
        <SpotLight position={[-10, 0, 10]} angle={0.6} penumbra={1} intensity={4} color="#3b82f6" />
        <pointLight position={[0, -5, 5]} color="#ff7edb" intensity={2} />
        
        <Environment preset="night" />
        
        <group ref={masterGroupRef}>
          {/* Global side elements spanning height */}
          <VolumetricBackgrounds />
          
          {/* Top Row (y = 0) */}
          <GoldenDancer />            {/* Top-Left */}
          <KineticSwarm />            {/* Top-Middle */}
          <DramaMasks position={[3, -1, -5]} /> {/* Top-Right */}
          
          {/* Middle Row (y = -10) */}
          {/* UI cards are in Middle-Left DOM so we leave X<0 mostly clear */}
          <MusicExplosion position={[0, -10, -3]} /> {/* Middle-Middle */}
          
          {/* Bottom Row (y = -20) */}
          <DramaMasks position={[-3, -20, -5]} /> {/* Bottom-Left */}
          {/* Fluid Path Close up dominates Bottom-Middle via the continuous curve */}
          <MusicExplosion position={[3, -21, -4]} scale={0.6} /> {/* Bottom-Right */}
        </group>
      </Canvas>
    </div>
  );
}
