import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, OrbitControls, Sparkles, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useControls } from 'leva';
import { Link } from 'react-router-dom';

function AbstractArt({ position, rotation, floatSpeed, floatRange, rotationIntensity, geometry, color }: any) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    // Use the controls to override/multiply the base animation if not using Float directly,
    // or just let Float handle it and we pass the props.
  });

  return (
    <Float
      speed={floatSpeed} // Animation speed
      rotationIntensity={rotationIntensity} // XYZ rotation intensity
      floatIntensity={floatRange} // Up/down float intensity
      floatingRange={[-floatRange, floatRange]}
    >
      <mesh position={position} rotation={rotation} ref={meshRef} castShadow receiveShadow>
        <primitive object={geometry} attach="geometry" />
        <MeshTransmissionMaterial 
          backside 
          samples={4} 
          thickness={0.5} 
          chromaticAberration={1} 
          anisotropy={0.3} 
          distortion={0.5} 
          distortionScale={0.5} 
          temporalDistortion={0.1} 
          iridescence={1} 
          iridescenceIOR={1} 
          iridescenceThicknessRange={[0, 1400]} 
          color={color}
        />
      </mesh>
    </Float>
  );
}

function Scene() {
  const { floatSpeed, rotationIntensity, floatRange, particleCount, lightIntensity, glowColor } = useControls('Anti-Gravity Physics', {
    floatSpeed: { value: 2, min: 0.1, max: 10, step: 0.1 },
    rotationIntensity: { value: 1.5, min: 0, max: 10, step: 0.1 },
    floatRange: { value: 2, min: 0.1, max: 5, step: 0.1 },
    particleCount: { value: 150, min: 10, max: 500, step: 10 },
    lightIntensity: { value: 1.2, min: 0, max: 5, step: 0.1 },
    glowColor: '#B85C7A',
  });

  const geometries = useMemo(() => [
    new THREE.TorusKnotGeometry(0.8, 0.2, 128, 32),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.IcosahedronGeometry(1.2, 0),
    new THREE.ConeGeometry(0.8, 2, 32),
    new THREE.TorusGeometry(1, 0.4, 32, 64)
  ], []);

  const items = useMemo(() => {
    const colors = ['#E86F3A', '#B85C7A', '#F6A15A', '#C77D8D', '#F8FAFC'];
    return Array.from({ length: 8 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ] as [number, number, number],
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ] as [number, number, number],
      geometry: geometries[Math.floor(Math.random() * geometries.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [geometries]);

  return (
    <>
      <ambientLight intensity={lightIntensity * 0.4} />
      <directionalLight position={[10, 10, 5]} intensity={lightIntensity} color={glowColor} />
      <pointLight position={[-10, -10, -5]} intensity={lightIntensity * 0.8} color="#F6A15A" />
      
      <Sparkles count={particleCount} scale={15} size={2} speed={0.4} opacity={0.6} color="#ffffff" noise={Array.from({ length: particleCount }).map(() => Math.random()) as unknown as number} />
      <Sparkles count={particleCount / 2} scale={20} size={4} speed={0.2} opacity={0.3} color={glowColor} noise={Array.from({ length: particleCount / 2 }).map(() => Math.random()) as unknown as number} />
      
      {items.map((item, i) => (
        <AbstractArt
          key={i}
          position={item.position}
          rotation={item.rotation}
          geometry={item.geometry}
          color={item.color}
          floatSpeed={floatSpeed}
          floatRange={floatRange}
          rotationIntensity={rotationIntensity}
        />
      ))}

      <Environment preset="city" />
      <OrbitControls makeDefault enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

export default function AntiGravityPrototype() {
  return (
    <div className="w-full h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <h1 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Anti-Gravity Art Void
          </h1>
          <p className="text-foreground/60 mt-1">Prototype parameter tuning for 3D physics</p>
        </div>
        <Link to="/" className="px-6 py-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-foreground font-medium backdrop-blur-md transition-all">
          Back to Home
        </Link>
      </div>

      <Canvas 
        camera={{ position: [0, 0, 12], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#05090F']} />
        <fog attach="fog" args={['#05090F', 5, 20]} />
        <Scene />
      </Canvas>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none z-10">
        <div className="px-6 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md text-foreground/80 text-sm">
          Use the control panel to tweak physics
        </div>
        <div className="px-6 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md text-foreground/80 text-sm">
          Drag to rotate camera
        </div>
      </div>
    </div>
  );
}
