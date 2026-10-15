import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createRoomEnvironment, RoomRig } from './roomEnvironment';
import { createPlanet, PlanetRig } from './planet';
import { createCameraController, CameraRig } from './cameraController';
import { ControlDock } from './ControlDock';
import { ToolType, CameraPreset, WorldStats } from './types';
import { sounds } from './sound';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // UI state
  const [worldStats, setWorldStats] = useState<WorldStats>({
    name: 'Little Meadow',
    day: 1,
    timeOfDay: 0.28, // Golden morning / mid-day
    population: 12,
    happiness: 96,
    villagerCount: 12,
    sheepCount: 8,
    treeCount: 10,
    homeCount: 4,
    isRaining: false,
    rainTimeRemaining: 0,
  });

  const [currentTool, setCurrentTool] = useState<ToolType>('inspect');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('orb');
  const [isTouring, setIsTouring] = useState(false);
  const [tourMessage, setTourMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // References to active 3D rigs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planetRigRef = useRef<PlanetRig | null>(null);
  const roomRigRef = useRef<RoomRig | null>(null);
  const cameraRigRef = useRef<CameraRig | null>(null);
  const statsRef = useRef(worldStats);
  statsRef.current = worldStats;

  const currentToolRef = useRef(currentTool);
  currentToolRef.current = currentTool;

  // Sound mute toggle
  const handleToggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    sounds.setMuted(next);
  }, [isMuted]);

  // World Name update
  const handleUpdateWorldName = useCallback((name: string) => {
    setWorldStats((prev) => ({ ...prev, name }));
  }, []);

  // Time of Day change from UI slider
  const handleTimeChange = useCallback((time: number) => {
    setWorldStats((prev) => ({ ...prev, timeOfDay: time }));
  }, []);

  // Camera preset change
  const handleSelectCamera = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    cameraRigRef.current?.setPreset(preset);
  }, []);

  // Grow Village trigger
  const handleGrow = useCallback(() => {
    if (planetRigRef.current) {
      planetRigRef.current.growVillage();
      setWorldStats((prev) => {
        const nextTrees = prev.treeCount + 1;
        const nextHomes = prev.homeCount + 1;
        const nextPop = prev.villagerCount + 1;
        return {
          ...prev,
          treeCount: nextTrees,
          homeCount: nextHomes,
          villagerCount: nextPop,
          population: nextPop,
          happiness: Math.min(100, Math.round(90 + nextTrees * 0.8 + nextHomes * 0.5)),
        };
      });
    }
  }, []);

  // Rain Shower trigger
  const handleTriggerRain = useCallback(() => {
    if (planetRigRef.current) {
      planetRigRef.current.triggerRain();
      setWorldStats((prev) => ({ ...prev, isRaining: true, rainTimeRemaining: 8.0 }));
    }
  }, []);

  // Start Cinematic Tour
  const handleStartTour = useCallback(() => {
    setIsTouring(true);
    cameraRigRef.current?.startTour((stage, timeOfDay, rain) => {
      setTourMessage(stage);
      setWorldStats((prev) => ({
        ...prev,
        timeOfDay,
        isRaining: rain,
      }));
      if (rain && planetRigRef.current) {
        planetRigRef.current.triggerRain();
      }
    });
  }, []);

  // Stop Tour
  const handleStopTour = useCallback(() => {
    setIsTouring(false);
    setTourMessage('');
    cameraRigRef.current?.stopTour();
  }, []);

  // Mount 3D Scene
  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    // 1. Scene & Renderer
    const scene = new THREE.Scene();
    scene.name = 'TerrariumScene';
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountEl.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Studio Environment for crisp reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 3. Room Environment (Windowsill, Walnut Stand, Brass Collar, Cloth, Succulent, Lavender Sky, Glass Orb)
    const roomRig = createRoomEnvironment();
    scene.add(roomRig.roomGroup);
    roomRigRef.current = roomRig;

    // 4. Faceted Miniature Planet (Central suspended sphere with terrain, sun/moon, villagers, sheep, clouds)
    const planetRig = createPlanet();
    scene.add(planetRig.planetGroup);
    planetRigRef.current = planetRig;

    // 5. Camera & Controller
    const cameraRig = createCameraController(renderer.domElement);
    cameraRigRef.current = cameraRig;

    // Raycaster for placing objects, sculpting terrain, and interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isDragging = false;
    let downPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = false;
      downPos = { x: e.clientX, y: e.clientY };
      cameraRig.handlePointerDown(e);
      sounds.startAmbient();
    };

    const onPointerMove = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (dist > 4) {
        isDragging = true;
      }
      cameraRig.handlePointerMove(e, (dy, dx) => {
        // Drag empty space or planet to spin with gentle inertia!
        planetRig.spinVelocity.x += dy * 1.8;
        planetRig.spinVelocity.y += dx * 1.8;
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      cameraRig.handlePointerUp();

      // If user clicked without dragging, handle tool interaction!
      if (!isDragging) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, cameraRig.camera);

        const activeTool = currentToolRef.current;

        if (activeTool === 'remove') {
          // Check intersection with all children of planet
          const intersects = raycaster.intersectObjects(planetRig.planetGroup.children, true);
          for (const hit of intersects) {
            if (hit.object !== planetRig.terrainMesh && hit.object !== planetRig.waterMesh) {
              const removed = planetRig.removeItemAt(hit.object);
              if (removed) break;
            }
          }
        } else if (activeTool === 'raise_land') {
          const intersects = raycaster.intersectObject(planetRig.terrainMesh, false);
          if (intersects.length > 0) {
            // Convert intersection point to planet local coordinates
            const localPoint = planetRig.planetGroup.worldToLocal(intersects[0].point.clone());
            planetRig.raiseLandAt(localPoint, 0.035);
          }
        } else if (activeTool === 'lower_land') {
          const intersects = raycaster.intersectObject(planetRig.terrainMesh, false);
          if (intersects.length > 0) {
            const localPoint = planetRig.planetGroup.worldToLocal(intersects[0].point.clone());
            planetRig.raiseLandAt(localPoint, -0.035);
          }
        } else if (activeTool === 'inspect') {
          // Interactive inspect: Check if sheep or villager was clicked
          const intersects = raycaster.intersectObjects(planetRig.planetGroup.children, true);
          let handled = false;
          for (const hit of intersects) {
            let cur: THREE.Object3D | null = hit.object;
            while (cur && cur !== planetRig.planetGroup) {
              if (cur.name === 'Sheep') {
                sounds.playSheepBleat();
                planetRig.triggerSparkles(hit.point);
                handled = true;
                break;
              }
              if (cur.name === 'Villager') {
                sounds.playPlace();
                planetRig.triggerSparkles(hit.point);
                handled = true;
                break;
              }
              cur = cur.parent;
            }
            if (handled) break;
          }
        } else {
          // Placement Tools (oak_tree, pine_tree, palm_tree, cottage, windmill, lighthouse, well, etc.)
          const intersects = raycaster.intersectObject(planetRig.terrainMesh, false);
          if (intersects.length > 0) {
            const hit = intersects[0];
            const localPoint = planetRig.planetGroup.worldToLocal(hit.point.clone());
            const normal = localPoint.clone().normalize();
            const elevation = localPoint.length() - 1.45;

            const placed = planetRig.placeItemAt(activeTool, normal, elevation);
            if (placed) {
              setWorldStats((prev) => {
                const nextTree = activeTool.includes('tree') ? prev.treeCount + 1 : prev.treeCount;
                const nextHome = activeTool === 'cottage' ? prev.homeCount + 1 : prev.homeCount;
                const nextVillagers = activeTool === 'villager' ? prev.villagerCount + 1 : prev.villagerCount;
                const nextSheep = activeTool === 'sheep' ? prev.sheepCount + 1 : prev.sheepCount;
                return {
                  ...prev,
                  treeCount: nextTree,
                  homeCount: nextHome,
                  villagerCount: nextVillagers,
                  sheepCount: nextSheep,
                  population: nextVillagers,
                  happiness: Math.min(100, Math.round(85 + nextTree * 0.8 + nextHome * 1.2 + nextSheep * 0.5)),
                };
              });
            }
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Window Resize Handler
    const onResize = () => {
      cameraRig.camera.aspect = window.innerWidth / window.innerHeight;
      cameraRig.camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // 6. Animation Render Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Advance time of day slowly (1 full day every 160 seconds unless touring)
      let curTimeOfDay = statsRef.current.timeOfDay;
      if (!cameraRig.isTouring) {
        curTimeOfDay = (curTimeOfDay + delta * 0.006) % 1.0;
        // Periodic day counter increment
        const nextDay = Math.floor(elapsedTime / 160) + 1;
        setWorldStats((prev) => ({
          ...prev,
          timeOfDay: curTimeOfDay,
          day: nextDay,
        }));
      }

      // Update room lighting & fireflies
      const isNight = curTimeOfDay > 0.45 && curTimeOfDay < 0.92;
      roomRig.updateTimeOfDay(curTimeOfDay);
      roomRig.updateFireflies(elapsedTime, isNight);

      // Update planet, celestial bodies, clouds, villagers, sheep, rain
      planetRig.update(delta, elapsedTime, curTimeOfDay);

      // Update camera smooth kinematics / tour
      cameraRig.update(delta);

      // Render final scene
      renderer.render(scene, cameraRig.camera);
    };

    tick();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-stone-900 font-sans">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="absolute inset-0 z-0 touch-none cursor-grab active:cursor-grabbing" />

      {/* Ergonomic Collapsible Cream-and-Pastel Control Dock */}
      <ControlDock
        stats={worldStats}
        currentTool={currentTool}
        onSelectTool={setCurrentTool}
        cameraPreset={cameraPreset}
        onSelectCamera={handleSelectCamera}
        onGrow={handleGrow}
        onTriggerRain={handleTriggerRain}
        onTimeChange={handleTimeChange}
        onStartTour={handleStartTour}
        isTouring={isTouring}
        tourMessage={tourMessage}
        onStopTour={handleStopTour}
        onUpdateWorldName={handleUpdateWorldName}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />
    </div>
  );
}
