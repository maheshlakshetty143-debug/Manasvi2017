import * as THREE from 'three';
import {
  createOakTree,
  createPineTree,
  createPalmTree,
  createHouse,
  createWindmill,
  createLighthouse,
  createStoneWell,
  createFence,
  createFlowerPatch,
  createMountainPeak,
  createCloud,
  createVillager,
  createSheep,
  updateEmissives,
} from './proceduralModels';
import { ToolType, PlacedItem, VillagerActor, SheepActor } from './types';
import { sounds } from './sound';

// Math helpers
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _quat = new THREE.Quaternion();

export interface PlanetRig {
  planetGroup: THREE.Group;
  terrainMesh: THREE.Mesh;
  waterMesh: THREE.Mesh;
  sunGroup: THREE.Group;
  moonGroup: THREE.Group;
  sunLight: THREE.DirectionalLight;
  moonLight: THREE.DirectionalLight;
  placedItems: Map<string, { item: PlacedItem; object: THREE.Group; targetScale: number }>;
  villagers: Map<string, { actor: VillagerActor; model: ReturnType<typeof createVillager> }>;
  sheepList: Array<{ actor: SheepActor; model: ReturnType<typeof createSheep> }>;
  clouds: Array<{ group: THREE.Group; angle: number; speed: number; height: number; inclination: number }>;
  lighthouseBeam: THREE.Mesh | null;
  windmillSails: THREE.Group | null;
  spinVelocity: { x: number; y: number };
  rainParticles: THREE.Points;
  sparkleParticles: THREE.Points;
  triggerRain: () => void;
  triggerSparkles: (pos: THREE.Vector3) => void;
  placeItemAt: (type: ToolType, normal: THREE.Vector3, elevation: number) => PlacedItem | null;
  raiseLandAt: (hitPos: THREE.Vector3, amount: number) => void;
  removeItemAt: (hitObject: THREE.Object3D) => boolean;
  growVillage: () => void;
  update: (delta: number, time: number, timeOfDay: number) => void;
}

export function createPlanet(): PlanetRig {
  const planetGroup = new THREE.Group();
  planetGroup.name = 'PlanetGroup';

  const baseRadius = 1.45;
  const waterRadius = 1.41;

  // 1. Faceted Terrain Geometry
  // We use a finely subdivided sphere that we perturb with gentle noise and color by height/biome
  const terrainGeo = new THREE.IcosahedronGeometry(baseRadius, 5);
  terrainGeo.deleteAttribute('uv');

  const posAttr = terrainGeo.attributes.position;
  const vertCount = posAttr.count;

  // Store original normalized base directions and elevations
  const baseElevations = new Float32Array(vertCount);
  const colors = new Float32Array(vertCount * 3);

  // Biome color palette per prompt:
  // 3 shades of grassy hills: lime meadow, olive grass, sunlit sage
  const colorLimeMeadow = new THREE.Color(0x76b041);
  const colorOliveGrass = new THREE.Color(0x567d30);
  const colorSagePlateau = new THREE.Color(0x889d6e);
  const colorSandBeach = new THREE.Color(0xf2dba3);
  const colorDeepSeaBed = new THREE.Color(0x286378);
  const colorSnow = new THREE.Color(0xf4f7f6);
  const colorMountainRock = new THREE.Color(0x6c6e73);

  // Procedural height generation with 2 shallow seas and 1 snowy polar mountain
  for (let i = 0; i < vertCount; i++) {
    _v1.fromBufferAttribute(posAttr, i);
    const dir = _v1.clone().normalize();

    // Polar distance: North pole has high mountain
    const northDist = Math.acos(Math.max(-1, Math.min(1, dir.y))); // 0 at north pole, PI at south

    // Sea 1 centered at (lat ~0.2, lon ~1.2), Sea 2 at (lat ~ -0.3, lon ~ -1.5)
    const sea1Dist = dir.distanceTo(new THREE.Vector3(0.7, 0.2, 0.6).normalize());
    const sea2Dist = dir.distanceTo(new THREE.Vector3(-0.8, -0.2, -0.5).normalize());

    // Mountain peak near north pole (dir.y > 0.7)
    let elev = 0;

    // Mountain crag
    if (northDist < 0.65) {
      elev += (0.65 - northDist) * 0.45;
    }

    // Gentle rolling hills
    const hillNoise =
      Math.sin(dir.x * 5.0) * Math.cos(dir.z * 5.0) * 0.04 +
      Math.sin(dir.y * 7.0 + dir.x * 4.0) * 0.025;
    elev += hillNoise;

    // Sea depressions
    if (sea1Dist < 0.68) {
      const depth = Math.cos((sea1Dist / 0.68) * (Math.PI / 2)) * 0.085;
      elev -= depth;
    }
    if (sea2Dist < 0.62) {
      const depth = Math.cos((sea2Dist / 0.62) * (Math.PI / 2)) * 0.08;
      elev -= depth;
    }

    baseElevations[i] = elev;
    const finalR = baseRadius + elev;
    _v1.copy(dir).multiplyScalar(finalR);
    posAttr.setXYZ(i, _v1.x, _v1.y, _v1.z);

    // Compute biome vertex color
    const c = new THREE.Color();
    if (finalR < waterRadius - 0.015) {
      c.copy(colorDeepSeaBed);
    } else if (finalR <= waterRadius + 0.025) {
      c.copy(colorSandBeach);
    } else if (finalR > baseRadius + 0.16) {
      if (dir.y > 0.8) {
        c.copy(colorSnow);
      } else {
        c.copy(colorMountainRock);
      }
    } else if (finalR > baseRadius + 0.07) {
      c.copy(colorSagePlateau);
    } else if (finalR > baseRadius + 0.02) {
      c.copy(colorOliveGrass);
    } else {
      c.copy(colorLimeMeadow);
    }

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.82,
    metalness: 0.02,
    flatShading: true, // Gentle irregular facets per prompt
  });

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.name = 'FacetedTerrain';
  terrainMesh.castShadow = true;
  terrainMesh.receiveShadow = true;
  planetGroup.add(terrainMesh);

  // 2. Animated Shallow Turquoise Seas
  // Prompt: "two shallow turquoise seas... Seas should appear shallow near the sand and deepen in color farther from shore, with modest surface movement."
  const waterGeo = new THREE.IcosahedronGeometry(waterRadius, 5);
  const waterColors = new Float32Array(waterGeo.attributes.position.count * 3);
  const shallowColor = new THREE.Color(0x38e4d8);
  const deepColor = new THREE.Color(0x0e7c9b);

  for (let i = 0; i < waterGeo.attributes.position.count; i++) {
    _v1.fromBufferAttribute(waterGeo.attributes.position, i).normalize();
    const sea1Dist = _v1.distanceTo(new THREE.Vector3(0.7, 0.2, 0.6).normalize());
    const sea2Dist = _v1.distanceTo(new THREE.Vector3(-0.8, -0.2, -0.5).normalize());
    const minDist = Math.min(sea1Dist, sea2Dist);

    const t = Math.max(0, Math.min(1, (0.6 - minDist) / 0.5));
    const c = new THREE.Color().lerpColors(shallowColor, deepColor, t);
    waterColors[i * 3] = c.r;
    waterColors[i * 3 + 1] = c.g;
    waterColors[i * 3 + 2] = c.b;
  }
  waterGeo.setAttribute('color', new THREE.BufferAttribute(waterColors, 3));

  const waterMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.12,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    flatShading: true,
  });

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.name = 'TurquoiseSeas';
  planetGroup.add(waterMesh);

  // 3. Celestial Bodies: Mini Glowing Sun & Pale Moon
  // Prompt: "Three puffy clouds, a small glowing sun, and a pale moon follow curved paths around the world, with sun and moon on opposing sides... little sun creates moving shadows across the planet."
  const celestialRadius = 2.4;

  // Sun Group
  const sunGroup = new THREE.Group();
  sunGroup.name = 'MiniSunGroup';

  const sunCoreGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const sunCoreMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });
  const sunCore = new THREE.Mesh(sunCoreGeo, sunCoreMat);
  sunGroup.add(sunCore);

  // Soft glowing corona
  const coronaGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const coronaMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const corona = new THREE.Mesh(coronaGeo, coronaMat);
  sunGroup.add(corona);

  // Mini sun shadow-casting directional light
  const sunLight = new THREE.DirectionalLight(0xfff7d9, 2.0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 5.0;
  sunLight.shadow.camera.left = -1.8;
  sunLight.shadow.camera.right = 1.8;
  sunLight.shadow.camera.top = 1.8;
  sunLight.shadow.camera.bottom = -1.8;
  sunLight.shadow.bias = -0.0006;
  sunGroup.add(sunLight);

  // Sun position on orbit
  sunGroup.position.set(celestialRadius, 0.4, 0);
  planetGroup.add(sunGroup);

  // Pale Moon Group (Opposing side 180 deg)
  const moonGroup = new THREE.Group();
  moonGroup.name = 'PaleMoonGroup';

  const moonGeo = new THREE.SphereGeometry(0.09, 12, 12);
  const moonMat = new THREE.MeshStandardMaterial({
    color: 0xe8eef5,
    emissive: 0x9fb6d0,
    emissiveIntensity: 0.45,
    roughness: 0.7,
    flatShading: true,
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonGroup.add(moonMesh);

  // Moon light (subtle cool silver-blue illumination for night mode)
  const moonLight = new THREE.DirectionalLight(0x8daed6, 0.5);
  moonGroup.add(moonLight);

  moonGroup.position.set(-celestialRadius, -0.4, 0);
  planetGroup.add(moonGroup);

  // 4. Clouds (3 puffy low-poly clouds orbiting in atmosphere)
  const clouds: Array<{ group: THREE.Group; angle: number; speed: number; height: number; inclination: number }> = [];
  const cloudConfigs = [
    { angle: 0.5, speed: 0.08, height: 1.85, inclination: 0.25 },
    { angle: 2.6, speed: 0.07, height: 1.92, inclination: -0.35 },
    { angle: 4.4, speed: 0.09, height: 1.88, inclination: 0.12 },
  ];

  cloudConfigs.forEach((cfg) => {
    const cg = createCloud();
    cg.scale.setScalar(0.9);
    planetGroup.add(cg);
    clouds.push({ group: cg, ...cfg });
  });

  // 5. Rain Particle System
  const rainCount = 180;
  const rainGeo = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 3);
  const rainVelocities = new Float32Array(rainCount);

  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 0.6;
    rainPositions[i * 3 + 1] = 1.9 - Math.random() * 0.4;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    rainVelocities[i] = 0.8 + Math.random() * 0.5;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

  const rainMat = new THREE.PointsMaterial({
    color: 0xa8d8ea,
    size: 0.035,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const rainParticles = new THREE.Points(rainGeo, rainMat);
  rainParticles.name = 'RainSystem';
  planetGroup.add(rainParticles);

  // 6. Placement Sparkle Particles
  const sparkleCount = 60;
  const sparkleGeo = new THREE.BufferGeometry();
  const sparklePositions = new Float32Array(sparkleCount * 3);
  const sparkleDirections = new Float32Array(sparkleCount * 3);
  const sparkleLifetimes = new Float32Array(sparkleCount);

  for (let i = 0; i < sparkleCount; i++) {
    sparklePositions[i * 3] = 0;
    sparklePositions[i * 3 + 1] = 0;
    sparklePositions[i * 3 + 2] = 0;
    sparkleLifetimes[i] = 0; // inactive
  }
  sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));

  const sparkleMat = new THREE.PointsMaterial({
    color: 0xffd166,
    size: 0.05,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparkleParticles = new THREE.Points(sparkleGeo, sparkleMat);
  sparkleParticles.name = 'SparkleSystem';
  planetGroup.add(sparkleParticles);

  const triggerSparkles = (pos: THREE.Vector3) => {
    const posArr = sparkleGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < sparkleCount; i++) {
      posArr[i * 3] = pos.x;
      posArr[i * 3 + 1] = pos.y;
      posArr[i * 3 + 2] = pos.z;

      // Random burst velocity
      _v1.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.015 + Math.random() * 0.02);
      sparkleDirections[i * 3] = _v1.x;
      sparkleDirections[i * 3 + 1] = _v1.y;
      sparkleDirections[i * 3 + 2] = _v1.z;

      sparkleLifetimes[i] = 1.0; // 1.0 down to 0
    }
    sparkleGeo.attributes.position.needsUpdate = true;
    sparkleMat.opacity = 1.0;
  };

  // 7. Placed Items storage
  const placedItems = new Map<string, { item: PlacedItem; object: THREE.Group; targetScale: number }>();

  let windmillSails: THREE.Group | null = null;
  let lighthouseBeam: THREE.Mesh | null = null;
  let lighthouseBeacon: THREE.Group | null = null;

  // Helper to place item on sphere
  const placeItemAt = (type: ToolType, normal: THREE.Vector3, elevation: number = 0): PlacedItem | null => {
    const norm = normal.clone().normalize();
    const surfaceRadius = baseRadius + elevation;
    const pos = norm.clone().multiplyScalar(surfaceRadius);

    let obj: THREE.Group | null = null;
    let targetScale = 1.0;
    const id = `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    if (type === 'oak_tree') {
      obj = createOakTree();
      targetScale = 0.9 + Math.random() * 0.3;
    } else if (type === 'pine_tree') {
      obj = createPineTree();
      targetScale = 0.85 + Math.random() * 0.3;
    } else if (type === 'palm_tree') {
      obj = createPalmTree();
      targetScale = 0.9 + Math.random() * 0.25;
    } else if (type === 'cottage') {
      const colors: Array<'pink' | 'mint' | 'yellow' | 'blue'> = ['pink', 'mint', 'yellow', 'blue'];
      const chosen = colors[placedItems.size % colors.length];
      obj = createHouse(chosen);
      targetScale = 1.0;
    } else if (type === 'windmill') {
      const wm = createWindmill();
      obj = wm.group;
      windmillSails = wm.sails;
      targetScale = 1.1;
    } else if (type === 'lighthouse') {
      const lh = createLighthouse();
      obj = lh.group;
      lighthouseBeacon = lh.beacon;
      lighthouseBeam = lh.beamMesh;
      targetScale = 1.15;
    } else if (type === 'well') {
      obj = createStoneWell();
      targetScale = 1.0;
    } else if (type === 'mountain') {
      obj = createMountainPeak();
      targetScale = 1.0 + Math.random() * 0.3;
    } else if (type === 'flower_patch') {
      obj = createFlowerPatch();
      targetScale = 0.9 + Math.random() * 0.2;
    } else if (type === 'cloud') {
      const cg = createCloud();
      cg.scale.setScalar(0.9);
      planetGroup.add(cg);
      clouds.push({ group: cg, angle: Math.random() * Math.PI * 2, speed: 0.08, height: 1.88, inclination: (Math.random() - 0.5) * 0.4 });
      sounds.playPlace();
      return null;
    } else if (type === 'villager') {
      addVillager(norm, pos);
      sounds.playPlace();
      triggerSparkles(pos);
      return null;
    } else if (type === 'sheep') {
      addSheep(norm, pos);
      sounds.playPlace();
      triggerSparkles(pos);
      return null;
    }

    if (!obj) return null;

    // Align object bottom-center pivot with surface normal
    obj.position.copy(pos);
    _quat.setFromUnitVectors(_up, norm);
    obj.quaternion.copy(_quat);

    // Random rotation around local Y normal
    obj.rotateY(Math.random() * Math.PI * 2);

    // Start scaled down for settling bounce animation!
    obj.scale.setScalar(0.05);

    planetGroup.add(obj);

    const record: PlacedItem = {
      id,
      type,
      position: [pos.x, pos.y, pos.z],
      normal: [norm.x, norm.y, norm.z],
      rotationY: obj.rotation.y,
      scale: targetScale,
      createdAt: Date.now(),
    };

    placedItems.set(id, { item: record, object: obj, targetScale });
    triggerSparkles(pos);
    sounds.playPlace();

    return record;
  };

  // Raise / Lower Land
  const raiseLandAt = (hitPos: THREE.Vector3, amount: number) => {
    const hitDir = hitPos.clone().normalize();
    const pos = terrainGeo.attributes.position;
    const colorAttr = terrainGeo.attributes.color;
    const vC = pos.count;
    const radiusOfEffect = 0.45;

    for (let i = 0; i < vC; i++) {
      _v1.fromBufferAttribute(pos, i);
      const vDir = _v1.clone().normalize();
      const dist = vDir.distanceTo(hitDir);

      if (dist < radiusOfEffect) {
        const falloff = Math.cos((dist / radiusOfEffect) * (Math.PI / 2));
        baseElevations[i] += amount * falloff;

        // Apply clamped height
        const newR = Math.max(waterRadius - 0.06, Math.min(baseRadius + 0.35, baseRadius + baseElevations[i]));
        _v1.copy(vDir).multiplyScalar(newR);
        pos.setXYZ(i, _v1.x, _v1.y, _v1.z);

        // Recalculate vertex color based on new elevation
        const c = new THREE.Color();
        if (newR < waterRadius - 0.01) {
          c.copy(colorDeepSeaBed); // admitted water!
        } else if (newR <= waterRadius + 0.02) {
          c.copy(colorSandBeach);
        } else if (newR > baseRadius + 0.16) {
          c.copy(colorMountainRock);
        } else if (newR > baseRadius + 0.07) {
          c.copy(colorSagePlateau);
        } else if (newR > baseRadius + 0.02) {
          c.copy(colorOliveGrass);
        } else {
          c.copy(colorLimeMeadow);
        }

        colorAttr.setXYZ(i, c.r, c.g, c.b);
      }
    }

    pos.needsUpdate = true;
    colorAttr.needsUpdate = true;
    terrainGeo.computeVertexNormals();

    sounds.playPlace();
    triggerSparkles(hitPos);
  };

  // Remove Item
  const removeItemAt = (hitObject: THREE.Object3D): boolean => {
    // Find parent in placedItems
    let cur: THREE.Object3D | null = hitObject;
    while (cur && cur !== planetGroup) {
      for (const [id, entry] of placedItems.entries()) {
        if (entry.object === cur) {
          planetGroup.remove(entry.object);
          placedItems.delete(id);
          sounds.playRemove();
          triggerSparkles(entry.object.position);
          return true;
        }
      }
      cur = cur.parent;
    }
    return false;
  };

  // 8. Autonomous Villagers Setup (12 villagers per prompt)
  const villagers = new Map<string, { actor: VillagerActor; model: ReturnType<typeof createVillager> }>();
  const villagerNames = [
    'Pippa', 'Oliver', 'Bram', 'Rowan',
    'Clover', 'Jasper', 'Millie', 'Flynn',
    'Daisy', 'Barnaby', 'Maeve', 'Finbar',
  ];
  const tunicColors = [
    0x3a86ff, 0xe63946, 0x2a9d8f, 0xf4a261,
    0x9b5de5, 0x00bbf9, 0xf15bb5, 0x588157,
    0xbc6c25, 0x457b9d, 0xd62828, 0x3d5a80,
  ];

  const addVillager = (normal: THREE.Vector3, pos: THREE.Vector3) => {
    const idx = villagers.size;
    const name = villagerNames[idx % villagerNames.length] || `Villager ${idx + 1}`;
    const color = tunicColors[idx % tunicColors.length];
    const model = createVillager(color, 0xd4a373);

    model.group.position.copy(pos);
    _quat.setFromUnitVectors(_up, normal);
    model.group.quaternion.copy(_quat);

    planetGroup.add(model.group);

    const actor: VillagerActor = {
      id: `villager_${idx}_${Date.now()}`,
      name,
      color: `#${color.toString(16)}`,
      hatColor: '#d4a373',
      currentPos: [pos.x, pos.y, pos.z],
      targetPos: [pos.x, pos.y, pos.z],
      normal: [normal.x, normal.y, normal.z],
      phase: Math.random() * Math.PI * 2,
      speed: 0.12 + Math.random() * 0.08,
      state: 'walking',
      actionTimer: 2.0 + Math.random() * 4.0,
    };

    villagers.set(actor.id, { actor, model });
  };

  // 9. Autonomous Sheep Setup (8 white sheep per prompt)
  const sheepList: Array<{ actor: SheepActor; model: ReturnType<typeof createSheep> }> = [];

  const addSheep = (normal: THREE.Vector3, pos: THREE.Vector3) => {
    const model = createSheep();
    model.group.position.copy(pos);
    _quat.setFromUnitVectors(_up, normal);
    model.group.quaternion.copy(_quat);

    planetGroup.add(model.group);

    const actor: SheepActor = {
      id: `sheep_${sheepList.length}_${Date.now()}`,
      currentPos: [pos.x, pos.y, pos.z],
      targetPos: [pos.x, pos.y, pos.z],
      normal: [normal.x, normal.y, normal.z],
      grazeTime: 2.0 + Math.random() * 3.0,
      walkSpeed: 0.06 + Math.random() * 0.04,
      animPhase: Math.random() * Math.PI * 2,
    };

    sheepList.push({ actor, model });
  };

  // Populate Initial World per prompt:
  // "Start with four pastel houses, a white windmill, a striped cliff-top lighthouse, a stone well, fences, rounded oaks, narrow pines, and palms beside the coast. Twelve villagers in colorful clothing should travel between homes and the well, while eight white sheep graze nearby."
  const initInitialWorld = () => {
    // Four pastel houses placed around grassy meadows
    const houseNorms = [
      new THREE.Vector3(0.25, 0.42, 0.85).normalize(),
      new THREE.Vector3(0.48, 0.38, 0.76).normalize(),
      new THREE.Vector3(0.12, 0.58, 0.78).normalize(),
      new THREE.Vector3(0.38, 0.62, 0.66).normalize(),
    ];
    houseNorms.forEach((norm) => placeItemAt('cottage', norm));

    // Stone well at the center of the village
    const wellNorm = new THREE.Vector3(0.3, 0.48, 0.8).normalize();
    placeItemAt('well', wellNorm);

    // Windmill on a breezy grassy crest
    const windmillNorm = new THREE.Vector3(-0.35, 0.65, 0.65).normalize();
    placeItemAt('windmill', windmillNorm);

    // Striped cliff-top lighthouse overlooking the sea
    const lighthouseNorm = new THREE.Vector3(0.72, 0.45, 0.52).normalize();
    placeItemAt('lighthouse', lighthouseNorm);

    // Fences along the village path
    const fence1 = createFence();
    const f1Norm = new THREE.Vector3(0.2, 0.38, 0.88).normalize();
    fence1.position.copy(f1Norm.clone().multiplyScalar(baseRadius + 0.02));
    _quat.setFromUnitVectors(_up, f1Norm);
    fence1.quaternion.copy(_quat);
    planetGroup.add(fence1);

    const fence2 = createFence();
    const f2Norm = new THREE.Vector3(0.42, 0.32, 0.82).normalize();
    fence2.position.copy(f2Norm.clone().multiplyScalar(baseRadius + 0.02));
    _quat.setFromUnitVectors(_up, f2Norm);
    fence2.quaternion.copy(_quat);
    fence2.rotateY(0.5);
    planetGroup.add(fence2);

    // Trees: Rounded oaks near village, narrow pines near north crag, palms beside coast
    // Rounded oaks
    const oakNorms = [
      new THREE.Vector3(0.05, 0.48, 0.86).normalize(),
      new THREE.Vector3(0.56, 0.44, 0.68).normalize(),
      new THREE.Vector3(0.28, 0.72, 0.62).normalize(),
      new THREE.Vector3(-0.15, 0.52, 0.8).normalize(),
    ];
    oakNorms.forEach((norm) => placeItemAt('oak_tree', norm));

    // Narrow pines
    const pineNorms = [
      new THREE.Vector3(-0.25, 0.85, 0.42).normalize(),
      new THREE.Vector3(0.05, 0.9, 0.4).normalize(),
      new THREE.Vector3(-0.45, 0.8, 0.38).normalize(),
    ];
    pineNorms.forEach((norm) => placeItemAt('pine_tree', norm));

    // Palms beside coast
    const palmNorms = [
      new THREE.Vector3(0.68, 0.22, 0.68).normalize(),
      new THREE.Vector3(0.58, 0.12, 0.78).normalize(),
      new THREE.Vector3(-0.62, -0.15, -0.75).normalize(),
    ];
    palmNorms.forEach((norm) => placeItemAt('palm_tree', norm));

    // Flower patches
    const flowerNorms = [
      new THREE.Vector3(0.22, 0.45, 0.84).normalize(),
      new THREE.Vector3(0.35, 0.52, 0.76).normalize(),
    ];
    flowerNorms.forEach((norm) => placeItemAt('flower_patch', norm));

    // 12 Villagers traveling between homes and well
    for (let i = 0; i < 12; i++) {
      const ang = (i * Math.PI * 2) / 12;
      const vNorm = new THREE.Vector3(
        0.3 + Math.cos(ang) * 0.22,
        0.48 + Math.sin(ang) * 0.16,
        0.8 + (Math.random() - 0.5) * 0.1
      ).normalize();
      const vPos = vNorm.clone().multiplyScalar(baseRadius + 0.02);
      addVillager(vNorm, vPos);
    }

    // 8 White sheep grazing nearby
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI * 2) / 8;
      const sNorm = new THREE.Vector3(
        -0.1 + Math.cos(ang) * 0.28,
        0.55 + Math.sin(ang) * 0.2,
        0.75 + (Math.random() - 0.5) * 0.12
      ).normalize();
      const sPos = sNorm.clone().multiplyScalar(baseRadius + 0.02);
      addSheep(sNorm, sPos);
    }
  };

  initInitialWorld();

  // Grow village: Sprouts new trees, cottages, or wildflower fields
  const growVillage = () => {
    sounds.playGrowChime();
    // Choose random green land spot
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI - Math.PI / 2;
    const candidateNorm = new THREE.Vector3(
      Math.cos(angle1) * Math.cos(angle2),
      Math.sin(angle2) * 0.6 + 0.3, // favor temperate/grassy latitudes
      Math.sin(angle1) * Math.cos(angle2)
    ).normalize();

    const choices: ToolType[] = ['cottage', 'oak_tree', 'flower_patch', 'sheep', 'villager'];
    const pick = choices[Math.floor(Math.random() * choices.length)];
    placeItemAt(pick, candidateNorm);
  };

  // Rain trigger
  let rainActive = false;
  let rainTimer = 0;

  const triggerRain = () => {
    rainActive = true;
    rainTimer = 8.0; // 8 seconds of gentle rain shower
    sounds.setRain(true);
  };

  // Spin velocity with gentle inertia
  const spinVelocity = { x: 0, y: 0 };

  // Main animation / physics update
  const update = (delta: number, time: number, timeOfDay: number) => {
    // 1. Planet Spin Inertia
    planetGroup.rotation.y += spinVelocity.y * delta;
    planetGroup.rotation.x += spinVelocity.x * delta;

    // Dampen spin velocity smoothly
    spinVelocity.x *= Math.pow(0.85, delta * 60);
    spinVelocity.y *= Math.pow(0.85, delta * 60);

    // 2. Sun & Moon Opposing Circular Orbits
    // 0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight
    const celestialAngle = timeOfDay * Math.PI * 2;

    const sunX = Math.cos(celestialAngle) * celestialRadius;
    const sunY = Math.sin(celestialAngle) * celestialRadius * 0.65;
    const sunZ = Math.sin(celestialAngle * 0.5) * 0.5;

    sunGroup.position.set(sunX, sunY, sunZ);
    moonGroup.position.set(-sunX, -sunY, -sunZ);

    // Point directional lights directly at center of planet
    sunLight.position.copy(sunGroup.position);
    sunLight.target = planetGroup;
    moonLight.position.copy(moonGroup.position);
    moonLight.target = planetGroup;

    // Adjust sun intensity based on elevation relative to planet horizon
    const isDay = sunY > -0.2;
    sunLight.intensity = isDay ? THREE.MathUtils.clamp((sunY + 0.2) * 2.2, 0.2, 2.0) : 0;
    moonLight.intensity = !isDay ? 0.45 : 0.05;

    // 3. Windmill sails continuous spin
    if (windmillSails) {
      windmillSails.rotation.z += delta * 1.6;
    }

    // 4. Lighthouse sweeping Fresnel beam across the sea
    if (lighthouseBeacon) {
      lighthouseBeacon.rotation.y += delta * 2.2;
    }
    if (lighthouseBeam) {
      // Beam is brighter and more prominent at twilight / night
      const isNight = timeOfDay > 0.45 && timeOfDay < 0.92;
      (lighthouseBeam.material as THREE.MeshBasicMaterial).opacity = isNight ? 0.75 : 0.25;
    }

    // 5. Update Window Emissives
    updateEmissives(timeOfDay);

    // 6. Placed Items Settling Bounce
    placedItems.forEach((entry) => {
      if (entry.object.scale.x < entry.targetScale) {
        // Elastic pop settle
        const newScale = THREE.MathUtils.damp(entry.object.scale.x, entry.targetScale, 12, delta);
        entry.object.scale.setScalar(newScale);
      }
    });

    // 7. Clouds orbit & gentle hovering
    clouds.forEach((c) => {
      c.angle += c.speed * delta;
      const x = Math.cos(c.angle) * c.height;
      const z = Math.sin(c.angle) * c.height;
      const y = Math.sin(c.angle * 2.0) * c.inclination * c.height;

      c.group.position.set(x, y, z);
      _quat.setFromUnitVectors(_up, _v1.set(x, y, z).normalize());
      c.group.quaternion.copy(_quat);
    });

    // 8. Rain Particles
    if (rainTimer > 0) {
      rainTimer -= delta;
      (rainParticles.material as THREE.PointsMaterial).opacity = THREE.MathUtils.lerp(
        (rainParticles.material as THREE.PointsMaterial).opacity,
        0.8,
        delta * 3
      );

      const rPos = rainGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < rainCount; i++) {
        rPos[i * 3 + 1] -= rainVelocities[i] * delta * 1.5;
        if (rPos[i * 3 + 1] < 1.45) {
          // Reset rain drop to cloud level
          rPos[i * 3 + 1] = 1.95;
          rPos[i * 3] = (Math.random() - 0.5) * 0.7;
          rPos[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
        }
      }
      rainGeo.attributes.position.needsUpdate = true;
    } else {
      (rainParticles.material as THREE.PointsMaterial).opacity = THREE.MathUtils.lerp(
        (rainParticles.material as THREE.PointsMaterial).opacity,
        0.0,
        delta * 3
      );
      if (rainActive) {
        rainActive = false;
        sounds.setRain(false);
      }
    }

    // 9. Sparkle Particles Update
    let anySparkleActive = false;
    const sPos = sparkleGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < sparkleCount; i++) {
      if (sparkleLifetimes[i] > 0) {
        sparkleLifetimes[i] -= delta * 1.8;
        sPos[i * 3] += sparkleDirections[i * 3];
        sPos[i * 3 + 1] += sparkleDirections[i * 3 + 1];
        sPos[i * 3 + 2] += sparkleDirections[i * 3 + 2];
        anySparkleActive = true;
      }
    }
    if (anySparkleActive) {
      sparkleGeo.attributes.position.needsUpdate = true;
    } else {
      sparkleMat.opacity = 0;
    }

    // 10. Autonomous Villagers Pathing & Walk Cycles
    villagers.forEach(({ actor, model }) => {
      actor.actionTimer -= delta;
      actor.phase += delta * 8.0;

      if (actor.actionTimer <= 0) {
        // Pick new nearby destination on sphere
        actor.actionTimer = 3.0 + Math.random() * 5.0;
        actor.state = Math.random() > 0.3 ? 'walking' : 'visiting_well';

        const curDir = _v1.fromArray(actor.currentPos).normalize();
        const randTangent = _v2.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).cross(curDir).normalize();
        const targetDir = curDir.addScaledVector(randTangent, 0.12).normalize();
        const target = targetDir.multiplyScalar(baseRadius + 0.02);
        actor.targetPos = [target.x, target.y, target.z];
      }

      if (actor.state === 'walking' || actor.state === 'visiting_well') {
        // Interpolate toward target
        _v1.fromArray(actor.currentPos);
        _v2.fromArray(actor.targetPos);
        _v1.lerp(_v2, delta * actor.speed * 4.0);
        actor.currentPos = [_v1.x, _v1.y, _v1.z];

        const normal = _v1.clone().normalize();
        model.group.position.copy(_v1);
        _quat.setFromUnitVectors(_up, normal);
        model.group.quaternion.copy(_quat);

        // Walk cycle leg swing
        const legSwing = Math.sin(actor.phase) * 0.45;
        model.leftLeg.rotation.x = legSwing;
        model.rightLeg.rotation.x = -legSwing;
        model.leftArm.rotation.x = -legSwing * 0.8;
        model.rightArm.rotation.x = legSwing * 0.8;
      }
    });

    // 11. Autonomous Sheep Wandering & Grazing
    sheepList.forEach(({ actor, model }) => {
      actor.grazeTime -= delta;
      actor.animPhase += delta * 4.0;

      if (actor.grazeTime <= 0) {
        actor.grazeTime = 2.5 + Math.random() * 4.0;
        // Wander slightly
        const curDir = _v1.fromArray(actor.currentPos).normalize();
        const randTangent = _v2.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).cross(curDir).normalize();
        const targetDir = curDir.addScaledVector(randTangent, 0.08).normalize();
        const target = targetDir.multiplyScalar(baseRadius + 0.02);
        actor.targetPos = [target.x, target.y, target.z];
      }

      _v1.fromArray(actor.currentPos);
      _v2.fromArray(actor.targetPos);
      _v1.lerp(_v2, delta * actor.walkSpeed * 2.0);
      actor.currentPos = [_v1.x, _v1.y, _v1.z];

      const normal = _v1.clone().normalize();
      model.group.position.copy(_v1);
      _quat.setFromUnitVectors(_up, normal);
      model.group.quaternion.copy(_quat);

      // Head grazing bob
      const headBob = Math.sin(actor.animPhase * 0.5) * 0.25;
      model.headGroup.rotation.x = Math.max(0, headBob);

      // Leg trot
      const trot = Math.sin(actor.animPhase) * 0.25;
      model.legFL.rotation.x = trot;
      model.legBR.rotation.x = trot;
      model.legFR.rotation.x = -trot;
      model.legBL.rotation.x = -trot;
    });

    // 12. Modest Water Surface Motion
    const waterAttr = waterGeo.attributes.position;
    for (let i = 0; i < waterAttr.count; i += 3) {
      _v1.fromBufferAttribute(waterAttr, i).normalize();
      const wave = Math.sin(time * 2.5 + _v1.x * 12.0 + _v1.z * 12.0) * 0.003;
      _v1.multiplyScalar(waterRadius + wave);
      waterAttr.setXYZ(i, _v1.x, _v1.y, _v1.z);
    }
    waterAttr.needsUpdate = true;
  };

  return {
    planetGroup,
    terrainMesh,
    waterMesh,
    sunGroup,
    moonGroup,
    sunLight,
    moonLight,
    placedItems,
    villagers,
    sheepList,
    clouds,
    lighthouseBeam,
    windmillSails,
    spinVelocity,
    rainParticles,
    sparkleParticles,
    triggerRain,
    triggerSparkles,
    placeItemAt,
    raiseLandAt,
    removeItemAt,
    growVillage,
    update,
  };
}
