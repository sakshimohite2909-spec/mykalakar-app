import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, ContactShadows } from "@react-three/drei";

// ── THE PREMIUM FLUID CORE : ELEGANT, GLASSY, LAG-FREE ──
function ElegantCrystal({ isAuthPage = false, isHomePage = false }: { isAuthPage?: boolean; isHomePage?: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const stageScale = isHomePage || isAuthPage ? 0.84 : 1;

  const timer = useMemo(() => new THREE.Timer(), []);

  // Directly lerping off window.scrollY inside useFrame ensures 60/120fps sync
  // Completely bypasses GSAP and React DOM thread lag for scroll interactions.
  useFrame((state, delta) => {
    timer.update();
    const t = timer.getElapsed();
    const scrollY = window.scrollY;

    if (meshRef.current) {
      // Silky smooth base rotation
      meshRef.current.rotation.x = t * 0.1;
      meshRef.current.rotation.y = t * 0.15;
      
      // Fluid roll-down effect synced purely to scroll
      // "make it look smooth as i scroll down it should roll down smoothly with fluidity"
      const targetZ = scrollY * -0.0015;
      const targetY = scrollY * -0.002;
      
      // Dampening gives it that high-end, heavy fluid feel
      meshRef.current.rotation.z = THREE.MathUtils.damp(meshRef.current.rotation.z, targetZ, 4, delta);
      
      // Target position
      let finalY = targetY;
      let finalX = isHomePage ? 2.35 : 0;

      if (isAuthPage) {
        finalX = -1.65; // Keep the glass form readable on split auth pages
      }

      meshRef.current.position.y = THREE.MathUtils.damp(meshRef.current.position.y, finalY, 4, delta);
      meshRef.current.position.x = THREE.MathUtils.damp(meshRef.current.position.x, finalX, 4, delta);
    }

    // Inner core rotates in opposition layer
    if (coreRef.current) {
      coreRef.current.rotation.x = t * -0.15;
      coreRef.current.rotation.y = t * -0.25;
    }
  });

  return (
    <group scale={stageScale}>
      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.2} floatingRange={[-0.3, 0.3]}>
        <group ref={meshRef}>
          {/* Main Glass Outer Body - Premium polished transmission */}
          <mesh>
            <torusKnotGeometry args={[1.5, 0.5, isAuthPage ? 72 : 96, isAuthPage ? 18 : 24]} />
            <meshPhysicalMaterial 
              color="#ffffff"
              roughness={0.02}
              metalness={0.1}
              transmission={1}
              ior={1.4}
              thickness={1.5}
              clearcoat={1}
              clearcoatRoughness={0}
              envMapIntensity={1.8}
              attenuationColor="#8BDFFF"
              attenuationDistance={2.4}
              emissive="#ffffff"
              emissiveIntensity={0.08}
            />
          </mesh>
          
          {/* Inner Solid Colorful Core */}
          <mesh ref={coreRef}>
             <icosahedronGeometry args={[1, isAuthPage ? 3 : 4]} />
             <meshStandardMaterial 
                color="#7C3CFF"
                emissive="#22D3EE"
                emissiveIntensity={0.5}
                roughness={0.1}
                metalness={0.9}
             />
          </mesh>
        </group>
      </Float>

      {isHomePage ? (
        <Float speed={1.15} rotationIntensity={0.3} floatIntensity={0.35}>
          <mesh scale={4.6} rotation={[Math.PI / 2.8, 0, Math.PI / 8]}>
            <torusGeometry args={[1, 0.006, 48, 160]} />
            <meshStandardMaterial color="#6EE7FF" emissive="#FF4ECD" emissiveIntensity={0.35} transparent opacity={0.38} />
          </mesh>
        </Float>
      ) : null}

      {/* Elegant minimalist orbital ring to frame the shape without messiness */}
      <Float speed={1.5} rotationIntensity={1} floatIntensity={0.5}>
         <mesh scale={3} rotation={[Math.PI/3, 0, 0]}>
            <torusGeometry args={[1, 0.002, 32, 100]} />
            <meshStandardMaterial color="#FFB86B" emissive="#7C3CFF" emissiveIntensity={0.8} />
         </mesh>
      </Float>
      
      {/* Baked-style fast shadow to root the object */}
      <ContactShadows position={[0, -4, 0]} opacity={0.3} scale={15} blur={2} far={10} color="#05090F" />
    </group>
  );
}

export default function GlobalVoidCanvas({ isAuthPage = false, isHomePage = false }: { isAuthPage?: boolean; isHomePage?: boolean }) {
  const maxDpr = isAuthPage ? 1 : Math.min(1.35, window.devicePixelRatio);

  return (
    <div
      className="cinematic-void-canvas"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        background: "transparent",
      }}
      aria-hidden="true"
    >
      {isHomePage ? (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(120deg, rgba(255,255,255,0.12), rgba(110,231,255,0.08) 46%, rgba(255,78,205,0.09)), conic-gradient(from 220deg at 52% 45%, transparent 0 35%, rgba(255,255,255,0.10) 42%, transparent 56%, rgba(255,184,107,0.08) 68%, transparent 82%)",
              boxShadow:
                "inset 0 0 120px rgba(124,60,255,0.12), inset 0 -130px 180px rgba(34,211,238,0.10), inset 0 90px 140px rgba(255,255,255,0.05)",
            }}
          />
        </>
      ) : null}
      {/* Ambient colorful glossy glows */}
      <div 
        className={`absolute inset-0 ${isHomePage ? "opacity-90" : "opacity-70"} mix-blend-multiply pointer-events-none`}
        style={{
          background: isHomePage
            ? "linear-gradient(115deg, rgba(34,211,238,0.10), transparent 38%, rgba(124,60,255,0.12) 58%, transparent 78%), conic-gradient(from 180deg at 50% 50%, rgba(255,78,205,0.10), transparent 22%, rgba(255,184,107,0.07), transparent 62%, rgba(110,231,255,0.09), transparent)"
            : "linear-gradient(115deg, rgba(34,211,238,0.08), transparent 38%, rgba(124,60,255,0.10) 58%, transparent 78%), conic-gradient(from 180deg at 50% 50%, rgba(255,78,205,0.08), transparent 22%, rgba(255,184,107,0.06), transparent 62%, rgba(110,231,255,0.07), transparent)",
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        dpr={[1, maxDpr]}
      >
        {/* Lights */}
        <ambientLight intensity={isHomePage ? 1.65 : 1.5} color="#ffffff" />
        <directionalLight position={[5, 10, 5]} intensity={isHomePage ? 1.25 : 1} color="#ffffff" />
        <directionalLight position={[-5, -5, -5]} intensity={isHomePage ? 0.75 : 0.5} color="#7C3CFF" />
        <pointLight position={[0, 0, 0]} color="#22D3EE" intensity={isHomePage ? 2.8 : 2} distance={15} />

        {/* City environment brings out the premium reflections in the glass */}
        <Environment preset="city" />

        <React.Suspense fallback={null}>
          <ElegantCrystal isAuthPage={isAuthPage} isHomePage={isHomePage} />
        </React.Suspense>
      </Canvas>
    </div>
  );
}
