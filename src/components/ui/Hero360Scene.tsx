import { useRef, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";
import heroPanorama from "@/assets/hero-panorama.jpg";

// Rotating panoramic sphere component
const PanoramaSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, heroPanorama);

  // Configure texture for proper panoramic wrapping
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  // Slow, smooth rotation animation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05; // Very slow rotation
    }
  });

  return (
    <Sphere ref={meshRef} args={[500, 64, 64]} scale={[-1, 1, 1]}>
      <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
    </Sphere>
  );
};

// Loading fallback
const LoadingFallback = () => (
  <mesh>
    <sphereGeometry args={[500, 32, 32]} />
    <meshBasicMaterial color="#0a0a0a" side={THREE.BackSide} />
  </mesh>
);

const Hero360Scene = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ 
          fov: 75, 
          position: [0, 0, 0.1],
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <PanoramaSphere />
        </Suspense>
        {/* Subtle ambient light for atmosphere */}
        <ambientLight intensity={0.5} />
      </Canvas>
    </div>
  );
};

export default Hero360Scene;
