import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

interface CinematicPingPongBackgroundProps {
  scrollContainerId?: string;
}

export const CinematicPingPongBackground: React.FC<CinematicPingPongBackgroundProps> = ({
  scrollContainerId = 'main-scroll-container'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // State refs for animation loop
  const scrollTargetRef = useRef(0);
  const scrollCurrentRef = useRef(0);
  const scrollVelocityRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDraggingRef = useRef(false);
  const dragDeltaRef = useRef({ x: 0, y: 0 });
  const manualRotRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 5.5);

    // 2. WebGL Renderer with High-Performance Settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Cinematic Studio Lighting
    const ambientLight = new THREE.AmbientLight(
      theme === 'dark' ? 0x1e293b : 0xf8fafc,
      theme === 'dark' ? 1.2 : 1.8
    );
    scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0xffffff, theme === 'dark' ? 3.5 : 2.5);
    mainSpot.position.set(4, 8, 6);
    mainSpot.angle = Math.PI / 4;
    mainSpot.penumbra = 0.8;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 1024;
    mainSpot.shadow.mapSize.height = 1024;
    scene.add(mainSpot);

    const rimLight1 = new THREE.DirectionalLight(0x5f79ff, theme === 'dark' ? 2.5 : 1.5);
    rimLight1.position.set(-6, 3, -4);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0xd90429, theme === 'dark' ? 2.0 : 1.0);
    rimLight2.position.set(5, -2, -3);
    scene.add(rimLight2);

    // -------------------------------------------------------------
    // 4. PROCEDURAL TEXTURES (Wood Ply, Inverted Rubbers, Stamped Balls)
    // -------------------------------------------------------------
    // A. ITTF Red Rubber Texture with micro-stipple and official stamp
    const redCanvas = document.createElement('canvas');
    redCanvas.width = 512;
    redCanvas.height = 512;
    const rctx = redCanvas.getContext('2d');
    if (rctx) {
      rctx.fillStyle = '#d90429';
      rctx.fillRect(0, 0, 512, 512);

      // Micro surface stipples
      rctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      for (let i = 0; i < 4000; i++) {
        const rx = Math.random() * 512;
        const ry = Math.random() * 512;
        rctx.fillRect(rx, ry, 1.5, 1.5);
      }

      // ITTF Badge at the base
      rctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      rctx.font = 'bold 20px sans-serif';
      rctx.textAlign = 'center';
      rctx.fillText('ITTF 49-002 • PRO-SPIN', 256, 460);
      rctx.font = 'bold 13px sans-serif';
      rctx.fillText('MADE IN JAPAN • TENERGY 05', 256, 482);
    }
    const redRubberTexture = new THREE.CanvasTexture(redCanvas);

    // B. ITTF Black Rubber Texture
    const blackCanvas = document.createElement('canvas');
    blackCanvas.width = 512;
    blackCanvas.height = 512;
    const bctx = blackCanvas.getContext('2d');
    if (bctx) {
      bctx.fillStyle = '#0f172a';
      bctx.fillRect(0, 0, 512, 512);

      bctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let i = 0; i < 4000; i++) {
        const bx = Math.random() * 512;
        const by = Math.random() * 512;
        bctx.fillRect(bx, by, 1.5, 1.5);
      }

      bctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      bctx.font = 'bold 20px sans-serif';
      bctx.textAlign = 'center';
      bctx.fillText('ITTF 21-008 • SPEED CARBON', 256, 460);
      bctx.font = 'bold 13px sans-serif';
      bctx.fillText('OFFICIAL TOURNAMENT EDITION', 256, 482);
    }
    const blackRubberTexture = new THREE.CanvasTexture(blackCanvas);

    // C. 3-Star Ball Stamp Texture
    const ballCanvas = document.createElement('canvas');
    ballCanvas.width = 256;
    ballCanvas.height = 256;
    const blctx = ballCanvas.getContext('2d');
    if (blctx) {
      blctx.fillStyle = '#ffffff';
      blctx.fillRect(0, 0, 256, 256);
      blctx.fillStyle = '#0f172a';
      blctx.font = 'bold 26px sans-serif';
      blctx.textAlign = 'center';
      blctx.fillText('★★★', 128, 105);
      blctx.font = 'bold 16px sans-serif';
      blctx.fillText('NEXIA × MCKENZIE', 128, 138);
      blctx.font = 'bold 12px sans-serif';
      blctx.fillText('ITTF 40+ CHAMPIONSHIP', 128, 162);
    }
    const ballTexture = new THREE.CanvasTexture(ballCanvas);

    // -------------------------------------------------------------
    // 5. BUILD THE 3D PADDLE (FULL 360° / UPSIDE DOWN FREEDOM)
    // -------------------------------------------------------------
    const paddlePivot = new THREE.Group();
    scene.add(paddlePivot);

    const bladeMeshGroup = new THREE.Group();
    paddlePivot.add(bladeMeshGroup);

    // A. 5-Ply Plywood Blade Core (Wood Rim)
    const bladeGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.08, 64);
    bladeGeo.scale(1, 1, 1.15); // Authentic oval ping pong racket head
    const woodCoreMat = new THREE.MeshStandardMaterial({
      color: 0xdeb887, // Natural Limba & Koto ply
      roughness: 0.65,
      metalness: 0.05
    });
    const bladeCore = new THREE.Mesh(bladeGeo, woodCoreMat);
    bladeCore.rotation.x = Math.PI / 2;
    bladeCore.castShadow = true;
    bladeMeshGroup.add(bladeCore);

    // Blade Edge Protection Tape
    const edgeGeo = new THREE.CylinderGeometry(1.215, 1.215, 0.09, 64);
    edgeGeo.scale(1, 1, 1.15);
    const edgeTapeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8
    });
    const edgeTape = new THREE.Mesh(edgeGeo, edgeTapeMat);
    edgeTape.rotation.x = Math.PI / 2;
    bladeMeshGroup.add(edgeTape);

    // B. Red Inverted Rubber Face (Front)
    const redRubberGeo = new THREE.CylinderGeometry(1.19, 1.19, 0.04, 64);
    redRubberGeo.scale(1, 1, 1.14);
    const redRubberMat = new THREE.MeshPhysicalMaterial({
      map: redRubberTexture,
      color: 0xffffff,
      roughness: 0.38,
      metalness: 0.04,
      clearcoat: 0.4,
      clearcoatRoughness: 0.25
    });
    const redRubber = new THREE.Mesh(redRubberGeo, redRubberMat);
    redRubber.rotation.x = Math.PI / 2;
    redRubber.position.z = 0.055;
    redRubber.castShadow = true;
    bladeMeshGroup.add(redRubber);

    // C. Black Inverted Rubber Face (Back)
    const blackRubberGeo = new THREE.CylinderGeometry(1.19, 1.19, 0.04, 64);
    blackRubberGeo.scale(1, 1, 1.14);
    const blackRubberMat = new THREE.MeshPhysicalMaterial({
      map: blackRubberTexture,
      color: 0xffffff,
      roughness: 0.38,
      metalness: 0.04,
      clearcoat: 0.4,
      clearcoatRoughness: 0.25
    });
    const blackRubber = new THREE.Mesh(blackRubberGeo, blackRubberMat);
    blackRubber.rotation.x = Math.PI / 2;
    blackRubber.position.z = -0.055;
    blackRubber.castShadow = true;
    bladeMeshGroup.add(blackRubber);

    // D. Ergonomic Flared Wooden Handle
    const handleGeo = new THREE.BoxGeometry(0.36, 1.4, 0.24);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b, // Walnut / Stained Birch
      roughness: 0.55
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, -1.65, 0);
    handle.castShadow = true;
    bladeMeshGroup.add(handle);

    // Handle Inlay Racing Stripe (Signal Violet)
    const stripeGeo = new THREE.BoxGeometry(0.38, 0.22, 0.26);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0x5f79ff,
      roughness: 0.3,
      metalness: 0.2
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, -1.5, 0);
    bladeMeshGroup.add(stripe);

    // Handle Metallic Lens Emblem
    const lensGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.03, 24);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0x01fe93,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, -2.15, 0.12);
    bladeMeshGroup.add(lens);

    // Position paddle off-center in 3D scene
    paddlePivot.position.set(1.4, 0.2, 0.5);

    // -------------------------------------------------------------
    // 6. BUILD 3D PING PONG BALLS (ORBITING & BOUNCING)
    // -------------------------------------------------------------
    const ballsGroup = new THREE.Group();
    scene.add(ballsGroup);

    const ballGeo = new THREE.SphereGeometry(0.36, 48, 48);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: ballTexture,
      roughness: 0.35,
      metalness: 0.02
    });

    // Main Hero Ball
    const heroBall = new THREE.Mesh(ballGeo, ballMat);
    heroBall.position.set(0.2, 0.8, 1.8);
    heroBall.castShadow = true;
    ballsGroup.add(heroBall);

    // Secondary Floating Balls for Depth
    const bgBall1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 32, 32),
      ballMat
    );
    bgBall1.position.set(-2.2, 1.6, -1.5);
    ballsGroup.add(bgBall1);

    const bgBall2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 32, 32),
      ballMat
    );
    bgBall2.position.set(2.6, -1.4, -2.0);
    ballsGroup.add(bgBall2);

    // -------------------------------------------------------------
    // 7. BUILD 3D ITTF TABLE IN BACKGROUND PERSPECTIVE
    // -------------------------------------------------------------
    const tableGroup = new THREE.Group();
    tableGroup.position.set(-0.8, -2.2, -3.5);
    tableGroup.rotation.set(0.38, -0.45, 0.12);
    scene.add(tableGroup);

    // Tabletop Surface (Matte Navy Tournament Blue)
    const tableTopGeo = new THREE.BoxGeometry(7.2, 0.14, 4.2);
    const tableTopMat = new THREE.MeshStandardMaterial({
      color: theme === 'dark' ? 0x172554 : 0x1d4ed8,
      roughness: 0.4,
      metalness: 0.05
    });
    const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    // Table White Boundary Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const addTableLine = (w: number, d: number, x: number, z: number) => {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.075, z);
      tableGroup.add(line);
    };

    addTableLine(7.14, 0.07, 0, 2.05); // Sideline bottom
    addTableLine(7.14, 0.07, 0, -2.05); // Sideline top
    addTableLine(0.07, 4.14, 3.55, 0); // Endline right
    addTableLine(0.07, 4.14, -3.55, 0); // Endline left
    addTableLine(7.14, 0.04, 0, 0); // Center division line

    // Mesh Net with Posts
    const netGeo = new THREE.BoxGeometry(0.04, 0.5, 4.6);
    const netMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      wireframe: true
    });
    const net = new THREE.Mesh(netGeo, netMat);
    net.position.set(0, 0.28, 0);
    tableGroup.add(net);

    const netTape = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 4.64),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    netTape.position.set(0, 0.53, 0);
    tableGroup.add(netTape);

    // -------------------------------------------------------------
    // 8. FLOATING DUST PARTICLES (ATMOSPHERE)
    // -------------------------------------------------------------
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 12;
      particlePositions[i + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i + 2] = (Math.random() - 0.5) * 8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x5f79ff,
      size: 0.05,
      transparent: true,
      opacity: theme === 'dark' ? 0.6 : 0.35
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // -------------------------------------------------------------
    // 9. SCROLL & MOUSE INTERACTION LISTENERS
    // -------------------------------------------------------------
    let lastScrollTop = 0;
    let lastScrollTime = performance.now();

    const updateScrollMetrics = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
      const maxScroll = Math.max(1, scrollHeight - clientHeight);
      scrollTargetRef.current = Math.min(1, Math.max(0, scrollTop / maxScroll));

      // Calculate instantaneous scroll velocity
      const now = performance.now();
      const dt = Math.max(16, now - lastScrollTime);
      const deltaScroll = scrollTop - lastScrollTop;
      scrollVelocityRef.current = (deltaScroll / dt) * 15;
      lastScrollTop = scrollTop;
      lastScrollTime = now;
    };

    const handleScroll = (e?: Event) => {
      const target = (e?.target as HTMLElement) || document.getElementById(scrollContainerId) || document.documentElement;
      const scrollTop = target.scrollTop ?? window.scrollY;
      const scrollHeight = target.scrollHeight ?? document.documentElement.scrollHeight;
      const clientHeight = target.clientHeight ?? window.innerHeight;
      updateScrollMetrics(scrollTop, scrollHeight, clientHeight);
    };

    // Attach to window, document, and container to ensure zero missed scroll events
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    const scrollEl = document.getElementById(scrollContainerId);
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    }

    const handlePointerMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handlePointerMove);

    // Optional drag rotation for manual exploration
    let startPos = { x: 0, y: 0 };
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      startPos = { x: e.clientX, y: e.clientY };
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;
      manualRotRef.current.y += dx * 0.008;
      manualRotRef.current.x += dy * 0.008;
      startPos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // -------------------------------------------------------------
    // 10. CINEMATIC RENDER LOOP WITH SCROLL DRIVEN ANIMATION
    // -------------------------------------------------------------
    let clock = new THREE.Clock();
    let reqId: number;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Poll scroll container directly every frame as fallback
      const currentScrollEl = document.getElementById(scrollContainerId);
      if (currentScrollEl) {
        const maxScroll = Math.max(1, currentScrollEl.scrollHeight - currentScrollEl.clientHeight);
        scrollTargetRef.current = Math.min(1, Math.max(0, currentScrollEl.scrollTop / maxScroll));
      }

      // Smooth scroll interpolation (Lerp)
      scrollCurrentRef.current += (scrollTargetRef.current - scrollCurrentRef.current) * 0.1;
      const s = scrollCurrentRef.current; // 0 (top) to 1 (bottom)

      // Decay scroll velocity smoothly
      scrollVelocityRef.current *= 0.92;
      const velocity = scrollVelocityRef.current;

      // Smooth mouse parallax
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // ---------------------------------------------------------
      // SCROLL-DRIVEN 3D CAMERA FLIGHT
      // ---------------------------------------------------------
      // Pans around the 3D scene dramatically as the user scrolls down
      camera.position.x = Math.sin(s * Math.PI * 1.2) * 2.2 + mouseRef.current.x * 0.35;
      camera.position.y = 1.6 - s * 3.2 - mouseRef.current.y * 0.25;
      camera.position.z = 5.2 - Math.sin(s * Math.PI) * 1.5;
      camera.lookAt(
        (1 - s) * 0.5 - s * 0.8,
        -s * 1.2,
        -s * 2.2
      );

      // ---------------------------------------------------------
      // 3D PADDLE SCROLL ANIMATION (FLIPPING UPSIDE DOWN & TWIRLING)
      // ---------------------------------------------------------
      // 1 full turn upside down (360° / 2*PI radians) on scroll down + spin bursts on fast scrolls
      const scrollRotationX = -0.4 + s * Math.PI * 2.5 + velocity * 0.08 + manualRotRef.current.x;
      const scrollRotationY = 0.6 + s * Math.PI * 3.0 + elapsedTime * 0.15 + manualRotRef.current.y;
      const scrollRotationZ = Math.sin(s * Math.PI * 2) * 0.6 + Math.sin(elapsedTime * 0.6) * 0.15;

      paddlePivot.rotation.set(scrollRotationX, scrollRotationY, scrollRotationZ);

      // Paddle spatial translation along scroll path
      paddlePivot.position.x = 1.5 - s * 3.2 + Math.sin(elapsedTime * 0.8) * 0.08;
      paddlePivot.position.y = 0.4 - s * 1.8 + Math.cos(elapsedTime * 0.9) * 0.12;
      paddlePivot.position.z = 0.6 - s * 1.6;

      // ---------------------------------------------------------
      // PING PONG BALLS SCROLL-REACTIVE TRAJECTORY (GENTLE & SUBTLE)
      // ---------------------------------------------------------
      // Smooth, toned-down ball float with subtle soft bounce
      const dynamicRallySpeed = 0.9 + Math.abs(velocity) * 0.15;
      const rallyPhase = (elapsedTime * dynamicRallySpeed + s * 1.5) % (Math.PI * 2);
      const bounceHeight = Math.abs(Math.sin(rallyPhase)) * 0.28 + 0.35;

      heroBall.position.set(
        paddlePivot.position.x - 0.7 + Math.sin(rallyPhase * 0.8) * 0.18,
        paddlePivot.position.y + bounceHeight,
        paddlePivot.position.z + 0.5 + Math.cos(rallyPhase * 0.8) * 0.15
      );
      heroBall.rotation.x += 0.012;
      heroBall.rotation.y += 0.009;

      // Secondary depth balls reacting gently to scroll
      bgBall1.position.y = 1.6 - s * 1.4 + Math.sin(elapsedTime * 0.4) * 0.12;
      bgBall1.position.x = -2.4 + s * 1.0;
      bgBall1.rotation.y += 0.008;

      bgBall2.position.y = -1.2 + s * 1.2 + Math.cos(elapsedTime * 0.35) * 0.1;
      bgBall2.position.x = 2.8 - s * 1.4;
      bgBall2.rotation.x += 0.008;

      // Table camera perspective shift
      tableGroup.position.y = -2.0 + s * 1.2;
      tableGroup.rotation.y = -0.45 + s * 0.65 + Math.sin(elapsedTime * 0.2) * 0.04;
      tableGroup.rotation.x = 0.38 - s * 0.25;

      // Ambient particle drift reacts to scroll motion
      particles.rotation.y = elapsedTime * 0.03 + s * 0.5;
      particles.rotation.x = elapsedTime * 0.015 + s * 0.25;

      renderer.render(scene, camera);
      reqId = requestAnimationFrame(animate);
    };

    animate();

    // 11. Window Resize Handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScroll);
      }

      renderer.dispose();
      bladeGeo.dispose();
      woodCoreMat.dispose();
      edgeGeo.dispose();
      edgeTapeMat.dispose();
      redRubberGeo.dispose();
      redRubberMat.dispose();
      blackRubberGeo.dispose();
      blackRubberMat.dispose();
      handleGeo.dispose();
      handleMat.dispose();
      ballGeo.dispose();
      ballMat.dispose();
      redRubberTexture.dispose();
      blackRubberTexture.dispose();
      ballTexture.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme, scrollContainerId]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
      style={{
        opacity: theme === 'dark' ? 0.85 : 0.72,
        mixBlendMode: theme === 'dark' ? 'screen' : 'normal'
      }}
    />
  );
};
