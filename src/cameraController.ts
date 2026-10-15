import * as THREE from 'three';
import { CameraPreset } from './types';

export interface CameraRig {
  camera: THREE.PerspectiveCamera;
  currentPreset: CameraPreset;
  setPreset: (preset: CameraPreset) => void;
  startTour: (onStep?: (stage: string, timeOfDay: number, rain: boolean) => void) => void;
  stopTour: () => void;
  isTouring: boolean;
  update: (delta: number) => void;
  handlePointerDown: (e: PointerEvent) => void;
  handlePointerMove: (e: PointerEvent, onSpin: (dx: number, dy: number) => void) => void;
  handlePointerUp: () => void;
}

const PRESETS: Record<CameraPreset, { pos: THREE.Vector3; target: THREE.Vector3; fov: number }> = {
  // "Begin slightly above and to the left, with the orb filling about sixty percent of the image height"
  orb: {
    pos: new THREE.Vector3(-2.8, 1.9, 5.4),
    target: new THREE.Vector3(0, -0.15, 0),
    fov: 44,
  },
  surface: {
    pos: new THREE.Vector3(-0.6, 0.8, 2.5),
    target: new THREE.Vector3(0.25, 0.45, 0.8),
    fov: 48,
  },
  orbit: {
    pos: new THREE.Vector3(0.0, 3.8, 3.8),
    target: new THREE.Vector3(0, 0, 0),
    fov: 42,
  },
  village: {
    pos: new THREE.Vector3(0.8, 1.1, 1.9),
    target: new THREE.Vector3(0.28, 0.5, 0.78),
    fov: 52,
  },
};

export function createCameraController(domElement: HTMLElement): CameraRig {
  const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.copy(PRESETS.orb.pos);

  const currentTarget = PRESETS.orb.target.clone();
  const desiredPos = PRESETS.orb.pos.clone();
  const desiredTarget = PRESETS.orb.target.clone();
  let desiredFov = PRESETS.orb.fov;

  let currentPreset: CameraPreset = 'orb';
  let isTouring = false;
  let tourProgress = 0; // 0 to 25s
  let tourCallback: ((stage: string, timeOfDay: number, rain: boolean) => void) | undefined;

  let isPointerDown = false;
  let prevPointerX = 0;
  let prevPointerY = 0;

  const setPreset = (preset: CameraPreset) => {
    if (isTouring) stopTour();
    currentPreset = preset;
    const p = PRESETS[preset];
    desiredPos.copy(p.pos);
    desiredTarget.copy(p.target);
    desiredFov = p.fov;
  };

  const startTour = (onStep?: (stage: string, timeOfDay: number, rain: boolean) => void) => {
    isTouring = true;
    tourProgress = 0;
    tourCallback = onStep;
  };

  const stopTour = () => {
    isTouring = false;
    tourProgress = 0;
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    isPointerDown = true;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
    if (isTouring) {
      stopTour();
    }
  };

  const handlePointerMove = (e: PointerEvent, onSpin: (dx: number, dy: number) => void) => {
    if (!isPointerDown) return;
    const dx = e.clientX - prevPointerX;
    const dy = e.clientY - prevPointerY;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;

    // Apply spin velocity to planet
    onSpin(dy * 0.0035, dx * 0.0035);
  };

  const handlePointerUp = () => {
    isPointerDown = false;
  };

  // 25-Second Cinematic Tour Sequence
  const updateTour = (delta: number) => {
    tourProgress += delta;

    if (tourProgress >= 25.0) {
      stopTour();
      setPreset('orb');
      return;
    }

    // Phase 1: 0 - 6s (Morning domestic orb view gliding toward sunny village)
    if (tourProgress < 6.0) {
      const t = tourProgress / 6.0;
      desiredPos.lerpVectors(PRESETS.orb.pos, PRESETS.surface.pos, t);
      desiredTarget.lerpVectors(PRESETS.orb.target, PRESETS.surface.target, t);
      desiredFov = THREE.MathUtils.lerp(PRESETS.orb.fov, PRESETS.surface.fov, t);
      if (tourCallback) tourCallback('Morning in Little Meadow: Planting & Awakening', 0.15 + t * 0.1, false);
    }
    // Phase 2: 6 - 12s (Passing Rain shower watering the ground and trees)
    else if (tourProgress < 12.0) {
      const t = (tourProgress - 6.0) / 6.0;
      desiredPos.lerpVectors(PRESETS.surface.pos, PRESETS.village.pos, t);
      desiredTarget.lerpVectors(PRESETS.surface.target, PRESETS.village.target, t);
      desiredFov = THREE.MathUtils.lerp(PRESETS.surface.fov, PRESETS.village.fov, t);
      if (tourCallback) tourCallback('Passing Summer Rain Shower', 0.25, true);
    }
    // Phase 3: 12 - 18s (Golden Hour: Sunlight advances village growth & windmill spins)
    else if (tourProgress < 18.0) {
      const t = (tourProgress - 12.0) / 6.0;
      desiredPos.lerpVectors(PRESETS.village.pos, PRESETS.orbit.pos, t);
      desiredTarget.lerpVectors(PRESETS.village.target, PRESETS.orbit.target, t);
      desiredFov = THREE.MathUtils.lerp(PRESETS.village.fov, PRESETS.orbit.fov, t);
      const timeOfDay = 0.25 + t * 0.25; // day into sunset 0.5
      if (tourCallback) tourCallback('Golden Hour: Sun Sinks Across the Mini Horizon', timeOfDay, false);
    }
    // Phase 4: 18 - 25s (Nightfall: Cottages candlelit, sweeping lighthouse beam, fireflies!)
    else {
      const t = (tourProgress - 18.0) / 7.0;
      desiredPos.lerpVectors(PRESETS.orbit.pos, PRESETS.orb.pos, t);
      desiredTarget.lerpVectors(PRESETS.orbit.target, PRESETS.orb.target, t);
      desiredFov = THREE.MathUtils.lerp(PRESETS.orbit.fov, PRESETS.orb.fov, t);
      const timeOfDay = 0.5 + t * 0.22; // twilight into night 0.72
      if (tourCallback) tourCallback('Nightfall: Candlelit Windows, Lighthouse Beam & Fireflies', timeOfDay, false);
    }
  };

  const update = (delta: number) => {
    if (isTouring) {
      updateTour(delta);
    }

    // Silky-Smooth Exponential Damping (per Three.js skill directives)
    camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredPos.x, 5.0, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredPos.y, 5.0, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredPos.z, 5.0, delta);

    currentTarget.x = THREE.MathUtils.damp(currentTarget.x, desiredTarget.x, 5.0, delta);
    currentTarget.y = THREE.MathUtils.damp(currentTarget.y, desiredTarget.y, 5.0, delta);
    currentTarget.z = THREE.MathUtils.damp(currentTarget.z, desiredTarget.z, 5.0, delta);

    if (Math.abs(camera.fov - desiredFov) > 0.1) {
      camera.fov = THREE.MathUtils.damp(camera.fov, desiredFov, 4.0, delta);
      camera.updateProjectionMatrix();
    }

    camera.lookAt(currentTarget);
  };

  return {
    camera,
    currentPreset,
    setPreset,
    startTour,
    stopTour,
    get isTouring() {
      return isTouring;
    },
    update,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
