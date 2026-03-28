"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import type { Group, Mesh } from "three";
import type { GraphLink, GraphNode } from "@/src/types/mission-control";

type BrainVisualizationProps = {
  nodes: GraphNode[];
  links: GraphLink[];
};

type PositionedNode = {
  node: GraphNode;
  position: [number, number, number];
  driftSeed: number;
};

function BrainScene({ nodes, links }: BrainVisualizationProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const groupRef = useRef<Group>(null);
  const nodeRefs = useRef<(Mesh | null)[]>([]);

  const {
    ambientParticlePositions,
    ambientLinkPositions,
    positionedNodes,
    baseEntityLinkPositions,
    highlightedLinkPositions,
  } = useMemo(() => {
    const ambientCount = 380;
    const ambientRadius = 2.25;
    const ambient = new Float32Array(ambientCount * 3);
    for (let index = 0; index < ambientCount; index += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = ambientRadius * (0.35 + Math.random() * 0.65);
      ambient[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      ambient[index * 3 + 1] = radius * Math.cos(phi);
      ambient[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    const ambientLinkCount = 300;
    const ambientLinksArray = new Float32Array(ambientLinkCount * 6);
    for (let index = 0; index < ambientLinkCount; index += 1) {
      const start = Math.floor(Math.random() * ambientCount);
      const end = Math.floor(Math.random() * ambientCount);
      ambientLinksArray[index * 6] = ambient[start * 3];
      ambientLinksArray[index * 6 + 1] = ambient[start * 3 + 1];
      ambientLinksArray[index * 6 + 2] = ambient[start * 3 + 2];
      ambientLinksArray[index * 6 + 3] = ambient[end * 3];
      ambientLinksArray[index * 6 + 4] = ambient[end * 3 + 1];
      ambientLinksArray[index * 6 + 5] = ambient[end * 3 + 2];
    }

    const nodePositionsById = new Map<string, [number, number, number]>();
    const positioned: PositionedNode[] = nodes.map((node, index) => {
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const y = 1 - (index / Math.max(1, nodes.length - 1)) * 2;
      const radius = Math.sqrt(1 - y * y) * (1.4 + (index % 4) * 0.04);
      const theta = goldenAngle * index;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      const jitter: [number, number, number] = [
        ((index * 11) % 7) * 0.01 - 0.03,
        ((index * 17) % 9) * 0.01 - 0.04,
        ((index * 23) % 11) * 0.01 - 0.05,
      ];
      const position: [number, number, number] = [x + jitter[0], y * 1.35 + jitter[1], z + jitter[2]];
      nodePositionsById.set(node.id, position);
      return {
        node,
        position,
        driftSeed: (index + 1) * 0.35,
      };
    });

    const baseLinks: number[] = [];
    const activeLinks: number[] = [];
    for (const link of links) {
      const source = nodePositionsById.get(link.source);
      const target = nodePositionsById.get(link.target);
      if (!source || !target) {
        continue;
      }
      baseLinks.push(source[0], source[1], source[2], target[0], target[1], target[2]);
      if (hoveredNodeId && (link.source === hoveredNodeId || link.target === hoveredNodeId)) {
        activeLinks.push(source[0], source[1], source[2], target[0], target[1], target[2]);
      }
    }

    return {
      ambientParticlePositions: ambient,
      ambientLinkPositions: ambientLinksArray,
      positionedNodes: positioned,
      baseEntityLinkPositions: new Float32Array(baseLinks),
      highlightedLinkPositions: new Float32Array(activeLinks),
    };
  }, [links, nodes, hoveredNodeId]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.08;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.015;
      groupRef.current.scale.setScalar(pulse);
    }
    for (let index = 0; index < nodeRefs.current.length; index += 1) {
      const mesh = nodeRefs.current[index];
      const positioned = positionedNodes[index];
      if (!mesh || !positioned) {
        continue;
      }
      const elapsed = state.clock.elapsedTime;
      mesh.position.y = positioned.position[1] + Math.sin(elapsed + positioned.driftSeed) * 0.015;
      mesh.position.x = positioned.position[0] + Math.cos(elapsed * 0.7 + positioned.driftSeed) * 0.01;
    }
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[3.5, 3.5, 2.8]} intensity={1.3} color="#00d4ff" />
      <pointLight position={[-3.4, -2.8, -2]} intensity={0.5} color="#00ff88" />
      <group ref={groupRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={ambientParticlePositions.length / 3}
              itemSize={3}
              array={ambientParticlePositions}
            />
          </bufferGeometry>
          <pointsMaterial color="#00d4ff" size={0.03} sizeAttenuation transparent opacity={0.9} />
        </points>

        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={ambientLinkPositions.length / 3}
              itemSize={3}
              array={ambientLinkPositions}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00d4ff" transparent opacity={0.09} />
        </lineSegments>

        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={baseEntityLinkPositions.length / 3}
              itemSize={3}
              array={baseEntityLinkPositions}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#66e5ff" transparent opacity={0.3} />
        </lineSegments>

        {highlightedLinkPositions.length > 0 && (
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={highlightedLinkPositions.length / 3}
                itemSize={3}
                array={highlightedLinkPositions}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#ffffff" transparent opacity={0.75} />
          </lineSegments>
        )}

        {positionedNodes.map((positionedNode, index) => {
          const isHovered = hoveredNodeId === positionedNode.node.id;
          return (
            <mesh
              key={positionedNode.node.id}
              ref={(element) => {
                nodeRefs.current[index] = element;
              }}
              position={positionedNode.position}
              onPointerOver={(event) => {
                event.stopPropagation();
                setHoveredNodeId(positionedNode.node.id);
              }}
              onPointerOut={() => setHoveredNodeId(null)}
            >
              <sphereGeometry args={[isHovered ? 0.07 : 0.055, 16, 16]} />
              <meshStandardMaterial
                color={positionedNode.node.color}
                emissive={positionedNode.node.color}
                emissiveIntensity={isHovered ? 1.2 : 0.6}
                metalness={0.1}
                roughness={0.2}
              />
              {isHovered && (
                <Html center distanceFactor={6}>
                  <div className="rounded-md border border-cyan-300/50 bg-[#04070f]/90 px-2 py-1 text-[11px] font-medium text-cyan-100 shadow-[0_0_20px_rgba(0,212,255,0.4)]">
                    {positionedNode.node.label}
                  </div>
                </Html>
              )}
            </mesh>
          );
        })}
      </group>

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.32} />
    </>
  );
}

export function BrainVisualization({ nodes, links }: BrainVisualizationProps) {
  return (
    <div className="h-[420px] w-full rounded-2xl border border-cyan-400/20 bg-[#04070f] shadow-[inset_0_0_42px_rgba(0,212,255,0.12),0_0_36px_rgba(0,212,255,0.16)]">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <BrainScene nodes={nodes} links={links} />
      </Canvas>
    </div>
  );
}
