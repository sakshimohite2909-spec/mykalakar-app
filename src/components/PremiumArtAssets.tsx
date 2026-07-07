import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export const Materials = {
  Blue: new THREE.MeshPhysicalMaterial({ color: "#1e3a8a", metalness: 0.8, roughness: 0.1, clearcoat: 1 }),
  Gold: new THREE.MeshPhysicalMaterial({ color: "#fbbf24", metalness: 0.9, roughness: 0.1, clearcoat: 1 }),
  Red: new THREE.MeshPhysicalMaterial({ color: "#9f1239", metalness: 0.7, roughness: 0.2, clearcoat: 1 }),
  Ebony: new THREE.MeshPhysicalMaterial({ color: "#111111", metalness: 0.6, roughness: 0.1, clearcoat: 1 }),
  Ivory: new THREE.MeshPhysicalMaterial({ color: "#fefefe", metalness: 0.2, roughness: 0.3, clearcoat: 0.5 }),
  Wood: new THREE.MeshPhysicalMaterial({ color: "#78350f", metalness: 0.3, roughness: 0.6, clearcoat: 0.2 }),
};

export function AbstractPiano(props: any) {
  return (
    <group {...props}>
      {/* Piano Body */}
      <mesh material={Materials.Ebony} position={[0, -0.5, 0]}>
        <boxGeometry args={[3, 1, 3]} />
      </mesh>
      {/* Keyboard area */}
      <mesh material={Materials.Ivory} position={[1.6, -0.2, 0]}>
        <boxGeometry args={[0.4, 0.1, 2.8]} />
      </mesh>
      {/* Open Lid */}
      <mesh material={Materials.Ebony} position={[-0.5, 0.8, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[2.8, 0.1, 2.9]} />
      </mesh>
      {/* Lid Prop */}
      <mesh material={Materials.Gold} position={[0.5, 0.3, -1]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.02, 0.02, 1]} />
      </mesh>
    </group>
  );
}

export function AbstractViolin(props: any) {
  return (
    <group {...props}>
      {/* Body upper */}
      <mesh material={Materials.Wood} position={[0, 0.6, 0]} scale={[1, 1, 0.3]}>
        <cylinderGeometry args={[0.8, 0.8, 0.2, 32]} />
      </mesh>
      {/* Body lower */}
      <mesh material={Materials.Wood} position={[0, -0.6, 0]} scale={[1, 1, 0.3]}>
        <cylinderGeometry args={[1, 1, 0.2, 32]} />
      </mesh>
      {/* Neck */}
      <mesh material={Materials.Ebony} position={[0, 2, 0]}>
        <boxGeometry args={[0.15, 2, 0.1]} />
      </mesh>
      {/* Scroll */}
      <mesh material={Materials.Wood} position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.2]} />
      </mesh>
      {/* Bow */}
      <mesh material={Materials.Gold} position={[0.5, 0.5, 0.5]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.02, 0.02, 4]} />
      </mesh>
    </group>
  );
}

export function AbstractDrums(props: any) {
  return (
    <group {...props}>
      {/* Bass Drum */}
      <mesh material={Materials.Red} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 1, 32]} />
      </mesh>
      {/* Drum skin */}
      <mesh material={Materials.Ivory} position={[0, 0, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.45, 1.45, 0.02, 32]} />
      </mesh>
      {/* Floor Tom */}
      <mesh material={Materials.Red} position={[2, -0.5, -1]} rotation={[Math.PI / 6, 0, 0]}>
        <cylinderGeometry args={[1, 1, 1.5, 32]} />
      </mesh>
      {/* Snare */}
      <mesh material={Materials.Ivory} position={[-2, 0.5, 0.5]} rotation={[Math.PI / 8, 0, -Math.PI / 8]}>
        <cylinderGeometry args={[0.8, 0.8, 0.4, 32]} />
      </mesh>
      {/* Cymbal */}
      <mesh material={Materials.Gold} position={[-1.5, 2.5, -1]} rotation={[-Math.PI / 6, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.02, 32]} />
      </mesh>
    </group>
  );
}

export function AbstractMasks(props: any) {
  return (
    <group {...props}>
      {/* Comedy Mask */}
      <group position={[-0.8, 0, 0]} rotation={[0, Math.PI / 6, Math.PI / 12]}>
        <mesh material={Materials.Gold}>
          {/* Abstract curved face */}
          <sphereGeometry args={[1, 32, 16, 0, Math.PI, 0, Math.PI / 2]} />
        </mesh>
        {/* Smile curve */}
        <mesh material={Materials.Ebony} position={[0, -0.3, 0.9]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.4, 0.05, 16, 32, Math.PI]} />
        </mesh>
      </group>
      {/* Tragedy Mask */}
      <group position={[0.8, -0.5, -0.5]} rotation={[0, -Math.PI / 6, -Math.PI / 12]}>
        <mesh material={Materials.Ivory}>
          <sphereGeometry args={[1, 32, 16, 0, Math.PI, 0, Math.PI / 2]} />
        </mesh>
        {/* Frown curve */}
        <mesh material={Materials.Ebony} position={[0, -0.5, 0.9]} rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[0.4, 0.05, 16, 32, Math.PI]} />
        </mesh>
      </group>
    </group>
  );
}

export function BrushStroke({ pathPts, material, tubeRadius = 0.1, ...props }: any) {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(pathPts.map((p: number[]) => new THREE.Vector3(...p)));
  }, [pathPts]);

  return (
    <mesh material={material} {...props}>
      <tubeGeometry args={[curve, 64, tubeRadius, 8, false]} />
    </mesh>
  );
}

export function AbstractGuitar(props: any) {
  return (
    <group {...props}>
      {/* Body Core */}
      <mesh material={Materials.Red} position={[0, -0.6, 0]} scale={[1, 1.3, 0.3]}>
        <cylinderGeometry args={[0.8, 0.8, 0.2, 32]} />
      </mesh>
      {/* Body Upper Bout */}
      <mesh material={Materials.Wood} position={[0, 0.2, 0]} scale={[0.8, 0.8, 0.3]}>
        <cylinderGeometry args={[0.7, 0.7, 0.2, 32]} />
      </mesh>
      {/* Sound hole */}
      <mesh material={Materials.Ebony} position={[0, -0.1, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
      </mesh>
      {/* Neck */}
      <mesh material={Materials.Wood} position={[0, 1.8, 0]}>
        <boxGeometry args={[0.2, 2.4, 0.1]} />
      </mesh>
      {/* Headstock */}
      <mesh material={Materials.Ebony} position={[0, 3.2, 0]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.3, 0.6, 0.1]} />
      </mesh>
      {/* Strings (abstract metallic line) */}
      <mesh material={Materials.Gold} position={[0, 1.2, 0.06]}>
        <boxGeometry args={[0.04, 3.8, 0.01]} />
      </mesh>
    </group>
  );
}
