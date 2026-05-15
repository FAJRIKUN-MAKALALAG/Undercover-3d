import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, Html, OrbitControls } from '@react-three/drei';
import { useGameStore, Player } from '../store/useGameStore';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

function Accessory({ index }: { index: number }) {
  return (
    <group position={[0, 2.5, 0]}>
      {index === 0 && (
        <group>
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
            <meshStandardMaterial color="#ccc" roughness={0.1} metalness={0.8} transparent />
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} transparent />
          </mesh>
        </group>
      )}
      {index === 1 && (
        <mesh position={[0, -0.05, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.15, 0.2, 5]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} transparent />
        </mesh>
      )}
      {index === 2 && (
        <group position={[0, -0.4, 0]}>
          <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
            <torusGeometry args={[0.26, 0.04, 16, 32, Math.PI]} />
            <meshStandardMaterial color="#111" roughness={0.6} transparent />
          </mesh>
          <mesh position={[-0.3, 0.4, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} transparent />
          </mesh>
          <mesh position={[0.3, 0.4, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} transparent />
          </mesh>
        </group>
      )}
      {index === 3 && (
        <group position={[0, -0.1, 0.1]} rotation={[-0.1, 0, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.5} transparent />
          </mesh>
          <mesh position={[0, -0.05, 0.15]} rotation={[0.1, 0, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.5} transparent />
          </mesh>
        </group>
      )}
      {index === 4 && (
        <group position={[0, -0.05, 0.1]}>
          <mesh position={[-0.15, 0.1, 0]} rotation={[0, 0, 0.3]} castShadow>
            <coneGeometry args={[0.1, 0.25, 16]} />
            <meshStandardMaterial color="#f87171" roughness={0.4} transparent />
          </mesh>
          <mesh position={[0.15, 0.1, 0]} rotation={[0, 0, -0.3]} castShadow>
            <coneGeometry args={[0.1, 0.25, 16]} />
            <meshStandardMaterial color="#f87171" roughness={0.4} transparent />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Avatar({ player, position, angle, isActive, lastMessage }: { player: Player, position: [number, number, number], angle: number, isActive: boolean, lastMessage?: string }) {
  const characterGroup = useRef<THREE.Group>(null);
  const leftHand = useRef<THREE.Mesh>(null);
  const rightHand = useRef<THREE.Mesh>(null);
  
  const color = AVATAR_COLORS[player?.avatarIndex || 0];

  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    if (lastMessage) {
      setShowBubble(true);
      const t = setTimeout(() => setShowBubble(false), 5000);
      return () => clearTimeout(t);
    }
  }, [lastMessage]);

  useFrame((state) => {
    if (!characterGroup.current) return;
    
    const time = state.clock.elapsedTime;
    
    if (player.isEliminated) {
      // Eliminated state: fall over backwards
      characterGroup.current.rotation.x = THREE.MathUtils.lerp(characterGroup.current.rotation.x, -Math.PI / 2 + 0.2, 0.1);
      characterGroup.current.position.y = THREE.MathUtils.lerp(characterGroup.current.position.y, -1.0, 0.1);
      characterGroup.current.position.z = THREE.MathUtils.lerp(characterGroup.current.position.z, -0.6, 0.1);
      
      if (leftHand.current) leftHand.current.position.y = THREE.MathUtils.lerp(leftHand.current.position.y, 1.4, 0.1);
      if (rightHand.current) rightHand.current.position.y = THREE.MathUtils.lerp(rightHand.current.position.y, 1.4, 0.1);
    } else {
      // Return to upright if not eliminated
      characterGroup.current.rotation.x = THREE.MathUtils.lerp(characterGroup.current.rotation.x, 0, 0.1);
      characterGroup.current.position.z = THREE.MathUtils.lerp(characterGroup.current.position.z, 0, 0.1);

      if (isActive || showBubble) {
        // Talking/Active state: faster bobbing and slight rotation
        characterGroup.current.position.y = Math.sin(time * 8) * 0.15;
        characterGroup.current.rotation.y = Math.sin(time * 4) * 0.1;
        characterGroup.current.rotation.z = Math.sin(time * 6) * 0.05;
        
        // Hands moving
        if (leftHand.current) {
          leftHand.current.position.y = 1.6 + Math.sin(time * 12) * 0.2;
          leftHand.current.position.z = 0.25 + Math.cos(time * 12) * 0.1;
        }
        if (rightHand.current) {
          rightHand.current.position.y = 1.6 + Math.sin(time * 12 + Math.PI) * 0.2;
          rightHand.current.position.z = 0.25 + Math.cos(time * 12 + Math.PI) * 0.1;
        }

      } else {
        // Idle state: slow breathing
        characterGroup.current.position.y = Math.sin(time * 2 + (player.avatarIndex || 0)) * 0.05;
        characterGroup.current.rotation.y = THREE.MathUtils.lerp(characterGroup.current.rotation.y, 0, 0.1);
        characterGroup.current.rotation.z = THREE.MathUtils.lerp(characterGroup.current.rotation.z, 0, 0.1);

        // Hands resting
        if (leftHand.current) {
          leftHand.current.position.y = THREE.MathUtils.lerp(leftHand.current.position.y, 1.4, 0.1);
          leftHand.current.position.z = THREE.MathUtils.lerp(leftHand.current.position.z, 0.15, 0.1);
        }
        if (rightHand.current) {
          rightHand.current.position.y = THREE.MathUtils.lerp(rightHand.current.position.y, 1.4, 0.1);
          rightHand.current.position.z = THREE.MathUtils.lerp(rightHand.current.position.z, 0.15, 0.1);
        }
      }
    }

    // Fade materials gently
    const targetOp = player.isEliminated ? 0.3 : 1.0;
    characterGroup.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            if (mat.transparent) mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOp, 0.05);
          });
        } else if (child.material.transparent) {
          child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOp, 0.05);
        }
      }
    });
  });

  return (
    <group position={position} rotation={[0, angle + Math.PI, 0]}>
      {/* Static Stool */}
      <group position={[0, 0, 0]}>
        {/* Seat */}
        <mesh position={[0, 1.0, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
        {/* Leg */}
        <mesh position={[0, 0.5, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.0, 16]} />
          <meshStandardMaterial color="#555" roughness={0.6} />
        </mesh>
        {/* Base */}
        <mesh position={[0, 0.05, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[0.3, 0.4, 0.1, 32]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      </group>

      {/* Animated Character */}
      <group ref={characterGroup} position={[0, 0, 0]}>
        
        <Accessory index={player.avatarIndex || 0} />

        {/* Body Capsule */}
        <mesh position={[0, 1.8, 0]} castShadow>
          <capsuleGeometry args={[0.4, 0.7, 16, 32]} />
          <meshPhysicalMaterial 
            color={player.isEliminated ? '#222' : color} 
            roughness={0.6} 
            clearcoat={1.0}
            clearcoatRoughness={0.2}
            metalness={0.1}
            transparent
          />
        </mesh>
        
        {/* Visor */}
        <mesh position={[0, 2.1, 0.35]} scale={[1, 0.6, 0.5]} castShadow>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshPhysicalMaterial 
            color={player.isEliminated ? '#111' : '#88ccff'} 
            transmission={player.isEliminated ? 0 : 0.4} 
            opacity={1} 
            metalness={0.2} 
            roughness={0.1} 
            thickness={0.1}
            transparent
          />
        </mesh>

        {/* Backpack */}
        <mesh position={[0, 1.7, -0.3]} castShadow>
          <boxGeometry args={[0.45, 0.6, 0.3]} />
          <meshPhysicalMaterial 
            color={player.isEliminated ? '#1a1a1a' : color} 
            roughness={0.6} 
            clearcoat={1.0}
            clearcoatRoughness={0.2}
            transparent 
          />
        </mesh>

        {/* Hands */}
        <mesh ref={leftHand} position={[-0.45, 1.6, 0.15]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshPhysicalMaterial color={player.isEliminated ? '#222' : color} roughness={0.6} clearcoat={1.0} clearcoatRoughness={0.2} transparent />
        </mesh>
        <mesh ref={rightHand} position={[0.45, 1.6, 0.15]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshPhysicalMaterial color={player.isEliminated ? '#222' : color} roughness={0.6} clearcoat={1.0} clearcoatRoughness={0.2} transparent />
        </mesh>

        {/* Halo for active turn */}
        {isActive && !player.isEliminated && (
          <mesh position={[0, 2.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.3, 0.05, 16, 32]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} />
          </mesh>
        )}

        {/* Nametag */}
        <Html position={[0, player.isEliminated ? 1.0 : 0.8, 0]} center zIndexRange={[100, 0]}>
          <div className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold text-slate-300 shadow-lg backdrop-blur-md whitespace-nowrap border transition-opacity duration-1000
            ${player.isEliminated ? 'bg-red-900/80 border-red-800/50 opacity-50' : 'bg-slate-900/80 border-slate-700/50 opacity-100'}
          `}>
            {player.name} {player.isEliminated ? '(X)' : ''}
          </div>
        </Html>

        {/* Html Bubble */}
        {(showBubble || isActive) && !player.isEliminated && (
          <Html position={[0, 4.0, 0]} center zIndexRange={[100, 0]}>
            <div className="relative bg-slate-900/95 backdrop-blur-md text-slate-200 px-5 py-3.5 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] max-w-[240px] min-w-[120px] border border-slate-700 animate-in zoom-in duration-200" style={{ transformOrigin: 'bottom center' }}>
              {/* Pointer */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-b border-r border-slate-700 transform rotate-45 z-[-1]"></div>
              
              <div className="text-sm font-medium whitespace-pre-wrap leading-relaxed text-center tracking-wide">
                {showBubble ? lastMessage : (
                  <div className="flex items-center justify-center gap-1.5 h-5 opacity-80">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

export function TableScene() {
  const { room, socket } = useGameStore();

  const radius = 4.5;
  const numPlayers = room?.players.length || 0;

  return (
    <Canvas shadows camera={{ position: [0, 8, 14], fov: 45 }} className="w-full h-full bg-transparent">
      <OrbitControls target={[0, 0, 0]} enablePan={false} maxPolarAngle={Math.PI / 2.1} minDistance={5} maxDistance={30} />
      <Environment preset="city" />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.001} />
      <pointLight position={[0, 5, 0]} intensity={2} color="#ffe4b5" castShadow shadow-bias={-0.001} />

      <group position={[0, -2, 0]}>
        {/* Floor shadow */}
        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={20} blur={2} far={4} />

        {/* Table Leg */}
        <mesh receiveShadow castShadow position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.5, 0.8, 1.5, 32]} />
          <meshStandardMaterial color="#2d1706" roughness={0.9} />
        </mesh>

        {/* Table Top */}
        <mesh receiveShadow castShadow position={[0, 1.6, 0]}>
          <cylinderGeometry args={[3.0, 3.0, 0.2, 64]} />
          <meshStandardMaterial color="#8B4513" roughness={0.6} />
        </mesh>

        {/* Players */}
        {room?.players.map((p, i) => {
          const angle = (i / numPlayers) * Math.PI * 2;
          const x = Math.sin(angle) * radius;
          const z = Math.cos(angle) * radius;
          const isActive = room.status === 'playing' && room.currentTurnIndex === i;
          
          const messages = room.messages.filter(m => m.playerId === p.id);
          const lastMessage = messages[messages.length - 1]?.text;

          return (
            <Avatar 
              key={p.id} 
              player={p} 
              position={[x, 0, z]} 
              angle={angle} 
              isActive={isActive}
              lastMessage={lastMessage}
            />
          );
        })}
      </group>
    </Canvas>
  );
}
