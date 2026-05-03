import React, { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, ContactShadows } from "@react-three/drei";

// ── THE PREMIUM FLUID CORE : ELEGANT, GLASSY, LAG-FREE ──
function ElegantCrystal({ isAuthPage = false, isHomePage = false }: { isAuthPage?: boolean; isHomePage?: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const stageScale = isHomePage ? 1.12 : 1;

  // Directly lerping off window.scrollY inside useFrame ensures 60/120fps sync
  // Completely bypasses GSAP and React DOM thread lag for scroll interactions.
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
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
      let finalX = 0;

      if (isAuthPage) {
        finalX = 2.5; // Shift right for auth forms
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
            <torusKnotGeometry args={[1.5, 0.5, 128, 32]} />
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
              attenuationColor="#F8C2A3"
              attenuationDistance={2.4}
              emissive="#ffffff"
              emissiveIntensity={0.08}
            />
          </mesh>
          
          {/* Inner Solid Colorful Core */}
          <mesh ref={coreRef}>
             <icosahedronGeometry args={[1, 5]} />
             <meshStandardMaterial 
                color="#B85C7A"
                emissive="#E86F3A"
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
            <meshStandardMaterial color="#F6A15A" emissive="#B85C7A" emissiveIntensity={0.35} transparent opacity={0.42} />
          </mesh>
        </Float>
      ) : null}

      {/* Elegant minimalist orbital ring to frame the shape without messiness */}
      <Float speed={1.5} rotationIntensity={1} floatIntensity={0.5}>
         <mesh scale={3} rotation={[Math.PI/3, 0, 0]}>
            <torusGeometry args={[1, 0.002, 32, 100]} />
            <meshStandardMaterial color="#E86F3A" emissive="#F6A15A" emissiveIntensity={0.8} />
         </mesh>
      </Float>
      
      {/* Baked-style fast shadow to root the object */}
      <ContactShadows position={[0, -4, 0]} opacity={0.3} scale={15} blur={2} far={10} color="#05090F" />
    </group>
  );
}

export default function GlobalVoidCanvas({ isAuthPage = false, isHomePage = false }: { isAuthPage?: boolean; isHomePage?: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background: isHomePage
          ? "linear-gradient(135deg, #FFF7F2 0%, #FBEEF2 42%, #F8FAFC 100%)"
          : "var(--app-background)",
      }}
      aria-hidden="true"
    >
      {isHomePage ? (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(120deg, rgba(255,255,255,0.58), rgba(255,255,255,0.18) 46%, rgba(255,255,255,0.48)), radial-gradient(circle at 52% 45%, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.10) 34%, transparent 58%)",
              boxShadow:
                "inset 0 0 120px rgba(184,92,122,0.12), inset 0 -130px 180px rgba(232,111,58,0.12), inset 0 90px 140px rgba(255,255,255,0.68)",
            }}
          />
        </>
      ) : null}
      {/* Ambient colorful glossy glows */}
      <div 
        className={`absolute inset-0 ${isHomePage ? "opacity-90" : "opacity-70"} mix-blend-multiply pointer-events-none`}
        style={{
          background: isHomePage
            ? "radial-gradient(circle at 78% 18%, rgba(232, 111, 58, 0.30) 0%, transparent 48%), radial-gradient(circle at 18% 78%, rgba(184, 92, 122, 0.24) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(246, 154, 94, 0.18) 0%, transparent 62%)"
            : "radial-gradient(circle at 80% 20%, rgba(232, 111, 58, 0.22) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(184, 92, 122, 0.18) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(246, 154, 94, 0.10) 0%, transparent 60%)",
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
        // Limiting DPR to 1-1.5 handles scrolling lag completely, even with glassmorphism
        dpr={[1, Math.min(1.5, window.devicePixelRatio)]}
      >
        {/* Lights */}
        <ambientLight intensity={isHomePage ? 1.65 : 1.5} color="#ffffff" />
        <directionalLight position={[5, 10, 5]} intensity={isHomePage ? 1.25 : 1} color="#ffffff" />
        <directionalLight position={[-5, -5, -5]} intensity={isHomePage ? 0.75 : 0.5} color="#B85C7A" />
        <pointLight position={[0, 0, 0]} color="#E86F3A" intensity={isHomePage ? 2.8 : 2} distance={15} />

        {/* City environment brings out the premium reflections in the glass */}
        <Environment preset="city" />

        <React.Suspense fallback={null}>
          <ElegantCrystal isAuthPage={isAuthPage} isHomePage={isHomePage} />
        </React.Suspense>
      </Canvas>
    </div>
  );
}
