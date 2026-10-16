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

  const [activeTelemetry, setActiveTelemetry] = useState<string>('INDIA_UPI_LOCKED');

  // Keep callback refs stable across renders
  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;
  const onSelectLinkRef = useRef(onSelectLink);
  onSelectLinkRef.current = onSelectLink;

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const linksRef = useRef(links);
  linksRef.current = links;

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    // Start at distance 380, zooms smoothly to 175 (India close-up)
    camera.position.set(0, 0, 380);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const GLOBE_RADIUS = 100;
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Compute exact orthonormal rotation so India center (lat: 22.8, lng: 79.2) is DEAD CENTER facing camera
    // and NORTH is pointing strictly UP (+Y), SOUTH DOWN (-Y), WEST LEFT (-X), EAST RIGHT (+X).
    const indiaPos = latLngToVector3(22.8, 79.2, 100);
    const forward = indiaPos.clone().normalize(); // Normal vector facing outwards from India

    // Tangent pointing directly North along the meridian:
    const northPt = latLngToVector3(23.8, 79.2, 100);
    const northTangent = northPt.clone().sub(indiaPos).normalize();
    // Gram-Schmidt orthogonalization: ensure Up is perpendicular to Forward
    const up = northTangent.clone().sub(forward.clone().multiplyScalar(northTangent.dot(forward))).normalize();
    // Right = cross(up, forward) points directly East
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();

    // Orthonormal basis transformation matrix: transforms (right, up, forward) to (+X, +Y, +Z)
    const rotMatrix = new THREE.Matrix4().set(
      right.x,   right.y,   right.z,   0,
      up.x,      up.y,      up.z,      0,
      forward.x, forward.y, forward.z, 0,
      0,         0,         0,         1
    );
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);

    // Initial space starting orientation (smoothly rotates around Y-axis into India)
    const startQuat = targetQuat.clone().multiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -0.75)
    );

    globeGroup.quaternion.copy(startQuat);

    // 2. Base Dark Cyber Sphere
    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS - 0.5, 48, 48);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x020804,
      transparent: true,
      opacity: 0.96,
    });
    const baseSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(baseSphere);

    // 3. Glowing Cyber Wireframe Latitude/Longitude Grid
    const wireframeGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 0.2, 32, 16);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeo, wireframeMat);
    globeGroup.add(wireframeMesh);

    // 4. Equatorial Navigation Ring
    const ringGeo = new THREE.RingGeometry(GLOBE_RADIUS + 7, GLOBE_RADIUS + 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const eqRing = new THREE.Mesh(ringGeo, ringMat);
    eqRing.rotation.x = Math.PI / 2;
    globeGroup.add(eqRing);

    // 5. Outer Atmospheric Glow (Green Aurora)
    const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 4, 36, 36);
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
          gl_FragColor = vec4(0.0, 1.0, 0.4, 1.0) * intensity * 0.65;
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

    // 7A. Load Subtle World Coastlines Context from /globe-coastlines.json
    fetch('/globe-coastlines.json')
      .then((res) => res.json())
      .then((rings: [number, number][][]) => {
        if (!rings) return;
        rings.forEach((ring) => {
          const points = ring.map(([lat, lng]) => latLngToVector3(lat, lng, GLOBE_RADIUS + 0.25));
          if (points.length < 3) return;
          const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
          const lineMat = new THREE.LineBasicMaterial({
            color: 0x00ff66,
            transparent: true,
            opacity: 0.14,
          });
          const line = new THREE.LineLoop(curveGeo, lineMat);
          globeGroup.add(line);
        });
      })
      .catch(() => {});

    // City & Infrastructure objects for hover inspection
    const cityObjects: {
      mesh: THREE.Mesh;
      data: { title: string; subtitle: string; badge: string; isAlert: boolean };
    }[] = [];

    // 7B. VIVID HIGH-CONTRAST INDIA SOVEREIGN TERRITORIAL MAP & PARTICLES
    fetch('/india-cyber-map.json')
      .then((res) => res.json())
      .then((data: {
        india_boundary: [number, number][];
        india_interior_particles: [number, number][];
        neighbors: { name: string; coordinates: [number, number][][] }[];
        major_cities: { name: string; lat: number; lng: number; role: string }[];
      }) => {
        if (!data) return;

        // 1. Primary High-Luminance Neon Green National Border of India
        if (data.india_boundary && data.india_boundary.length > 2) {
          const borderPts = data.india_boundary.map(([lat, lng]) =>
            latLngToVector3(lat, lng, GLOBE_RADIUS + 0.8)
          );
          const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPts);
          const borderMat = new THREE.LineBasicMaterial({
            color: 0x00ff66,
            transparent: true,
            opacity: 1.0,
          });
          const borderLine = new THREE.LineLoop(borderGeo, borderMat);
          globeGroup.add(borderLine);

          // 2. High-Altitude Cyan Glowing Aura
          const auraPts = data.india_boundary.map(([lat, lng]) =>
            latLngToVector3(lat, lng, GLOBE_RADIUS + 1.0)
          );
          const auraGeo = new THREE.BufferGeometry().setFromPoints(auraPts);
          const auraMat = new THREE.LineBasicMaterial({
            color: 0x00ffcc,
            transparent: true,
            opacity: 0.7,
          });
          const auraLine = new THREE.LineLoop(auraGeo, auraMat);
          globeGroup.add(auraLine);

          // 3. Ground-level Shadow Contour
          const shadowPts = data.india_boundary.map(([lat, lng]) =>
            latLngToVector3(lat, lng, GLOBE_RADIUS + 0.55)
          );
          const shadowGeo = new THREE.BufferGeometry().setFromPoints(shadowPts);
          const shadowMat = new THREE.LineBasicMaterial({
            color: 0x00cc44,
            transparent: true,
            opacity: 0.5,
          });
          const shadowLine = new THREE.LineLoop(shadowGeo, shadowMat);
          globeGroup.add(shadowLine);
        }

        // 4. Glowing Holographic Interior Particle Grid of India Landmass (921 tactical points)
        if (data.india_interior_particles && data.india_interior_particles.length > 0) {
          const count = data.india_interior_particles.length;
          const posArray = new Float32Array(count * 3);
          data.india_interior_particles.forEach(([lat, lng], i) => {
            const v = latLngToVector3(lat, lng, GLOBE_RADIUS + 0.48);
            posArray[i * 3] = v.x;
            posArray[i * 3 + 1] = v.y;
            posArray[i * 3 + 2] = v.z;
          });
          const interiorGeo = new THREE.BufferGeometry();
          interiorGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

          const interiorCanvas = document.createElement('canvas');
          interiorCanvas.width = 16;
          interiorCanvas.height = 16;
          const ictx = interiorCanvas.getContext('2d');
          if (ictx) {
            const grad = ictx.createRadialGradient(8, 8, 0, 8, 8, 8);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.35, '#00ff66');
            grad.addColorStop(1, 'rgba(0, 255, 102, 0)');
            ictx.fillStyle = grad;
            ictx.beginPath();
            ictx.arc(8, 8, 8, 0, Math.PI * 2);
            ictx.fill();
          }
          const interiorTex = new THREE.CanvasTexture(interiorCanvas);
          const interiorMat = new THREE.PointsMaterial({
            color: 0x00ff66,
            size: 2.4,
            map: interiorTex,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const interiorMesh = new THREE.Points(interiorGeo, interiorMat);
          globeGroup.add(interiorMesh);
        }

        // 5. Neighbouring Country Contours for Edge Definition
        if (data.neighbors) {
          data.neighbors.forEach((neighbor) => {
            neighbor.coordinates.forEach((ring) => {
              const pts = ring.map(([lat, lng]) =>
                latLngToVector3(lat, lng, GLOBE_RADIUS + 0.3)
              );
              if (pts.length < 3) return;
              const nGeo = new THREE.BufferGeometry().setFromPoints(pts);
              const nMat = new THREE.LineBasicMaterial({
                color: 0x00ff66,
                transparent: true,
                opacity: 0.28,
              });
              const nLine = new THREE.LineLoop(nGeo, nMat);
              globeGroup.add(nLine);
            });
          });
        }

        // 6. Major Indian Tech & Banking Rail Hubs (Delhi, Mumbai, Bengaluru, etc.)
        if (data.major_cities) {
          data.major_cities.forEach((city) => {
            const cPos = latLngToVector3(city.lat, city.lng, GLOBE_RADIUS + 0.9);
            const cGeo = new THREE.SphereGeometry(0.75, 8, 8);
            const cMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
            const cMesh = new THREE.Mesh(cGeo, cMat);
            cMesh.position.copy(cPos);
            globeGroup.add(cMesh);

            // Small beacon pulse ring
            const ringGeo = new THREE.RingGeometry(0.9, 1.35, 16);
            const ringMat = new THREE.MeshBasicMaterial({
              color: 0x00ffcc,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.75,
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.position.copy(cPos.clone().multiplyScalar(1.005));
            ringMesh.lookAt(cPos.clone().multiplyScalar(2));
            globeGroup.add(ringMesh);

            cityObjects.push({
              mesh: cMesh,
              data: {
                title: `${city.name.toUpperCase()} · HUB NODE`,
                subtitle: `Sector [${city.lat.toFixed(2)}°N, ${city.lng.toFixed(2)}°E]`,
                badge: city.role.toUpperCase(),
                isAlert: false,
              },
            });
          });
        }
      })
      .catch(() => {});

    // 8. India Target Beacon Reticle (centered over India: lat 22.8, lng 79.2)
    const indiaCenterPos = latLngToVector3(22.8, 79.2, GLOBE_RADIUS + 2.5);
    const indiaRingGeo = new THREE.RingGeometry(4.5, 5.8, 36);
    const indiaRingMat = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const indiaRing = new THREE.Mesh(indiaRingGeo, indiaRingMat);
    indiaRing.position.copy(indiaCenterPos);
    indiaRing.lookAt(indiaCenterPos.clone().multiplyScalar(2));
    globeGroup.add(indiaRing);

    // Inner reticle ring
    const innerRingGeo = new THREE.RingGeometry(2.2, 2.9, 24);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.position.copy(indiaCenterPos.clone().multiplyScalar(1.002));
    innerRing.lookAt(indiaCenterPos.clone().multiplyScalar(2));
    globeGroup.add(innerRing);

    // 9. Place Nodes (Domestic Indian Bank Accounts & Mules - Scaled for Map Visibility)
    const nodeObjects: { mesh: THREE.Mesh; data: GlobeNode }[] = [];
    const activeNodes = nodesRef.current;

    activeNodes.forEach((n) => {
      const pos = latLngToVector3(n.lat, n.lng, GLOBE_RADIUS + 1.1);

      const isRed = n.is_flagged;
      const colorHex = isRed ? 0xff003f : 0x00ff66;

      // Scaled down so nodes do not drown out India's national shape
      const nodeGeo = new THREE.SphereGeometry(isRed ? 0.9 : 0.55, 10, 10);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: !isRed,
        opacity: isRed ? 1.0 : 0.75,
      });
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      mesh.position.copy(pos);
      globeGroup.add(mesh);

      // Pin beacon extending outwards
      const pinTop = pos.clone().multiplyScalar(isRed ? 1.04 : 1.025);
      const pinGeo = new THREE.BufferGeometry().setFromPoints([pos, pinTop]);
      const pinMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: isRed ? 0.85 : 0.45,
      });
      const pinLine = new THREE.Line(pinGeo, pinMat);
      globeGroup.add(pinLine);

      // Flagged mules get pulsating red outer ring
      if (isRed) {
        const pulseRingGeo = new THREE.RingGeometry(1.2, 1.8, 16);
        const pulseRingMat = new THREE.MeshBasicMaterial({
          color: 0xff003f,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
        pulseRing.position.copy(pinTop);
        pulseRing.lookAt(pinTop.clone().multiplyScalar(2));
        globeGroup.add(pulseRing);
      }

      nodeObjects.push({ mesh, data: n });
    });

    // 10. Pipeline Arcs & Animated Laser Pulses
    interface PipelineArc {
      curve: THREE.QuadraticBezierCurve3;
      pulseMesh: THREE.Mesh;
      progress: number;
      speed: number;
      isFlagged: boolean;
      data: GlobeLink;
    }
    const pipelineArcs: PipelineArc[] = [];

    const activeLinks = linksRef.current.slice(0, 120);
    activeLinks.forEach((link, idx) => {
      const p1 = latLngToVector3(link.from_lat, link.from_lng, GLOBE_RADIUS + 1.2);
      const p2 = latLngToVector3(link.to_lat, link.to_lng, GLOBE_RADIUS + 1.2);
      const dist = p1.distanceTo(p2);
      if (dist < 1) return;

      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const elevation = Math.min(dist * 0.35, 30);
      mid.normalize().multiplyScalar(GLOBE_RADIUS + 1.2 + elevation);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const curvePoints = curve.getPoints(24);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);

      const isFlagged = link.is_flagged || (selectedAlertId != null && link.ring_id === selectedAlertId);
      const arcColor = isFlagged ? 0xff003f : 0x00ff66;

      const arcMat = new THREE.LineBasicMaterial({
        color: arcColor,
        transparent: true,
        opacity: isFlagged ? 0.85 : 0.35,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      globeGroup.add(arcLine);

      // Glowing laser bead
      const beadGeo = new THREE.SphereGeometry(isFlagged ? 1.3 : 0.9, 6, 6);
      const beadMat = new THREE.MeshBasicMaterial({
        color: isFlagged ? 0xff003f : 0xffffff,
      });
      const pulseMesh = new THREE.Mesh(beadGeo, beadMat);
      globeGroup.add(pulseMesh);

      pipelineArcs.push({
        curve,
        pulseMesh,
        progress: (idx * 0.13) % 1.0,
        speed: 0.003 + (idx % 4) * 0.001,
        isFlagged,
        data: link,
      });
    });

    // 11. Interactive Controls (Orbit with User Drag)
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let userInteracted = false;
    const currentQuat = startQuat.clone();
    let zoomCompleted = false;

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
        const deltaX = (e.clientX - prevMousePos.x) * 0.005;
        const deltaY = (e.clientY - prevMousePos.y) * 0.005;

        const deltaQuatX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaY);
        const deltaQuatY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaX);

        globeGroup.quaternion.multiplyQuaternions(deltaQuatY, globeGroup.quaternion);
        globeGroup.quaternion.multiply(deltaQuatX);

        prevMousePos = { x: e.clientX, y: e.clientY };
        return;
      }

      // Raycaster check for hovered node
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

      // Check hovered major city hub
      const cityMeshes = cityObjects.map((c) => c.mesh);
      const cityIntersects = raycaster.intersectObjects(cityMeshes);
      if (cityIntersects.length > 0) {
        const cHit = cityObjects.find((c) => c.mesh === cityIntersects[0].object);
        if (cHit) {
          setHoveredEntity({
            x: e.clientX,
            y: e.clientY,
            title: cHit.data.title,
            subtitle: cHit.data.subtitle,
            badge: cHit.data.badge,
            isAlert: false,
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
      camera.position.z = Math.max(140, Math.min(420, camera.position.z));
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
        if (hit && onSelectNodeRef.current) {
          onSelectNodeRef.current(hit.data);
        }
      }
    };
    dom.addEventListener('click', onClick);

    // 12. Animation Loop: Zooms into India ONCE and STAYS THE SAME
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // ONE-TIME OPENING ZOOM (0.0s to 2.0s):
      // Camera zooms in from 380 to 175, globe rotates from startQuat to targetQuat (centering India)
      if (!userInteracted && !zoomCompleted) {
        const t = Math.min(elapsedTime / 2.0, 1.0);
        const ease = 1 - Math.pow(1 - t, 3); // Ease-out cubic

        camera.position.z = 380 - ease * (380 - 175);
        globeGroup.quaternion.slerpQuaternions(startQuat, targetQuat, ease);

        if (t >= 1.0) {
          zoomCompleted = true;
          camera.position.z = 175;
          globeGroup.quaternion.copy(targetQuat);
          setActiveTelemetry('TARGET_LOCKED: INDIA UPI RAIL');
        }
      } else if (!userInteracted && zoomCompleted) {
        // Stays EXACTLY the same — locked on India with zero drift
        camera.position.z = 175;
      }

      // Animate laser pipeline pulses along arcs
      if (pipelineActive) {
        for (let i = 0; i < pipelineArcs.length; i++) {
          const p = pipelineArcs[i];
          p.progress = (p.progress + p.speed) % 1.0;
          const pos = p.curve.getPoint(p.progress);
          p.pulseMesh.position.copy(pos);
        }
      }

      // Subtle pulse on India reticle
      if (indiaRing) {
        const pulse = 1.0 + Math.sin(elapsedTime * 2.5) * 0.12;
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
  }, []); // Mounts strictly ONCE — no unmounting or resetting loops!

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none font-mono">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Cyber HUD Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 border border-green-500/20 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]" />

      {/* Top Left Telemetry Crosshairs */}
      <div className="pointer-events-none absolute left-4 top-4 font-mono text-[11px] text-green-400 bg-black/90 px-3 py-2 border border-green-500/40 rounded flex flex-col gap-1 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
          <span className="font-bold tracking-widest text-white">TRACE 3D CYBER GLOBE</span>
          <span className="px-1.5 py-0.2 bg-green-950 border border-green-500 text-[10px] text-green-300 rounded font-bold">
            🇮🇳 INDIA UPI RAIL
          </span>
        </div>
        <div className="text-[10px] text-green-300">
          SECTOR: <span className="text-white font-bold">[22.8°N, 79.2°E] · TARGET LOCKED</span>
        </div>
        <div className="text-[9px] text-slate-400">
          DRAG TO ORBIT · SCROLL TO ZOOM · CLICK TO INSPECT
        </div>
      </div>

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
