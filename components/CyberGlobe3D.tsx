'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface GlobeNode {
  id: string;
  label: string;
  type: string;
  bank: string;
  city: string;
  state?: string;
  country: string;
  currency: string;
  currency_symbol: string;
  lat: number;
  lng: number;
  category?: string;
  is_flagged: boolean;
  alert_id?: string | null;
}

export interface GlobeLink {
  tx_id: string;
  source: string;
  target: string;
  amount: number;
  amount_usd?: number;
  currency: string;
  currency_symbol: string;
  from_city: string;
  to_city: string;
  from_country?: string;
  to_country?: string;
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  is_flagged: boolean;
  ring_id?: string | null;
  timestamp?: string;
}

interface CyberGlobe3DProps {
  nodes: GlobeNode[];
  links: GlobeLink[];
  onSelectNode?: (node: GlobeNode) => void;
  onSelectLink?: (link: GlobeLink) => void;
  selectedAlertId?: string | null;
  pipelineActive?: boolean;
}

// Converts lat/lng to 3D Cartesian coordinates on a sphere of radius R
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export default function CyberGlobe3D({
  nodes,
  links,
  onSelectNode,
  onSelectLink,
  selectedAlertId,
  pipelineActive = true,
}: CyberGlobe3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredEntity, setHoveredEntity] = useState<{
    x: number;
    y: number;
    title: string;
    subtitle: string;
    badge: string;
    isAlert: boolean;
    amount?: string;
  } | null>(null);

  const [activeTelemetry, setActiveTelemetry] = useState<string>('ORBIT_STEADY');
  const [isLockedOnIndia, setIsLockedOnIndia] = useState<boolean>(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    // Opening zoom animation starts in high orbit at z=480, zooms into z=185 (India close-up)
    camera.position.set(0, 25, 480);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const GLOBE_RADIUS = 100;
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Initial orientation: tilt and starting space orbit rotation
    globeGroup.rotation.x = 0.45;
    globeGroup.rotation.y = 0.5;

    // India target orientation (lat: 20.59°N, lng: 78.96°E)
    // When rotX = -0.36 and rotY = 3.32, India faces directly towards the camera on the Z axis
    const INDIA_TARGET_ROTX = -0.36;
    const INDIA_TARGET_ROTY = 3.32;

    // 2. Base Dark Cyber Sphere
    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS - 0.5, 64, 64);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x020704,
      transparent: true,
      opacity: 0.96,
    });
    const baseSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(baseSphere);

    // 3. Glowing Cyber Wireframe Latitude/Longitude Grid
    const wireframeGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 0.2, 36, 18);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeo, wireframeMat);
    globeGroup.add(wireframeMesh);

    // 4. Equatorial Navigation Ring
    const ringGeo = new THREE.RingGeometry(GLOBE_RADIUS + 8, GLOBE_RADIUS + 9, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const eqRing = new THREE.Mesh(ringGeo, ringMat);
    eqRing.rotation.x = Math.PI / 2;
    globeGroup.add(eqRing);

    // 5. Outer Atmospheric Glow (Green Aurora)
    const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 5, 48, 48);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(0.0, 1.0, 0.4, 1.0) * intensity * 0.7;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    globeGroup.add(halo);

    // 6. Load Continent Dots from /globe-particles.json
    fetch('/globe-particles.json')
      .then((res) => res.json())
      .then((dots: [number, number][]) => {
        if (!dots || dots.length === 0) return;
        const count = dots.length;
        const positions = new Float32Array(count * 3);

        dots.forEach(([lat, lng], i) => {
          const v = latLngToVector3(lat, lng, GLOBE_RADIUS + 0.4);
          positions[i * 3] = v.x;
          positions[i * 3 + 1] = v.y;
          positions[i * 3 + 2] = v.z;
        });

        const dotsGeo = new THREE.BufferGeometry();
        dotsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, '#00ff66');
          grad.addColorStop(1, 'rgba(0, 255, 102, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(8, 8, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        const dotTexture = new THREE.CanvasTexture(canvas);

        const dotsMat = new THREE.PointsMaterial({
          color: 0x00ff66,
          size: 1.8,
          map: dotTexture,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const pointsMesh = new THREE.Points(dotsGeo, dotsMat);
        globeGroup.add(pointsMesh);
      })
      .catch(() => {});

    // 7. Load Coastlines from /globe-coastlines.json
    fetch('/globe-coastlines.json')
      .then((res) => res.json())
      .then((rings: [number, number][][]) => {
        if (!rings) return;
        rings.forEach((ring) => {
          const points = ring.map(([lat, lng]) => latLngToVector3(lat, lng, GLOBE_RADIUS + 0.3));
          if (points.length < 3) return;
          const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
          const lineMat = new THREE.LineBasicMaterial({
            color: 0x00ff66,
            transparent: true,
            opacity: 0.22,
          });
          const line = new THREE.LineLoop(curveGeo, lineMat);
          globeGroup.add(line);
        });
      })
      .catch(() => {});

    // 8. India Center Target Beacon (Illuminated 3D Reticle)
    const indiaCenterPos = latLngToVector3(20.5937, 78.9629, GLOBE_RADIUS + 2.5);
    const indiaRingGeo = new THREE.RingGeometry(5.0, 6.2, 32);
    const indiaRingMat = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const indiaRing = new THREE.Mesh(indiaRingGeo, indiaRingMat);
    indiaRing.position.copy(indiaCenterPos);
    indiaRing.lookAt(indiaCenterPos.clone().multiplyScalar(2));
    globeGroup.add(indiaRing);

    // 9. Place Domestic Indian Account & Mule Nodes
    const nodeObjects: { mesh: THREE.Mesh; data: GlobeNode }[] = [];
    const nodeMap = new Map<string, THREE.Vector3>();

    nodes.forEach((n) => {
      const pos = latLngToVector3(n.lat, n.lng, GLOBE_RADIUS + 1.2);
      nodeMap.set(n.id, pos);

      const isRed = n.is_flagged;
      const colorHex = isRed ? 0xff003f : 0x00ff66;

      const nodeGeo = new THREE.SphereGeometry(isRed ? 1.6 : 1.2, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      mesh.position.copy(pos);
      globeGroup.add(mesh);

      // Beacon pin extending outwards
      const pinTop = pos.clone().multiplyScalar(1.03);
      const pinGeo = new THREE.BufferGeometry().setFromPoints([pos, pinTop]);
      const pinMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.8,
      });
      const pinLine = new THREE.Line(pinGeo, pinMat);
      globeGroup.add(pinLine);

      // Flagged mules get pulsating crimson ring
      if (isRed) {
        const pulseRingGeo = new THREE.RingGeometry(1.8, 2.5, 24);
        const pulseRingMat = new THREE.MeshBasicMaterial({
          color: 0xff003f,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
        pulseRing.position.copy(pinTop);
        pulseRing.lookAt(pinTop.clone().multiplyScalar(2));
        globeGroup.add(pulseRing);
      }

      nodeObjects.push({ mesh, data: n });
    });

    // 10. Domestic Indian Transaction Arcs & Animated Laser Pulses
    interface PipelineArc {
      curve: THREE.QuadraticBezierCurve3;
      pulseMesh: THREE.Mesh;
      progress: number;
      speed: number;
      isFlagged: boolean;
      data: GlobeLink;
    }
    const pipelineArcs: PipelineArc[] = [];

    const renderLinks = links.slice(0, 140);
    renderLinks.forEach((link, idx) => {
      const p1 = latLngToVector3(link.from_lat, link.from_lng, GLOBE_RADIUS + 1.2);
      const p2 = latLngToVector3(link.to_lat, link.to_lng, GLOBE_RADIUS + 1.2);
      const dist = p1.distanceTo(p2);
      if (dist < 1) return;

      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const elevation = Math.min(dist * 0.35, 35);
      mid.normalize().multiplyScalar(GLOBE_RADIUS + 1.2 + elevation);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const curvePoints = curve.getPoints(36);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);

      const isFlagged = link.is_flagged || (selectedAlertId != null && link.ring_id === selectedAlertId);
      const arcColor = isFlagged ? 0xff003f : 0x00ff66;

      const arcMat = new THREE.LineBasicMaterial({
        color: arcColor,
        transparent: true,
        opacity: isFlagged ? 0.9 : 0.4,
        linewidth: isFlagged ? 2 : 1,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      globeGroup.add(arcLine);

      // Glowing laser bead
      const beadGeo = new THREE.SphereGeometry(isFlagged ? 1.5 : 1.0, 8, 8);
      const beadMat = new THREE.MeshBasicMaterial({
        color: isFlagged ? 0xff003f : 0xffffff,
      });
      const pulseMesh = new THREE.Mesh(beadGeo, beadMat);
      globeGroup.add(pulseMesh);

      pipelineArcs.push({
        curve,
        pulseMesh,
        progress: (idx * 0.13) % 1.0,
        speed: 0.003 + (idx % 5) * 0.001,
        isFlagged,
        data: link,
      });
    });

    // 11. Mouse Interaction
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let targetRotY = globeGroup.rotation.y;
    let targetRotX = globeGroup.rotation.x;
    let userInteracted = false;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      userInteracted = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        targetRotY += deltaX * 0.005;
        targetRotX += deltaY * 0.005;
        targetRotX = Math.max(-1.1, Math.min(1.1, targetRotX));
        prevMousePos = { x: e.clientX, y: e.clientY };
        return;
      }

      // Raycasting hover check
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const meshes = nodeObjects.map((n) => n.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = nodeObjects.find((n) => n.mesh === intersects[0].object);
        if (hit) {
          const d = hit.data;
          setHoveredEntity({
            x: e.clientX,
            y: e.clientY,
            title: `${d.label} [${d.bank}]`,
            subtitle: `${d.city}, ${d.state || 'India'} · ${d.category || d.type}`,
            badge: d.is_flagged ? 'ALERT: FLAGGED MULE' : 'VERIFIED RETAIL USER',
            isAlert: d.is_flagged,
          });
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredEntity(null);
      renderer.domElement.style.cursor = 'default';
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      userInteracted = true;
      camera.position.z += e.deltaY * 0.15;
      camera.position.z = Math.max(150, Math.min(480, camera.position.z));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const meshes = nodeObjects.map((n) => n.mesh);
      const intersects = raycaster.intersectObjects(meshes);
      if (intersects.length > 0) {
        const hit = nodeObjects.find((n) => n.mesh === intersects[0].object);
        if (hit && onSelectNode) {
          onSelectNode(hit.data);
        }
      }
    };
    dom.addEventListener('click', onClick);

    // 12. Animation Loop with Opening Zoom-In to India
    let frameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Opening Zoom-In Sequence: 0.0s to 3.2s
      // Starts at high orbit (z=480), zooms down to z=185 while rotating globe directly into India
      if (!userInteracted && elapsedTime < 3.2) {
        const t = Math.min(elapsedTime / 3.2, 1.0);
        const ease = 1 - Math.pow(1 - t, 3); // Ease-out cubic

        camera.position.z = 480 - ease * (480 - 185);

        // Smoothly rotate globe towards India
        targetRotX = 0.45 + ease * (INDIA_TARGET_ROTX - 0.45);
        targetRotY = 0.5 + ease * (INDIA_TARGET_ROTY - 0.5);

        globeGroup.rotation.x = targetRotX;
        globeGroup.rotation.y = targetRotY;

        setActiveTelemetry('ZOOMING INTO INDIA (UPI CORRIDOR)...');
        setIsLockedOnIndia(false);
      } else if (!userInteracted && elapsedTime >= 3.2 && elapsedTime < 4.0) {
        setActiveTelemetry('TARGET LOCKED: INDIA UPI SURVEILLANCE SECTOR');
        setIsLockedOnIndia(true);
      } else {
        if (!userInteracted) {
          // Gentle micro-orbit around India to show 3D depth
          targetRotY += 0.0006;
        }
        globeGroup.rotation.y += (targetRotY - globeGroup.rotation.y) * 0.08;
        globeGroup.rotation.x += (targetRotX - globeGroup.rotation.x) * 0.08;
      }

      // Animate laser pipeline pulses along arcs
      if (pipelineActive) {
        pipelineArcs.forEach((p) => {
          p.progress = (p.progress + p.speed) % 1.0;
          const pos = p.curve.getPoint(p.progress);
          p.pulseMesh.position.copy(pos);
        });
      }

      // Animate pulsing India center ring
      if (indiaRing) {
        const pulse = 1.0 + Math.sin(elapsedTime * 3) * 0.15;
        indiaRing.scale.set(pulse, pulse, 1);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('click', onClick);
      renderer.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
  }, [nodes, links, onSelectNode, onSelectLink, selectedAlertId, pipelineActive]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none font-mono">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Cyber HUD Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 border border-green-500/20 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]" />

      {/* Top Left Telemetry Crosshairs */}
      <div className="pointer-events-none absolute left-4 top-4 font-mono text-[11px] text-green-400 bg-black/85 px-3 py-2 border border-green-500/40 rounded flex flex-col gap-1 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
          <span className="font-bold tracking-widest text-white">AEGIS 3D CYBER GLOBE</span>
          <span className="px-1.5 py-0.2 bg-green-950 border border-green-500 text-[10px] text-green-300 rounded font-bold">
            🇮🇳 INDIA UPI RAIL
          </span>
        </div>
        <div className="text-[10px] text-green-300">
          STATUS: <span className="text-white font-bold">{activeTelemetry}</span>
        </div>
        <div className="text-[9px] text-slate-400">
          SECTOR: [20.59°N, 78.96°E] · NODES: {nodes.length} · PIPELINE ARCS: {links.length}
        </div>
      </div>

      {/* Target Locked Indicator Banner */}
      {isLockedOnIndia && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/90 border border-green-400 px-3 py-1.5 rounded text-xs text-white shadow-[0_0_15px_rgba(0,255,102,0.4)] animate-in fade-in duration-300">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>FOCUSED ON: <strong className="text-green-300">INDIA DOMESTIC UPI NETWORK</strong></span>
        </div>
      )}

      {/* Interactive Tooltip on Hover */}
      {hoveredEntity && (
        <div
          className="pointer-events-none absolute z-50 p-2.5 rounded bg-black/95 border border-green-400 text-xs shadow-[0_0_20px_rgba(0,255,102,0.4)] backdrop-blur-md min-w-[220px]"
          style={{
            left: Math.min(hoveredEntity.x + 15, window.innerWidth - 240),
            top: Math.max(hoveredEntity.y - 70, 20),
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-green-500/30 pb-1 mb-1.5">
            <span className="text-sm">🇮🇳</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                hoveredEntity.isAlert ? 'bg-red-950 text-red-400 border border-red-500' : 'bg-green-950 text-green-400 border border-green-500'
              }`}
            >
              {hoveredEntity.badge}
            </span>
          </div>
          <div className="font-bold text-white text-[13px]">{hoveredEntity.title}</div>
          <div className="text-[11px] text-slate-300">{hoveredEntity.subtitle}</div>
          {hoveredEntity.amount && (
            <div className="mt-1 text-green-400 font-mono font-bold text-xs">{hoveredEntity.amount}</div>
          )}
        </div>
      )}
    </div>
  );
}
