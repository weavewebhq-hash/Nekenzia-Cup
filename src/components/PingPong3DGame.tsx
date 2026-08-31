import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Play, RotateCcw, Volume2, VolumeX, X, Trophy, Sparkles, Target, Zap, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTournament } from '../context/TournamentContext';

// Simple synthesized Web Audio Sound FX for Ping Pong
class SoundFX {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  playPaddleHit(speedRatio: number = 1) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freq = 420 + Math.min(300, speedRatio * 150);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playTableBounce(volume: number = 0.3) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(Math.min(0.4, volume), this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {
      // Silent catch
    }
  }

  playNetHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const node = this.ctx.createBufferSource();
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      node.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      node.connect(gain);
      gain.connect(this.ctx.destination);
      node.start();
    } catch {
      // Silent
    }
  }

  playScore(isWin: boolean) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = isWin ? [523.25, 659.25, 783.99] : [330, 293.66, 261.63];
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.08);
        osc.stop(this.ctx.currentTime + i * 0.08 + 0.16);
      });
    } catch {
      // Silent
    }
  }
}

interface PingPong3DGameProps {
  onClose?: () => void;
  isEmbedded?: boolean;
}

type GameMode = 'match' | 'rally' | 'target';
type Difficulty = 'easy' | 'medium' | 'hard';
type CameraView = 'player' | 'tv' | 'side';

export const PingPong3DGame: React.FC<PingPong3DGameProps> = ({ onClose, isEmbedded = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { triggerHaptic } = useTournament();

  // Game UI State
  const [gameMode, setGameMode] = useState<GameMode>('match');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [cameraView, setCameraView] = useState<CameraView>('player');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Score & Stats
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [botScore, setBotScore] = useState<number>(0);
  const [rallyCount, setRallyCount] = useState<number>(0);
  const [maxRally, setMaxRally] = useState<number>(0);
  const [targetHits, setTargetHits] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<string>('Rally in Progress');
  const [announcement, setAnnouncement] = useState<string | null>('Match Started! Serve the ball.');

  // Sound Engine Instance
  const soundRef = useRef<SoundFX>(new SoundFX());

  // Three.js and Physics Simulation Refs
  const simRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerPaddle: THREE.Group;
    botPaddle: THREE.Group;
    ball: THREE.Mesh;
    table: THREE.Group;
    targets: THREE.Group;
    ballTrail: THREE.Points;
    trailPositions: Float32Array;
    ballPos: THREE.Vector3;
    ballVel: THREE.Vector3;
    ballSpin: THREE.Vector3;
    playerTargetPos: THREE.Vector3;
    botTargetPos: THREE.Vector3;
    paddleTilt: { x: number; y: number; z: number };
    mousePos: { x: number; y: number };
    lastTouchPos: { x: number; y: number };
    lastHitBy: 'player' | 'bot' | 'none';
    tableBounceCount: number;
    lastBounceSide: 'player' | 'bot' | 'none';
    isServing: boolean;
    server: 'player' | 'bot';
    activeTargets: { mesh: THREE.Mesh; pointVal: number; x: number; z: number }[];
    reqId: number | null;
  } | null>(null);

  // Show banner announcement
  const showBanner = useCallback((text: string, durationMs: number = 2000) => {
    setAnnouncement(text);
    setTimeout(() => {
      setAnnouncement(prev => (prev === text ? null : prev));
    }, durationMs);
  }, []);

  // Update mute state
  useEffect(() => {
    soundRef.current.setMuted(isMuted);
  }, [isMuted]);

  // Reset / Start a new match
  const startNewMatch = useCallback((mode: GameMode = gameMode) => {
    setPlayerScore(0);
    setBotScore(0);
    setRallyCount(0);
    setTargetHits(0);
    setGameMode(mode);
    setGameStatus('Match in Progress');
    showBanner(`New ${mode === 'match' ? 'Championship Match' : mode === 'rally' ? 'Endless Rally' : 'Target Training'}!`);

    if (simRef.current) {
      simRef.current.isServing = true;
      simRef.current.server = 'player';
      simRef.current.ballPos.set(0, 0.4, 3.8);
      simRef.current.ballVel.set(0, 0, 0);
      simRef.current.tableBounceCount = 0;
      simRef.current.lastHitBy = 'none';
    }
  }, [gameMode, showBanner]);

  // Main Three.js Initialization & Physics Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme === 'dark' ? 0x090d16 : 0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.4, 5.8);
    camera.lookAt(0, 0.2, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Realistic Arena Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, theme === 'dark' ? 0.7 : 1.1);
    scene.add(ambientLight);

    const stadiumSpot1 = new THREE.SpotLight(0xffffff, 2.5);
    stadiumSpot1.position.set(0, 8, 2);
    stadiumSpot1.castShadow = true;
    stadiumSpot1.shadow.mapSize.width = 1024;
    stadiumSpot1.shadow.mapSize.height = 1024;
    scene.add(stadiumSpot1);

    const courtLight1 = new THREE.DirectionalLight(0x5f79ff, 1.2);
    courtLight1.position.set(-6, 6, -3);
    scene.add(courtLight1);

    const courtLight2 = new THREE.DirectionalLight(0xd90429, 1.2);
    courtLight2.position.set(6, 6, 3);
    scene.add(courtLight2);

    // -----------------------------------------------------------------
    // 4. ITTF TOURNAMENT TABLE (Length: 2.74m ~ 5.4 units, Width: 1.525m ~ 3.0 units, Height: 0.76m)
    // -----------------------------------------------------------------
    const TABLE_WIDTH = 3.2;
    const TABLE_LENGTH = 5.6;
    const TABLE_HEIGHT = 0.12;

    const tableGroup = new THREE.Group();
    scene.add(tableGroup);

    // Tabletop Surface (Matte Navy Tournament Blue)
    const tableTopMat = new THREE.MeshStandardMaterial({
      color: theme === 'dark' ? 0x133e87 : 0x1d4ed8,
      roughness: 0.45,
      metalness: 0.05
    });
    const tableTopGeo = new THREE.BoxGeometry(TABLE_WIDTH, TABLE_HEIGHT, TABLE_LENGTH);
    const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
    tableTop.position.y = 0;
    tableTop.receiveShadow = true;
    tableTop.castShadow = true;
    tableGroup.add(tableTop);

    // Table Lines (White Boundary 2cm)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const addLine = (w: number, d: number, x: number, z: number) => {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, TABLE_HEIGHT / 2 + 0.002, z);
      tableGroup.add(line);
    };

    // Sidelines & Endlines
    addLine(0.05, TABLE_LENGTH, TABLE_WIDTH / 2 - 0.025, 0);
    addLine(0.05, TABLE_LENGTH, -TABLE_WIDTH / 2 + 0.025, 0);
    addLine(TABLE_WIDTH, 0.05, 0, TABLE_LENGTH / 2 - 0.025);
    addLine(TABLE_WIDTH, 0.05, 0, -TABLE_LENGTH / 2 + 0.025);
    // Center Doubles Line
    addLine(0.025, TABLE_LENGTH, 0, 0);

    // Table Undercarriage & Legs
    const undercarriageMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 16);

    const legPositions = [
      [TABLE_WIDTH / 2 - 0.3, -0.7, TABLE_LENGTH / 2 - 0.5],
      [-TABLE_WIDTH / 2 + 0.3, -0.7, TABLE_LENGTH / 2 - 0.5],
      [TABLE_WIDTH / 2 - 0.3, -0.7, -TABLE_LENGTH / 2 + 0.5],
      [-TABLE_WIDTH / 2 + 0.3, -0.7, -TABLE_LENGTH / 2 + 0.5]
    ];

    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, undercarriageMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      tableGroup.add(leg);
    });

    // ITTF Regulation Net (Height: 15.25cm ~ 0.35 units)
    const NET_HEIGHT = 0.36;
    const netMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      wireframe: true
    });
    const netGeo = new THREE.BoxGeometry(TABLE_WIDTH + 0.4, NET_HEIGHT, 0.04);
    const netMesh = new THREE.Mesh(netGeo, netMat);
    netMesh.position.set(0, TABLE_HEIGHT / 2 + NET_HEIGHT / 2, 0);
    tableGroup.add(netMesh);

    // Net Top White Tape
    const tapeGeo = new THREE.BoxGeometry(TABLE_WIDTH + 0.42, 0.04, 0.05);
    const tapeMesh = new THREE.Mesh(tapeGeo, lineMat);
    tapeMesh.position.set(0, TABLE_HEIGHT / 2 + NET_HEIGHT, 0);
    tableGroup.add(tapeMesh);

    // Net Posts
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, NET_HEIGHT + 0.05, 16);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const post1 = new THREE.Mesh(postGeo, postMat);
    post1.position.set((TABLE_WIDTH + 0.4) / 2, TABLE_HEIGHT / 2 + NET_HEIGHT / 2, 0);
    const post2 = new THREE.Mesh(postGeo, postMat);
    post2.position.set(-(TABLE_WIDTH + 0.4) / 2, TABLE_HEIGHT / 2 + NET_HEIGHT / 2, 0);
    tableGroup.add(post1);
    tableGroup.add(post2);

    // Arena Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: theme === 'dark' ? 0x0a0f1d : 0xe2e8f0,
      roughness: 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.4;
    floor.receiveShadow = true;
    scene.add(floor);

    // -----------------------------------------------------------------
    // 5. 3D PADDLES (PLAYER & BOT)
    // -----------------------------------------------------------------
    const createPaddle = (isPlayer: boolean) => {
      const paddleGroup = new THREE.Group();

      // Blade Wood Core
      const bladeGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.03, 32);
      bladeGeo.scale(1, 1, 1.15);
      const woodMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.6 });
      const blade = new THREE.Mesh(bladeGeo, woodMat);
      blade.rotation.x = Math.PI / 2;
      paddleGroup.add(blade);

      // Red Inverted Rubber (Player Front / Bot Back)
      const redRubberMat = new THREE.MeshPhysicalMaterial({
        color: 0xd90429,
        roughness: 0.35,
        clearcoat: 0.3
      });
      const redRubber = new THREE.Mesh(bladeGeo, redRubberMat);
      redRubber.rotation.x = Math.PI / 2;
      redRubber.position.z = isPlayer ? 0.02 : -0.02;
      paddleGroup.add(redRubber);

      // Black Inverted Rubber
      const blackRubberMat = new THREE.MeshPhysicalMaterial({
        color: 0x111827,
        roughness: 0.35,
        clearcoat: 0.3
      });
      const blackRubber = new THREE.Mesh(bladeGeo, blackRubberMat);
      blackRubber.rotation.x = Math.PI / 2;
      blackRubber.position.z = isPlayer ? -0.02 : 0.02;
      paddleGroup.add(blackRubber);

      // Handle
      const handleGeo = new THREE.BoxGeometry(0.14, 0.55, 0.08);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.set(0, -0.65, 0);
      paddleGroup.add(handle);

      return paddleGroup;
    };

    const playerPaddle = createPaddle(true);
    playerPaddle.position.set(0, 0.5, 3.4);
    scene.add(playerPaddle);

    const botPaddle = createPaddle(false);
    botPaddle.position.set(0, 0.5, -3.4);
    scene.add(botPaddle);

    // -----------------------------------------------------------------
    // 6. 3D PING PONG BALL & TRAIL
    // -----------------------------------------------------------------
    const ballGeo = new THREE.SphereGeometry(0.1, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.05
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.castShadow = true;
    ball.position.set(0, 0.4, 3.2);
    scene.add(ball);

    // Dynamic Trail Effect
    const TRAIL_COUNT = 16;
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(TRAIL_COUNT * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.PointsMaterial({
      color: 0x5f79ff,
      size: 0.08,
      transparent: true,
      opacity: 0.6
    });
    const ballTrail = new THREE.Points(trailGeo, trailMat);
    scene.add(ballTrail);

    // -----------------------------------------------------------------
    // 7. TARGET PRACTICE TARGETS
    // -----------------------------------------------------------------
    const targetsGroup = new THREE.Group();
    scene.add(targetsGroup);

    const activeTargets: { mesh: THREE.Mesh; pointVal: number; x: number; z: number }[] = [];
    const targetColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b];

    const spawnTarget = (x: number, z: number, val: number) => {
      const tGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.02, 32);
      const tMat = new THREE.MeshBasicMaterial({
        color: targetColors[Math.floor(Math.random() * targetColors.length)],
        wireframe: false
      });
      const tMesh = new THREE.Mesh(tGeo, tMat);
      tMesh.position.set(x, TABLE_HEIGHT / 2 + 0.015, z);
      targetsGroup.add(tMesh);
      activeTargets.push({ mesh: tMesh, pointVal: val, x, z });
    };

    // Spawn 3 initial targets on the bot's half of the table
    spawnTarget(-0.8, -1.8, 100);
    spawnTarget(0.8, -1.8, 100);
    spawnTarget(0, -2.2, 250);

    // -----------------------------------------------------------------
    // 8. SIMULATION STATE STORED IN REF
    // -----------------------------------------------------------------
    simRef.current = {
      scene,
      camera,
      renderer,
      playerPaddle,
      botPaddle,
      ball,
      table: tableGroup,
      targets: targetsGroup,
      ballTrail,
      trailPositions,
      ballPos: new THREE.Vector3(0, 0.4, 3.2),
      ballVel: new THREE.Vector3(0, 0, 0),
      ballSpin: new THREE.Vector3(0, 0, 0),
      playerTargetPos: new THREE.Vector3(0, 0.5, 3.4),
      botTargetPos: new THREE.Vector3(0, 0.5, -3.4),
      paddleTilt: { x: 0, y: 0, z: 0 },
      mousePos: { x: 0, y: 0 },
      lastTouchPos: { x: 0, y: 0 },
      lastHitBy: 'none',
      tableBounceCount: 0,
      lastBounceSide: 'none',
      isServing: true,
      server: 'player',
      activeTargets,
      reqId: null
    };

    // -----------------------------------------------------------------
    // 9. POINTER & TOUCH CONTROLS (FULL PADDLE CONTROL)
    // -----------------------------------------------------------------
    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (simRef.current) {
        simRef.current.mousePos.x = x;
        simRef.current.mousePos.y = y;

        // Map screen coordinates directly to 3D Table Area
        const targetX = x * (TABLE_WIDTH * 0.7);
        const targetY = 0.25 + (y + 1) * 0.7;
        const targetZ = 3.2 - Math.max(0, y) * 1.0;

        simRef.current.playerTargetPos.set(targetX, targetY, targetZ);

        // Paddle tilt based on motion and mouse location
        simRef.current.paddleTilt.x = -y * 0.4;
        simRef.current.paddleTilt.y = -x * 0.5;
        simRef.current.paddleTilt.z = -x * 0.3;
      }
    };

    const handlePointerDown = (e: PointerEvent | MouseEvent) => {
      if (!simRef.current) return;
      // If waiting to serve, hit the serve!
      if (simRef.current.isServing && simRef.current.server === 'player') {
        simRef.current.isServing = false;
        simRef.current.lastHitBy = 'player';
        simRef.current.tableBounceCount = 0;
        simRef.current.lastBounceSide = 'none';

        const serveSpeedZ = -6.5;
        const serveDirX = (simRef.current.mousePos.x || 0) * 2.2;
        simRef.current.ballVel.set(serveDirX, 2.2, serveSpeedZ);
        soundRef.current.playPaddleHit(1.2);
        triggerHaptic('medium');
      }
    };

    // Touch support for mobile devices
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);

        if (simRef.current) {
          simRef.current.mousePos.x = x;
          simRef.current.mousePos.y = y;

          const targetX = x * (TABLE_WIDTH * 0.7);
          const targetY = 0.2 + (y + 1) * 0.75;
          const targetZ = 3.2 - Math.max(0, y) * 1.1;

          simRef.current.playerTargetPos.set(targetX, targetY, targetZ);
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointermove', handlePointerMove);
    domEl.addEventListener('pointerdown', handlePointerDown);
    domEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    domEl.addEventListener('touchstart', () => {
      if (simRef.current?.isServing && simRef.current.server === 'player') {
        simRef.current.isServing = false;
        simRef.current.lastHitBy = 'player';
        simRef.current.ballVel.set((simRef.current.mousePos.x || 0) * 2.2, 2.2, -6.5);
        soundRef.current.playPaddleHit(1.2);
      }
    });

    // -----------------------------------------------------------------
    // 10. PHYSICS & ANIMATION TICK LOOP
    // -----------------------------------------------------------------
    let clock = new THREE.Clock();
    const GRAVITY = -9.8;
    const TABLE_TOP_Y = TABLE_HEIGHT / 2;

    const roundReset = (winner: 'player' | 'bot') => {
      if (!simRef.current) return;

      if (winner === 'player') {
        setPlayerScore(prev => {
          const next = prev + 1;
          if (next >= 12 && next - botScore >= 2) {
            setGameStatus('Victory! Champion of the Table!');
            showBanner('🏆 MATCH WON! EXCELLENT TABLE TENNIS!', 4000);
            soundRef.current.playScore(true);
          } else {
            showBanner(`Point for Player! (${next} - ${botScore})`);
            soundRef.current.playScore(true);
          }
          return next;
        });
      } else {
        setBotScore(prev => {
          const next = prev + 1;
          if (next >= 12 && next - playerScore >= 2) {
            setGameStatus('Match Over - Bot won the set');
            showBanner('Bot Won the Match. Practice and Rematch!', 4000);
            soundRef.current.playScore(false);
          } else {
            showBanner(`Point for Bot! (${playerScore} - ${next})`);
            soundRef.current.playScore(false);
          }
          return next;
        });
      }

      setRallyCount(0);
      simRef.current.isServing = true;
      simRef.current.server = winner === 'player' ? 'bot' : 'player';
      simRef.current.tableBounceCount = 0;
      simRef.current.lastHitBy = 'none';
      simRef.current.lastBounceSide = 'none';

      // Position ball with server
      if (simRef.current.server === 'player') {
        simRef.current.ballPos.set(simRef.current.playerPaddle.position.x, 0.4, 3.2);
        simRef.current.ballVel.set(0, 0, 0);
      } else {
        simRef.current.ballPos.set(0, 0.5, -3.2);
        simRef.current.ballVel.set(0, 0, 0);

        // Bot serves automatically after 1 second
        setTimeout(() => {
          if (simRef.current && simRef.current.isServing && simRef.current.server === 'bot') {
            simRef.current.isServing = false;
            simRef.current.lastHitBy = 'bot';
            const botTargetX = (Math.random() - 0.5) * 1.8;
            simRef.current.ballVel.set(botTargetX, 2.4, 6.2);
            soundRef.current.playPaddleHit(1.0);
          }
        }, 1200);
      }
    };

    const animate = () => {
      const dt = Math.min(0.04, clock.getDelta());
      const sim = simRef.current;

      if (sim && isPlaying && !isPaused) {
        // A. Smoothly interpolate player paddle towards target
        sim.playerPaddle.position.lerp(sim.playerTargetPos, 0.35);
        sim.playerPaddle.rotation.x = sim.paddleTilt.x;
        sim.playerPaddle.rotation.y = sim.paddleTilt.y;
        sim.playerPaddle.rotation.z = sim.paddleTilt.z;

        // B. AI Bot Paddle Decision Engine
        const botSkill = difficulty === 'easy' ? 0.08 : difficulty === 'medium' ? 0.16 : 0.28;
        if (sim.ballPos.z < 0.5 && sim.ballVel.z < 0) {
          // Track incoming ball
          const botTargetX = THREE.MathUtils.clamp(sim.ballPos.x, -TABLE_WIDTH / 2 + 0.4, TABLE_WIDTH / 2 - 0.4);
          const botTargetY = THREE.MathUtils.clamp(sim.ballPos.y, 0.25, 1.2);
          const botTargetZ = -3.4;
          sim.botTargetPos.set(botTargetX, botTargetY, botTargetZ);
        } else {
          // Return to center ready position
          sim.botTargetPos.set(0, 0.5, -3.4);
        }
        sim.botPaddle.position.lerp(sim.botTargetPos, botSkill);
        sim.botPaddle.rotation.y = -sim.botPaddle.position.x * 0.3;

        // C. Ball Physics and Trajectory (if not held on serve)
        if (sim.isServing) {
          if (sim.server === 'player') {
            sim.ballPos.set(sim.playerPaddle.position.x, sim.playerPaddle.position.y + 0.1, sim.playerPaddle.position.z - 0.2);
          } else {
            sim.ballPos.set(sim.botPaddle.position.x, sim.botPaddle.position.y + 0.1, sim.botPaddle.position.z + 0.2);
          }
        } else {
          // Apply Gravity
          sim.ballVel.y += GRAVITY * dt;

          // Update position
          sim.ballPos.x += sim.ballVel.x * dt;
          sim.ballPos.y += sim.ballVel.y * dt;
          sim.ballPos.z += sim.ballVel.z * dt;

          // Ball Rotation based on velocity
          sim.ball.rotation.x += sim.ballVel.z * dt * 2;
          sim.ball.rotation.z -= sim.ballVel.x * dt * 2;

          // -------------------------------------------------------------
          // COLLISION: TABLE SURFACE (Bounce)
          // -------------------------------------------------------------
          const isOverTableX = Math.abs(sim.ballPos.x) <= TABLE_WIDTH / 2;
          const isOverTableZ = Math.abs(sim.ballPos.z) <= TABLE_LENGTH / 2;

          if (isOverTableX && isOverTableZ) {
            if (sim.ballPos.y <= TABLE_TOP_Y + 0.08 && sim.ballVel.y < 0) {
              // Valid Table Bounce!
              sim.ballPos.y = TABLE_TOP_Y + 0.08;
              sim.ballVel.y = -sim.ballVel.y * 0.88; // Restitution
              sim.tableBounceCount++;

              const bounceSide = sim.ballPos.z > 0 ? 'player' : 'bot';
              soundRef.current.playTableBounce(Math.abs(sim.ballVel.y) * 0.1);

              // Check if double bounce occurred on same side
              if (sim.lastBounceSide === bounceSide && sim.lastHitBy !== 'none') {
                if (bounceSide === 'player') {
                  roundReset('bot');
                } else {
                  roundReset('player');
                }
              }
              sim.lastBounceSide = bounceSide;

              // Check Target Hit in Target Mode
              if (gameMode === 'target' && bounceSide === 'bot') {
                sim.activeTargets.forEach(target => {
                  const dist = Math.hypot(sim.ballPos.x - target.x, sim.ballPos.z - target.z);
                  if (dist < 0.4) {
                    setTargetHits(prev => prev + 1);
                    showBanner(`🎯 Bullseye Target Hit! +${target.pointVal} Pts!`, 1500);
                    soundRef.current.playScore(true);
                    triggerHaptic('heavy');
                  }
                });
              }
            }
          }

          // -------------------------------------------------------------
          // COLLISION: NET
          // -------------------------------------------------------------
          if (Math.abs(sim.ballPos.z) < 0.08 && Math.abs(sim.ballPos.x) <= (TABLE_WIDTH + 0.4) / 2) {
            if (sim.ballPos.y <= TABLE_TOP_Y + NET_HEIGHT) {
              sim.ballVel.z = -sim.ballVel.z * 0.3;
              sim.ballVel.y *= 0.5;
              soundRef.current.playNetHit();
            }
          }

          // -------------------------------------------------------------
          // COLLISION: PLAYER PADDLE HIT
          // -------------------------------------------------------------
          const distToPlayerPaddle = sim.ballPos.distanceTo(sim.playerPaddle.position);
          if (distToPlayerPaddle < 0.55 && sim.ballVel.z > 0 && sim.ballPos.z > 2.0) {
            // Hit by Player!
            sim.lastHitBy = 'player';
            sim.tableBounceCount = 0;
            sim.lastBounceSide = 'none';

            // Calculate directional return based on contact offset from paddle center
            const offsetX = (sim.ballPos.x - sim.playerPaddle.position.x) * 4.0;
            const returnSpeedZ = -6.8 - Math.random() * 1.5;
            const returnSpeedY = 2.4 + Math.max(0, -sim.paddleTilt.x * 2.0);

            sim.ballVel.set(offsetX + (sim.mousePos.x || 0) * 2.0, returnSpeedY, returnSpeedZ);

            soundRef.current.playPaddleHit(1.5);
            triggerHaptic('medium');

            setRallyCount(prev => {
              const next = prev + 1;
              setMaxRally(m => Math.max(m, next));
              if (next % 5 === 0) {
                showBanner(`🔥 ${next} Shot Rally Streak!`, 1500);
              }
              return next;
            });
          }

          // -------------------------------------------------------------
          // COLLISION: BOT PADDLE HIT
          // -------------------------------------------------------------
          const distToBotPaddle = sim.ballPos.distanceTo(sim.botPaddle.position);
          if (distToBotPaddle < 0.55 && sim.ballVel.z < 0 && sim.ballPos.z < -2.0) {
            // Hit by Bot!
            sim.lastHitBy = 'bot';
            sim.tableBounceCount = 0;
            sim.lastBounceSide = 'none';

            // Bot returns with controlled aim towards player side
            const targetX = (Math.random() - 0.5) * 1.8;
            const returnSpeedZ = 6.4 + Math.random() * 1.2;
            const returnSpeedY = 2.4;

            sim.ballVel.set(targetX, returnSpeedY, returnSpeedZ);
            soundRef.current.playPaddleHit(1.2);

            setRallyCount(prev => {
              const next = prev + 1;
              setMaxRally(m => Math.max(m, next));
              return next;
            });
          }

          // -------------------------------------------------------------
          // OUT OF BOUNDS & FLOOR DETECTION (Point scored)
          // -------------------------------------------------------------
          if (sim.ballPos.y < -0.8 || Math.abs(sim.ballPos.z) > 4.8 || Math.abs(sim.ballPos.x) > 3.5) {
            if (sim.lastHitBy === 'player') {
              if (sim.tableBounceCount === 0 || sim.lastBounceSide === 'player') {
                roundReset('bot'); // Player hit out without hitting opponent side
              } else {
                roundReset('player'); // Bot failed to return
              }
            } else if (sim.lastHitBy === 'bot') {
              if (sim.tableBounceCount === 0 || sim.lastBounceSide === 'bot') {
                roundReset('player');
              } else {
                roundReset('bot');
              }
            } else {
              // Missed serve
              roundReset(sim.server === 'player' ? 'bot' : 'player');
            }
          }
        }

        // Apply ball position to 3D Mesh
        sim.ball.position.copy(sim.ballPos);

        // Update Ball Trail
        for (let i = TRAIL_COUNT - 1; i > 0; i--) {
          sim.trailPositions[i * 3] = sim.trailPositions[(i - 1) * 3];
          sim.trailPositions[i * 3 + 1] = sim.trailPositions[(i - 1) * 3 + 1];
          sim.trailPositions[i * 3 + 2] = sim.trailPositions[(i - 1) * 3 + 2];
        }
        sim.trailPositions[0] = sim.ballPos.x;
        sim.trailPositions[1] = sim.ballPos.y;
        sim.trailPositions[2] = sim.ballPos.z;
        sim.ballTrail.geometry.attributes.position.needsUpdate = true;

        // Camera POV Updates
        if (cameraView === 'player') {
          sim.camera.position.set(sim.playerPaddle.position.x * 0.4, 2.2, 5.4);
          sim.camera.lookAt(0, 0.2, -1.0);
        } else if (cameraView === 'tv') {
          sim.camera.position.set(0, 3.8, 6.2);
          sim.camera.lookAt(0, 0, 0);
        } else if (cameraView === 'side') {
          sim.camera.position.set(4.8, 2.0, 0);
          sim.camera.lookAt(0, 0.2, 0);
        }

        sim.renderer.render(sim.scene, sim.camera);
      }

      simRef.current!.reqId = requestAnimationFrame(animate);
    };

    simRef.current.reqId = requestAnimationFrame(animate);

    // Resize Observer for dynamic full big screen scaling
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && simRef.current) {
          simRef.current.camera.aspect = w / h;
          simRef.current.camera.updateProjectionMatrix();
          simRef.current.renderer.setSize(w, h);
        }
      }
    });

    if (container) {
      resizeObserver.observe(container);
    }

    const handleWindowResize = () => {
      if (!container || !simRef.current) return;
      const rect = container.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;
      simRef.current.camera.aspect = w / h;
      simRef.current.camera.updateProjectionMatrix();
      simRef.current.renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleWindowResize);

    // Keyboard Shortcuts Support
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (simRef.current?.isServing && simRef.current.server === 'player') {
          simRef.current.isServing = false;
          simRef.current.lastHitBy = 'player';
          simRef.current.tableBounceCount = 0;
          simRef.current.lastBounceSide = 'none';
          simRef.current.ballVel.set((simRef.current.mousePos.x || 0) * 2.2, 2.2, -6.5);
          soundRef.current.playPaddleHit(1.2);
          triggerHaptic('medium');
        }
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullscreen(prev => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted(prev => !prev);
      } else if (e.key === '1') {
        setCameraView('player');
      } else if (e.key === '2') {
        setCameraView('tv');
      } else if (e.key === '3') {
        setCameraView('side');
      } else if (e.key === 'r' || e.key === 'R') {
        startNewMatch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (simRef.current?.reqId) {
        cancelAnimationFrame(simRef.current.reqId);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('keydown', handleKeyDown);
      domEl.removeEventListener('pointermove', handlePointerMove);
      domEl.removeEventListener('pointerdown', handlePointerDown);
      domEl.removeEventListener('touchmove', handleTouchMove);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme, isPlaying, isPaused, cameraView, difficulty, gameMode, triggerHaptic, showBanner, startNewMatch]);

  // Toggle Browser & CSS Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  return (
    <div
      className={`relative w-full overflow-hidden select-none transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#090d16] flex flex-col w-screen h-screen'
          : isEmbedded
          ? 'rounded-2xl border border-[#d9defc] dark:border-[#263244] bg-[#ffffff] dark:bg-[#141a24] shadow-md flex flex-col'
          : 'w-full h-full flex-1 flex flex-col bg-[#090d16] border-0 shadow-2xl'
      }`}
    >
      {/* In Fullscreen Mode: Minimalist Overlay with ONLY Game Score Number & 2-Arrow Minimize Button */}
      {isFullscreen ? (
        <>
          {/* Minimalist Top HUD: Game Numbers and 2-Arrow Exit Button */}
          <div className="absolute top-4 left-0 right-0 px-6 flex items-center justify-between z-30 pointer-events-none">
            {/* Left placeholder to keep score centered */}
            <div className="w-10" />

            {/* Game Number Scoreboard */}
            <div className="flex items-center gap-3 bg-[#0a0f1d]/90 backdrop-blur-md px-5 py-2 rounded-2xl border border-[#26334d] shadow-2xl pointer-events-auto">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-[#64748b] block tracking-wider">YOU</span>
                <span className="text-xl sm:text-2xl font-black text-[#7b8eff] font-mono leading-none">{playerScore}</span>
              </div>
              <span className="text-base font-extrabold text-[#475569]">:</span>
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-[#64748b] block tracking-wider">BOT</span>
                <span className="text-xl sm:text-2xl font-black text-[#d90429] font-mono leading-none">{botScore}</span>
              </div>
            </div>

            {/* That 2-Arrow Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="pointer-events-auto p-2.5 rounded-xl text-white bg-[#1e293b]/90 hover:bg-[#334155] border border-[#475569] shadow-2xl transition-transform hover:scale-110 active:scale-95"
              title="Exit Fullscreen (F)"
              id="exit-fullscreen-btn"
            >
              <Minimize2 className="w-5 h-5 text-[#f59e0b]" />
            </button>
          </div>
        </>
      ) : (
        /* Regular Non-Fullscreen Header / Scoreboard HUD */
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1322]/95 border-b border-[#1e293b] backdrop-blur-md z-20 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d90429] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#7b8eff] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#f59e0b]" /> PingPong 3D Arena
              </span>
            </div>

            {/* Mode Badge */}
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#1e2a4a] text-[#a5b4fc] border border-[#3b4b75]">
              {gameMode === 'match' ? 'Championship Match' : gameMode === 'rally' ? 'Endless Rally' : 'Target Practice'}
            </span>
          </div>

          {/* Live HUD Match Score & Streak */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 bg-[#0a0f1d] px-3.5 py-1 rounded-xl border border-[#26334d] shadow-inner">
              <div className="text-center">
                <span className="text-[9px] uppercase font-bold text-[#64748b] block">YOU</span>
                <span className="text-sm sm:text-base font-extrabold text-[#7b8eff] font-mono">{playerScore}</span>
              </div>
              <span className="text-xs font-bold text-[#475569]">:</span>
              <div className="text-center">
                <span className="text-[9px] uppercase font-bold text-[#64748b] block">BOT</span>
                <span className="text-sm sm:text-base font-extrabold text-[#d90429] font-mono">{botScore}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f8fafc] bg-[#1e293b] px-2.5 py-1 rounded-lg border border-[#334155]">
              <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>Rally: {rallyCount}</span>
              <span className="text-[10px] text-[#94a3b8] hidden md:inline">(Best: {maxRally})</span>
            </div>

            {/* Controls: Sound, Fullscreen, Close */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMuted(prev => !prev)}
                className="p-2 rounded-lg text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] transition-colors"
                title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#38bdf8]" />}
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] transition-colors bg-[#1e293b]/50 border border-[#334155]"
                title="Enter Big Fullscreen (F)"
                id="enter-fullscreen-btn"
              >
                <Maximize2 className="w-4 h-4 text-[#f59e0b]" />
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#450a0a] transition-colors"
                  title="Close Game"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3D WebGL Canvas Full Viewport Container */}
      <div className="relative flex-1 w-full h-full min-h-[400px] overflow-hidden bg-[#090d16] flex items-center justify-center">
        <div
          ref={containerRef}
          className="w-full h-full absolute inset-0 cursor-crosshair touch-none"
        />

        {/* Realtime Announcement Banner */}
        {announcement && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#0f172a]/90 backdrop-blur-md text-white px-5 py-2 rounded-full text-xs sm:text-sm font-bold shadow-2xl border border-[#3b82f6] animate-in fade-in zoom-in duration-200 pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
            <span>{announcement}</span>
          </div>
        )}

        {/* Serve Floating Action Prompt on Screen */}
        {simRef.current?.isServing && simRef.current.server === 'player' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
            <button
              onClick={() => {
                if (simRef.current?.isServing && simRef.current.server === 'player') {
                  simRef.current.isServing = false;
                  simRef.current.lastHitBy = 'player';
                  simRef.current.ballVel.set((simRef.current.mousePos.x || 0) * 2.2, 2.2, -6.5);
                  soundRef.current.playPaddleHit(1.2);
                  triggerHaptic('medium');
                }
              }}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#5f79ff] to-[#3b82f6] text-white text-xs sm:text-sm font-extrabold shadow-2xl shadow-blue-500/50 border border-white/20 animate-bounce hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>🏓</span>
              <span>TAP / CLICK OR SPACE TO SERVE</span>
            </button>
          </div>
        )}

        {/* Keyboard Controls Tip (Desktop, only when NOT in fullscreen) */}
        {!isFullscreen && (
          <div className="hidden lg:flex absolute bottom-3 right-4 z-20 items-center gap-2 text-[10px] text-[#64748b] bg-[#0f172a]/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#1e293b] pointer-events-none">
            <span><kbd className="px-1 py-0.5 bg-[#1e293b] text-[#94a3b8] rounded font-mono">SPACE</kbd> Serve</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.5 bg-[#1e293b] text-[#94a3b8] rounded font-mono">F</kbd> Fullscreen</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.5 bg-[#1e293b] text-[#94a3b8] rounded font-mono">1/2/3</kbd> Camera</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.5 bg-[#1e293b] text-[#94a3b8] rounded font-mono">M</kbd> Mute</span>
          </div>
        )}
      </div>

      {/* Bottom Mode Toolbar & Camera Selector (Hidden in Fullscreen Mode) */}
      {!isFullscreen && (
        <div className="p-2.5 sm:p-3 bg-[#0d1322]/95 border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-2 z-20 text-white flex-shrink-0">
          {/* Mode Selector */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => {
                setGameMode('match');
                startNewMatch('match');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                gameMode === 'match'
                  ? 'bg-[#5f79ff] text-white shadow-xs'
                  : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> Match 1v1
            </button>
            <button
              onClick={() => {
                setGameMode('rally');
                startNewMatch('rally');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                gameMode === 'rally'
                  ? 'bg-[#5f79ff] text-white shadow-xs'
                  : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Endless Rally
            </button>
            <button
              onClick={() => {
                setGameMode('target');
                startNewMatch('target');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                gameMode === 'target'
                  ? 'bg-[#5f79ff] text-white shadow-xs'
                  : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" /> Target Drill
            </button>
          </div>

          {/* Difficulty & Camera Views */}
          <div className="flex items-center gap-2">
            {/* Difficulty */}
            <div className="flex items-center bg-[#1e293b] p-0.5 rounded-lg text-[11px] font-semibold border border-[#334155]">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-2 py-1 rounded-md capitalize transition-colors ${
                    difficulty === d
                      ? 'bg-[#5f79ff] text-white shadow-xs'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Camera View */}
            <div className="flex items-center bg-[#1e293b] p-0.5 rounded-lg text-[11px] font-semibold border border-[#334155]">
              {(['player', 'tv', 'side'] as CameraView[]).map(v => (
                <button
                  key={v}
                  onClick={() => setCameraView(v)}
                  className={`px-2 py-1 rounded-md capitalize transition-colors ${
                    cameraView === v
                      ? 'bg-[#5f79ff] text-white shadow-xs'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Reset / Rematch */}
            <button
              onClick={() => startNewMatch()}
              className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e293b] transition-colors border border-[#334155]"
              title="Reset Game / Rematch (R)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
