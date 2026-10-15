import * as THREE from 'three';

// Shared materials cache for performance and memory optimization
const mats = {
  // Wood
  barkOak: new THREE.MeshStandardMaterial({ color: 0x6e4726, roughness: 0.9, metalness: 0.05 }),
  barkPine: new THREE.MeshStandardMaterial({ color: 0x4a3319, roughness: 0.85, metalness: 0.05 }),
  palmWood: new THREE.MeshStandardMaterial({ color: 0x8a6338, roughness: 0.85, metalness: 0.05 }),
  timber: new THREE.MeshStandardMaterial({ color: 0x7c532d, roughness: 0.8, metalness: 0.05 }),
  fenceWood: new THREE.MeshStandardMaterial({ color: 0x8c6239, roughness: 0.9, metalness: 0.0 }),

  // Foliage
  oakLeaves1: new THREE.MeshStandardMaterial({ color: 0x4e853b, roughness: 0.7, flatShading: true }),
  oakLeaves2: new THREE.MeshStandardMaterial({ color: 0x66a64b, roughness: 0.65, flatShading: true }),
  pineNeedles: new THREE.MeshStandardMaterial({ color: 0x225528, roughness: 0.8, flatShading: true }),
  palmFrond: new THREE.MeshStandardMaterial({ color: 0x5a9e32, roughness: 0.6, flatShading: true }),
  coconut: new THREE.MeshStandardMaterial({ color: 0x402b17, roughness: 0.9 }),

  // Stone & Plaster
  stoneGray: new THREE.MeshStandardMaterial({ color: 0x828489, roughness: 0.95, flatShading: true }),
  stoneDark: new THREE.MeshStandardMaterial({ color: 0x5a5b5e, roughness: 0.95, flatShading: true }),
  whitewash: new THREE.MeshStandardMaterial({ color: 0xf5f2eb, roughness: 0.75, flatShading: true }),
  snow: new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.35, metalness: 0.05, flatShading: true }),

  // Houses & Structures
  cottageWallPink: new THREE.MeshStandardMaterial({ color: 0xf4c2c2, roughness: 0.8 }),
  cottageWallMint: new THREE.MeshStandardMaterial({ color: 0xb5e2d5, roughness: 0.8 }),
  cottageWallYellow: new THREE.MeshStandardMaterial({ color: 0xfde3a7, roughness: 0.8 }),
  cottageWallBlue: new THREE.MeshStandardMaterial({ color: 0xc5dff0, roughness: 0.8 }),
  roofTerracotta: new THREE.MeshStandardMaterial({ color: 0xb85d38, roughness: 0.7, flatShading: true }),
  roofSlate: new THREE.MeshStandardMaterial({ color: 0x4b5866, roughness: 0.75, flatShading: true }),
  chimneyBrick: new THREE.MeshStandardMaterial({ color: 0x8c4636, roughness: 0.9, flatShading: true }),
  chimneyRim: new THREE.MeshStandardMaterial({ color: 0x50281e, roughness: 0.85 }),

  // Window Glow (emissive for night mode!)
  windowGlass: new THREE.MeshStandardMaterial({
    color: 0xffd97d,
    emissive: 0xffb732,
    emissiveIntensity: 0.25,
    roughness: 0.2,
  }),

  // Windmill
  canvasSail: new THREE.MeshStandardMaterial({
    color: 0xfffaf0,
    roughness: 0.85,
    side: THREE.DoubleSide,
  }),

  // Lighthouse
  lighthouseRed: new THREE.MeshStandardMaterial({ color: 0xbf3026, roughness: 0.65, flatShading: true }),
  lighthouseWhite: new THREE.MeshStandardMaterial({ color: 0xfcfbfa, roughness: 0.6, flatShading: true }),
  lighthouseLantern: new THREE.MeshStandardMaterial({
    color: 0xffea88,
    emissive: 0xffc83b,
    emissiveIntensity: 0.9,
    roughness: 0.1,
  }),
  brass: new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85,
  }),

  // Sheep
  sheepWool: new THREE.MeshStandardMaterial({ color: 0xfbfbf8, roughness: 0.95, flatShading: true }),
  sheepSkin: new THREE.MeshStandardMaterial({ color: 0x2b2927, roughness: 0.85 }),

  // Clouds
  cloudPuff: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.45,
    flatShading: true,
  }),

  // Flowers
  stemGreen: new THREE.MeshStandardMaterial({ color: 0x3d7e2e, roughness: 0.8 }),
  petalRed: new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.5, flatShading: true }),
  petalYellow: new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.5, flatShading: true }),
  petalWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, flatShading: true }),
  petalBlue: new THREE.MeshStandardMaterial({ color: 0x457b9d, roughness: 0.5, flatShading: true }),
  flowerCenter: new THREE.MeshStandardMaterial({ color: 0xd4ac0d, roughness: 0.6 }),

  // Water inside well
  wellWater: new THREE.MeshStandardMaterial({
    color: 0x1d7874,
    roughness: 0.1,
    metalness: 0.2,
  }),
};

// Update house and lighthouse window emissive glow based on time of day (0..1)
export function updateEmissives(timeOfDay: number) {
  // Sunset ~0.45..0.55, Night ~0.55..0.9, Sunrise ~0.95..0.1
  const isNight = timeOfDay > 0.45 && timeOfDay < 0.92;
  let intensity = 0.15;
  if (isNight) {
    intensity = 1.35;
  } else if (timeOfDay > 0.4 && timeOfDay <= 0.45) {
    intensity = 0.15 + (timeOfDay - 0.4) / 0.05 * 1.2;
  } else if (timeOfDay >= 0.92 && timeOfDay < 0.98) {
    intensity = 1.35 - (timeOfDay - 0.92) / 0.06 * 1.2;
  }
  mats.windowGlass.emissiveIntensity = intensity;
}

/**
 * 1. Rounded Oak Tree (Composite 6-part procedural model)
 */
export function createOakTree(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'OakTree';

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.22, 6);
  trunkGeo.translate(0, 0.11, 0);
  const trunk = new THREE.Mesh(trunkGeo, mats.barkOak);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // Branch support
  const branchGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.1, 5);
  branchGeo.rotateZ(0.4);
  branchGeo.translate(0.04, 0.18, 0);
  const branch = new THREE.Mesh(branchGeo, mats.barkOak);
  group.add(branch);

  // Multi-cluster fluffy foliage (4 distinct clumps with slight color/scale offset)
  const foliage1Geo = new THREE.DodecahedronGeometry(0.16, 1);
  foliage1Geo.translate(0, 0.28, 0);
  const f1 = new THREE.Mesh(foliage1Geo, mats.oakLeaves1);
  f1.castShadow = true;
  group.add(f1);

  const foliage2Geo = new THREE.DodecahedronGeometry(0.12, 1);
  foliage2Geo.translate(-0.08, 0.24, 0.06);
  const f2 = new THREE.Mesh(foliage2Geo, mats.oakLeaves2);
  f2.castShadow = true;
  group.add(f2);

  const foliage3Geo = new THREE.DodecahedronGeometry(0.13, 1);
  foliage3Geo.translate(0.08, 0.26, -0.05);
  const f3 = new THREE.Mesh(foliage3Geo, mats.oakLeaves1);
  f3.castShadow = true;
  group.add(f3);

  const foliageTopGeo = new THREE.DodecahedronGeometry(0.1, 1);
  foliageTopGeo.translate(0.01, 0.36, 0.01);
  const fTop = new THREE.Mesh(foliageTopGeo, mats.oakLeaves2);
  fTop.castShadow = true;
  group.add(fTop);

  return group;
}

/**
 * 2. Narrow Pine Tree (Composite 6-part tiered procedural model)
 */
export function createPineTree(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PineTree';

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.16, 5);
  trunkGeo.translate(0, 0.08, 0);
  const trunk = new THREE.Mesh(trunkGeo, mats.barkPine);
  trunk.castShadow = true;
  group.add(trunk);

  // 4 tiered needle cones
  const tiers = [
    { r: 0.17, h: 0.16, y: 0.15 },
    { r: 0.14, h: 0.15, y: 0.23 },
    { r: 0.11, h: 0.13, y: 0.31 },
    { r: 0.07, h: 0.11, y: 0.38 },
  ];

  tiers.forEach((t) => {
    const coneGeo = new THREE.ConeGeometry(t.r, t.h, 6);
    coneGeo.translate(0, t.y + t.h * 0.5, 0);
    const cone = new THREE.Mesh(coneGeo, mats.pineNeedles);
    cone.castShadow = true;
    group.add(cone);
  });

  return group;
}

/**
 * 3. Coastal Palm Tree (Composite 8-part procedural model)
 */
export function createPalmTree(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PalmTree';

  // Curved segmented trunk (built via 4 angled cylinders)
  const segments = [
    { y: 0.06, rot: 0.04, dx: 0.01 },
    { y: 0.14, rot: 0.1, dx: 0.03 },
    { y: 0.22, rot: 0.16, dx: 0.06 },
    { y: 0.3, rot: 0.22, dx: 0.09 },
  ];

  segments.forEach((s) => {
    const segGeo = new THREE.CylinderGeometry(0.032, 0.038, 0.08, 6);
    const m = new THREE.Mesh(segGeo, mats.palmWood);
    m.position.set(s.dx, s.y, 0);
    m.rotation.z = -s.rot;
    m.castShadow = true;
    group.add(m);
  });

  // Top fronds hub
  const topX = 0.12;
  const topY = 0.34;

  // Coconuts cluster
  for (let i = 0; i < 3; i++) {
    const ang = (i * Math.PI * 2) / 3;
    const nutGeo = new THREE.SphereGeometry(0.022, 5, 5);
    const nut = new THREE.Mesh(nutGeo, mats.coconut);
    nut.position.set(topX + Math.cos(ang) * 0.025, topY - 0.02, Math.sin(ang) * 0.025);
    group.add(nut);
  }

  // 6 arching fan fronds
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI * 2) / 6;
    const frondGeo = new THREE.BoxGeometry(0.04, 0.008, 0.18);
    frondGeo.translate(0, 0, 0.09);
    frondGeo.rotateX(-0.35); // arch down
    const frond = new THREE.Mesh(frondGeo, mats.palmFrond);
    frond.position.set(topX, topY, 0);
    frond.rotation.y = ang;
    frond.castShadow = true;
    group.add(frond);
  }

  return group;
}

/**
 * 4. Pastel House (Composite 9-part cottage with roof tiles, chimney & glowing window)
 */
export function createHouse(colorVariant: 'pink' | 'mint' | 'yellow' | 'blue' = 'pink'): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PastelHouse';

  const wallMat =
    colorVariant === 'pink'
      ? mats.cottageWallPink
      : colorVariant === 'mint'
      ? mats.cottageWallMint
      : colorVariant === 'yellow'
      ? mats.cottageWallYellow
      : mats.cottageWallBlue;

  const roofMat = colorVariant === 'mint' || colorVariant === 'blue' ? mats.roofSlate : mats.roofTerracotta;

  // 1. Stone foundation base
  const baseGeo = new THREE.BoxGeometry(0.24, 0.03, 0.22);
  baseGeo.translate(0, 0.015, 0);
  const base = new THREE.Mesh(baseGeo, mats.stoneGray);
  base.castShadow = true;
  group.add(base);

  // 2. Main pastel walls
  const wallGeo = new THREE.BoxGeometry(0.22, 0.16, 0.2);
  wallGeo.translate(0, 0.03 + 0.08, 0);
  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // 3. Shingled Gable Roof (Prism)
  const roofGeo = new THREE.ConeGeometry(0.18, 0.13, 4);
  roofGeo.rotateY(Math.PI / 4);
  roofGeo.translate(0, 0.19 + 0.065, 0);
  roofGeo.scale(1.0, 1.0, 0.95);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.castShadow = true;
  group.add(roof);

  // 4. Brick Chimney
  const chimGeo = new THREE.BoxGeometry(0.04, 0.11, 0.04);
  chimGeo.translate(0.06, 0.25, 0.04);
  const chimney = new THREE.Mesh(chimGeo, mats.chimneyBrick);
  chimney.castShadow = true;
  group.add(chimney);

  // 5. Chimney rim
  const rimGeo = new THREE.BoxGeometry(0.052, 0.015, 0.052);
  rimGeo.translate(0.06, 0.305, 0.04);
  const rim = new THREE.Mesh(rimGeo, mats.chimneyRim);
  group.add(rim);

  // 6. Wooden front door
  const doorGeo = new THREE.BoxGeometry(0.045, 0.08, 0.01);
  doorGeo.translate(0, 0.07, 0.103);
  const door = new THREE.Mesh(doorGeo, mats.timber);
  group.add(door);

  // 7. Front Window with glowing glass
  const win1Geo = new THREE.BoxGeometry(0.04, 0.04, 0.01);
  win1Geo.translate(-0.06, 0.11, 0.103);
  const win1 = new THREE.Mesh(win1Geo, mats.windowGlass);
  group.add(win1);

  // 8. Side Window
  const win2Geo = new THREE.BoxGeometry(0.01, 0.04, 0.04);
  win2Geo.translate(0.113, 0.11, 0);
  const win2 = new THREE.Mesh(win2Geo, mats.windowGlass);
  group.add(win2);

  return group;
}

/**
 * 5. White Windmill with turning canvas sails (Composite 7-part model)
 */
export function createWindmill(): { group: THREE.Group; sails: THREE.Group } {
  const group = new THREE.Group();
  group.name = 'Windmill';

  // 1. Tapered whitewashed octagonal tower
  const towerGeo = new THREE.CylinderGeometry(0.09, 0.14, 0.32, 8);
  towerGeo.translate(0, 0.16, 0);
  const tower = new THREE.Mesh(towerGeo, mats.whitewash);
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  // 2. Timber dome cap
  const capGeo = new THREE.ConeGeometry(0.1, 0.08, 8);
  capGeo.translate(0, 0.32 + 0.04, 0);
  const cap = new THREE.Mesh(capGeo, mats.timber);
  cap.castShadow = true;
  group.add(cap);

  // 3. Balcony walkway ring
  const balcGeo = new THREE.TorusGeometry(0.11, 0.01, 4, 12);
  balcGeo.rotateX(Math.PI / 2);
  balcGeo.translate(0, 0.22, 0);
  const balc = new THREE.Mesh(balcGeo, mats.fenceWood);
  group.add(balc);

  // 4. Sail rotor hub
  const sails = new THREE.Group();
  sails.name = 'WindmillSails';
  sails.position.set(0, 0.28, 0.1);

  const hubGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 6);
  hubGeo.rotateX(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, mats.timber);
  sails.add(hub);

  // 4 sails with lattice spars and canvas
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;

    // Wood spar
    const sparGeo = new THREE.BoxGeometry(0.015, 0.26, 0.01);
    sparGeo.translate(0, 0.13, 0);
    const spar = new THREE.Mesh(sparGeo, mats.timber);
    arm.add(spar);

    // Canvas cloth sail
    const sailGeo = new THREE.BoxGeometry(0.065, 0.18, 0.005);
    sailGeo.translate(0.035, 0.13, 0.005);
    const sail = new THREE.Mesh(sailGeo, mats.canvasSail);
    arm.add(sail);

    sails.add(arm);
  }

  group.add(sails);

  return { group, sails };
}

/**
 * 6. Striped Cliff-Top Lighthouse with sweeping Fresnel beam (Composite 8-part model)
 */
export function createLighthouse(): { group: THREE.Group; beacon: THREE.Group; beamMesh: THREE.Mesh } {
  const group = new THREE.Group();
  group.name = 'Lighthouse';

  // Stone cliff-top foundation
  const baseGeo = new THREE.CylinderGeometry(0.14, 0.17, 0.08, 8);
  baseGeo.translate(0, 0.04, 0);
  const base = new THREE.Mesh(baseGeo, mats.stoneDark);
  base.castShadow = true;
  group.add(base);

  // Alternating red and white striped cylindrical tower rings
  const heights = [0.08, 0.08, 0.08, 0.08];
  let curY = 0.08;
  const colors = [mats.lighthouseWhite, mats.lighthouseRed, mats.lighthouseWhite, mats.lighthouseRed];

  for (let i = 0; i < 4; i++) {
    const h = heights[i];
    const rTop = 0.13 - i * 0.012;
    const rBot = 0.14 - i * 0.012;
    const ringGeo = new THREE.CylinderGeometry(rTop, rBot, h, 10);
    ringGeo.translate(0, curY + h * 0.5, 0);
    const ring = new THREE.Mesh(ringGeo, colors[i]);
    ring.castShadow = true;
    group.add(ring);
    curY += h;
  }

  // Gallery deck railing
  const deckGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.015, 10);
  deckGeo.translate(0, curY + 0.0075, 0);
  const deck = new THREE.Mesh(deckGeo, mats.stoneDark);
  group.add(deck);
  curY += 0.015;

  // Lantern room glass & light
  const beacon = new THREE.Group();
  beacon.position.set(0, curY + 0.04, 0);

  const lanternGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.07, 8);
  const lantern = new THREE.Mesh(lanternGeo, mats.lighthouseLantern);
  beacon.add(lantern);

  // Sweeping volumetric beam cone!
  const beamGeo = new THREE.ConeGeometry(0.45, 1.8, 12, 1, true);
  beamGeo.rotateX(Math.PI / 2);
  beamGeo.translate(0, 0, 0.9); // project outward along +Z
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfff3a1,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const beamMesh = new THREE.Mesh(beamGeo, beamMat);
  beacon.add(beamMesh);

  group.add(beacon);

  // Copper dome roof
  const domeGeo = new THREE.ConeGeometry(0.075, 0.06, 8);
  domeGeo.translate(0, curY + 0.07 + 0.03, 0);
  const dome = new THREE.Mesh(domeGeo, mats.lighthouseRed);
  group.add(dome);

  // Brass finial spike
  const finialGeo = new THREE.CylinderGeometry(0.005, 0.01, 0.05, 4);
  finialGeo.translate(0, curY + 0.125, 0);
  const finial = new THREE.Mesh(finialGeo, mats.brass);
  group.add(finial);

  return { group, beacon, beamMesh };
}

/**
 * 7. Stone Well with wooden canopy, crank & bucket (Composite 8-part model)
 */
export function createStoneWell(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'StoneWell';

  // Circular cobblestone curb
  const curbGeo = new THREE.CylinderGeometry(0.11, 0.12, 0.08, 10, 1, true);
  curbGeo.translate(0, 0.04, 0);
  const curb = new THREE.Mesh(curbGeo, mats.stoneGray);
  curb.castShadow = true;
  group.add(curb);

  // Inner water disc
  const waterGeo = new THREE.CircleGeometry(0.09, 10);
  waterGeo.rotateX(-Math.PI / 2);
  waterGeo.translate(0, 0.03, 0);
  const water = new THREE.Mesh(waterGeo, mats.wellWater);
  group.add(water);

  // Twin wooden upright posts
  const post1Geo = new THREE.BoxGeometry(0.02, 0.22, 0.02);
  post1Geo.translate(-0.09, 0.11, 0);
  const post1 = new THREE.Mesh(post1Geo, mats.timber);
  post1.castShadow = true;
  group.add(post1);

  const post2Geo = new THREE.BoxGeometry(0.02, 0.22, 0.02);
  post2Geo.translate(0.09, 0.11, 0);
  const post2 = new THREE.Mesh(post2Geo, mats.timber);
  post2.castShadow = true;
  group.add(post2);

  // Cross beam axle
  const crossGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.2, 5);
  crossGeo.rotateZ(Math.PI / 2);
  crossGeo.translate(0, 0.18, 0);
  const cross = new THREE.Mesh(crossGeo, mats.timber);
  group.add(cross);

  // Suspended wooden bucket
  const bucketGeo = new THREE.CylinderGeometry(0.025, 0.02, 0.04, 6);
  bucketGeo.translate(0, 0.08, 0);
  const bucket = new THREE.Mesh(bucketGeo, mats.barkOak);
  group.add(bucket);

  // Gable canopy roof
  const roofGeo = new THREE.ConeGeometry(0.14, 0.08, 4);
  roofGeo.rotateY(Math.PI / 4);
  roofGeo.translate(0, 0.22 + 0.04, 0);
  const roof = new THREE.Mesh(roofGeo, mats.roofTerracotta);
  roof.castShadow = true;
  group.add(roof);

  return group;
}

/**
 * 8. Wooden Fence Rails (Composite 5-part rustic rail fence)
 */
export function createFence(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Fence';

  // 3 vertical posts
  for (let i = -1; i <= 1; i++) {
    const postGeo = new THREE.BoxGeometry(0.02, 0.1, 0.02);
    postGeo.translate(i * 0.1, 0.05, 0);
    const post = new THREE.Mesh(postGeo, mats.fenceWood);
    post.castShadow = true;
    group.add(post);
  }

  // 2 horizontal rails
  const rail1Geo = new THREE.BoxGeometry(0.24, 0.015, 0.012);
  rail1Geo.translate(0, 0.04, 0);
  const r1 = new THREE.Mesh(rail1Geo, mats.fenceWood);
  group.add(r1);

  const rail2Geo = new THREE.BoxGeometry(0.24, 0.015, 0.012);
  rail2Geo.translate(0, 0.075, 0);
  const r2 = new THREE.Mesh(rail2Geo, mats.fenceWood);
  group.add(r2);

  return group;
}

/**
 * 9. Wildflower Patch (Clustered colorful blooms)
 */
export function createFlowerPatch(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'FlowerPatch';

  const flowerMats = [mats.petalRed, mats.petalYellow, mats.petalWhite, mats.petalBlue];

  for (let i = 0; i < 7; i++) {
    const flower = new THREE.Group();
    const ang = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.09;

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.05, 4);
    stemGeo.translate(0, 0.025, 0);
    const stem = new THREE.Mesh(stemGeo, mats.stemGreen);
    flower.add(stem);

    // Petal disc
    const petalGeo = new THREE.DodecahedronGeometry(0.018, 0);
    const pMat = flowerMats[Math.floor(Math.random() * flowerMats.length)];
    const petal = new THREE.Mesh(petalGeo, pMat);
    petal.position.set(0, 0.05, 0);
    flower.add(petal);

    // Center
    const centerGeo = new THREE.SphereGeometry(0.007, 4, 4);
    const center = new THREE.Mesh(centerGeo, mats.flowerCenter);
    center.position.set(0, 0.053, 0);
    flower.add(center);

    flower.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r);
    group.add(flower);
  }

  return group;
}

/**
 * 10. Mountain Peak (Faceted craggy peak with snow cap)
 */
export function createMountainPeak(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'MountainPeak';

  // Base rock cone/pyramid (faceted)
  const rockGeo = new THREE.ConeGeometry(0.32, 0.44, 7);
  rockGeo.translate(0, 0.22, 0);
  const rock = new THREE.Mesh(rockGeo, mats.stoneDark);
  rock.castShadow = true;
  group.add(rock);

  // Secondary sub-ridge
  const subRidgeGeo = new THREE.ConeGeometry(0.18, 0.28, 5);
  subRidgeGeo.translate(0.12, 0.14, 0.08);
  const subRidge = new THREE.Mesh(subRidgeGeo, mats.stoneGray);
  subRidge.castShadow = true;
  group.add(subRidge);

  // Snow cap summit
  const snowGeo = new THREE.ConeGeometry(0.14, 0.18, 7);
  snowGeo.translate(0, 0.35, 0);
  const snow = new THREE.Mesh(snowGeo, mats.snow);
  snow.castShadow = true;
  group.add(snow);

  return group;
}

/**
 * 11. Puffy Low-Poly Cloud (Compound 5-puff cloud)
 */
export function createCloud(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Cloud';

  const puffs = [
    { r: 0.12, x: 0, y: 0.06, z: 0 },
    { r: 0.09, x: -0.11, y: 0.04, z: 0.02 },
    { r: 0.1, x: 0.11, y: 0.05, z: -0.01 },
    { r: 0.07, x: 0.05, y: 0.03, z: 0.08 },
    { r: 0.08, x: -0.04, y: 0.04, z: -0.07 },
  ];

  puffs.forEach((p) => {
    const geo = new THREE.DodecahedronGeometry(p.r, 1);
    const m = new THREE.Mesh(geo, mats.cloudPuff);
    m.position.set(p.x, p.y, p.z);
    m.castShadow = true;
    group.add(m);
  });

  return group;
}

/**
 * 12. Animated Villager (Tunic, head, hat, hands, moving legs)
 */
export function createVillager(tunicColorHex: number = 0x3a86ff, hatColorHex: number = 0xd4a373): {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = 'Villager';

  const tunicMat = new THREE.MeshStandardMaterial({ color: tunicColorHex, roughness: 0.75 });
  const hatMat = new THREE.MeshStandardMaterial({ color: hatColorHex, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.6 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.9 });

  // 1. Tunic Body
  const bodyGeo = new THREE.CylinderGeometry(0.024, 0.032, 0.06, 6);
  bodyGeo.translate(0, 0.06, 0);
  const body = new THREE.Mesh(bodyGeo, tunicMat);
  body.castShadow = true;
  group.add(body);

  // 2. Head
  const headGeo = new THREE.SphereGeometry(0.022, 6, 6);
  headGeo.translate(0, 0.105, 0);
  const head = new THREE.Mesh(headGeo, skinMat);
  group.add(head);

  // 3. Hat / Bonnet
  const hatGeo = new THREE.ConeGeometry(0.034, 0.03, 6);
  hatGeo.translate(0, 0.125, 0);
  const hat = new THREE.Mesh(hatGeo, hatMat);
  group.add(hat);

  // 4. Left Leg
  const legGeo = new THREE.BoxGeometry(0.012, 0.035, 0.012);
  legGeo.translate(0, -0.015, 0);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.014, 0.035, 0);
  group.add(leftLeg);

  // 5. Right Leg
  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.014, 0.035, 0);
  group.add(rightLeg);

  // 6. Left Arm
  const armGeo = new THREE.BoxGeometry(0.01, 0.04, 0.01);
  armGeo.translate(0, -0.018, 0);
  const leftArm = new THREE.Mesh(armGeo, tunicMat);
  leftArm.position.set(-0.034, 0.08, 0);
  group.add(leftArm);

  // 7. Right Arm
  const rightArm = new THREE.Mesh(armGeo, tunicMat);
  rightArm.position.set(0.034, 0.08, 0);
  group.add(rightArm);

  return { group, leftLeg, rightLeg, leftArm, rightArm };
}

/**
 * 13. Animated Grazing Sheep (Fluffy wool body, dark face, 4 legs)
 */
export function createSheep(): {
  group: THREE.Group;
  headGroup: THREE.Group;
  legFL: THREE.Mesh;
  legFR: THREE.Mesh;
  legBL: THREE.Mesh;
  legBR: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = 'Sheep';

  // Fluffy compound wool body
  const bodyGroup = new THREE.Group();
  const mainWoolGeo = new THREE.DodecahedronGeometry(0.048, 1);
  mainWoolGeo.scale(1.25, 1.0, 1.0);
  mainWoolGeo.translate(0, 0.058, 0);
  const woolMain = new THREE.Mesh(mainWoolGeo, mats.sheepWool);
  woolMain.castShadow = true;
  bodyGroup.add(woolMain);

  // Mini wool puffs for roundness
  const puff1 = new THREE.Mesh(new THREE.SphereGeometry(0.024, 4, 4), mats.sheepWool);
  puff1.position.set(-0.035, 0.065, 0);
  bodyGroup.add(puff1);

  const puff2 = new THREE.Mesh(new THREE.SphereGeometry(0.024, 4, 4), mats.sheepWool);
  puff2.position.set(0.035, 0.065, 0);
  bodyGroup.add(puff2);
  group.add(bodyGroup);

  // Head group (can tilt down to graze!)
  const headGroup = new THREE.Group();
  headGroup.position.set(0.055, 0.06, 0);

  const headGeo = new THREE.BoxGeometry(0.026, 0.026, 0.026);
  const head = new THREE.Mesh(headGeo, mats.sheepSkin);
  headGroup.add(head);

  // Ears
  const earGeo = new THREE.BoxGeometry(0.012, 0.006, 0.02);
  earGeo.translate(0, 0.01, 0.018);
  const earL = new THREE.Mesh(earGeo, mats.sheepSkin);
  headGroup.add(earL);

  const earR = new THREE.Mesh(earGeo, mats.sheepSkin);
  earR.position.z = -0.036;
  headGroup.add(earR);

  // Wool cap on head
  const headWool = new THREE.Mesh(new THREE.SphereGeometry(0.014, 4, 4), mats.sheepWool);
  headWool.position.set(-0.005, 0.016, 0);
  headGroup.add(headWool);

  group.add(headGroup);

  // 4 Dark little legs
  const legGeo = new THREE.BoxGeometry(0.01, 0.035, 0.01);
  legGeo.translate(0, -0.015, 0);

  const legFL = new THREE.Mesh(legGeo, mats.sheepSkin);
  legFL.position.set(0.03, 0.03, 0.025);
  group.add(legFL);

  const legFR = new THREE.Mesh(legGeo, mats.sheepSkin);
  legFR.position.set(0.03, 0.03, -0.025);
  group.add(legFR);

  const legBL = new THREE.Mesh(legGeo, mats.sheepSkin);
  legBL.position.set(-0.03, 0.03, 0.025);
  group.add(legBL);

  const legBR = new THREE.Mesh(legGeo, mats.sheepSkin);
  legBR.position.set(-0.03, 0.03, -0.025);
  group.add(legBR);

  return { group, headGroup, legFL, legFR, legBL, legBR };
}
