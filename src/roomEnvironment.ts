import * as THREE from 'three';

export interface RoomRig {
  roomGroup: THREE.Group;
  orbGroup: THREE.Group;
  orbMesh: THREE.Mesh;
  windowLight: THREE.DirectionalLight;
  roomFillLight: THREE.HemisphereLight;
  fireflyGroup: THREE.Group;
  fireflies: Array<{ mesh: THREE.Mesh; seed: number; speed: number; radius: number }>;
  updateTimeOfDay: (timeOfDay: number) => void;
  updateFireflies: (time: number, isNight: boolean) => void;
}

export function createRoomEnvironment(): RoomRig {
  const roomGroup = new THREE.Group();
  roomGroup.name = 'RoomEnvironment';

  // 1. Chalky White Windowsill
  const sillMat = new THREE.MeshStandardMaterial({
    color: 0xf5f4ef,
    roughness: 0.88,
    metalness: 0.02,
  });

  const sillGeo = new THREE.BoxGeometry(18, 0.6, 12);
  const sillMesh = new THREE.Mesh(sillGeo, sillMat);
  sillMesh.position.set(0, -3.2, -1.0);
  sillMesh.receiveShadow = true;
  roomGroup.add(sillMesh);

  // Sill front nosing / bevel
  const nosingGeo = new THREE.CylinderGeometry(0.3, 0.3, 18, 16);
  nosingGeo.rotateZ(Math.PI / 2);
  const nosingMesh = new THREE.Mesh(nosingGeo, sillMat);
  nosingMesh.position.set(0, -3.2, 5.0);
  nosingMesh.receiveShadow = true;
  roomGroup.add(nosingMesh);

  // Wall beneath sill
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xded8ce,
    roughness: 0.95,
  });
  const wallGeo = new THREE.BoxGeometry(18, 6, 1);
  const wallMesh = new THREE.Mesh(wallGeo, wallMat);
  wallMesh.position.set(0, -6.5, 4.8);
  roomGroup.add(wallMesh);

  // 2. Window Frame & Sashes (Behind the orb)
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xeeebe2,
    roughness: 0.85,
  });

  // Vertical window mullion
  const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 12, 0.2), frameMat);
  mullionV.position.set(1.5, 2.0, -5.5);
  roomGroup.add(mullionV);

  // Horizontal window transom
  const transomH = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 0.2), frameMat);
  transomH.position.set(0, 3.8, -5.5);
  roomGroup.add(transomH);

  // 3. Lavender Evening Sky Backdrop (Procedural canvas gradient texture)
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 512;
  skyCanvas.height = 512;
  const ctx = skyCanvas.getContext('2d')!;

  const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
  skyGrad.addColorStop(0, '#534d74'); // dusky lavender violet
  skyGrad.addColorStop(0.35, '#877da4'); // soft lavender
  skyGrad.addColorStop(0.65, '#c5a0b4'); // mauve rose
  skyGrad.addColorStop(0.85, '#eec5a8'); // warm peach
  skyGrad.addColorStop(1.0, '#f8ddb8'); // golden sunset glow
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Add subtle distant mountain / pine silhouette along the horizon
  ctx.fillStyle = 'rgba(75, 62, 92, 0.35)';
  ctx.beginPath();
  ctx.moveTo(0, 512);
  ctx.lineTo(0, 440);
  ctx.bezierCurveTo(80, 420, 160, 450, 240, 430);
  ctx.bezierCurveTo(320, 410, 400, 445, 512, 425);
  ctx.lineTo(512, 512);
  ctx.closePath();
  ctx.fill();

  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  skyTexture.colorSpace = THREE.SRGBColorSpace;

  const skyGeo = new THREE.PlaneGeometry(24, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTexture,
    depthWrite: false,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.position.set(0, 2.5, -6.8);
  roomGroup.add(skyMesh);

  // 4. Turned Walnut Stand with Brass Collar
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x3d2516,
    roughness: 0.42,
    metalness: 0.08,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd9b343,
    roughness: 0.22,
    metalness: 0.88,
  });

  const standGroup = new THREE.Group();
  standGroup.name = 'WalnutStand';
  standGroup.position.set(0, -2.9, 0);

  // Plinth base
  const plinthGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.2, 32);
  const plinth = new THREE.Mesh(plinthGeo, walnutMat);
  plinth.position.y = 0.1;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  standGroup.add(plinth);

  // Turned concave base moulding
  const mouldGeo = new THREE.CylinderGeometry(1.2, 1.6, 0.18, 32);
  const mould = new THREE.Mesh(mouldGeo, walnutMat);
  mould.position.y = 0.29;
  mould.castShadow = true;
  standGroup.add(mould);

  // Torus bead ring
  const beadGeo = new THREE.TorusGeometry(1.2, 0.08, 16, 32);
  beadGeo.rotateX(Math.PI / 2);
  const bead = new THREE.Mesh(beadGeo, walnutMat);
  bead.position.y = 0.38;
  standGroup.add(bead);

  // Fluted turned pedestal neck
  const neckGeo = new THREE.CylinderGeometry(0.9, 1.15, 0.35, 32);
  const neck = new THREE.Mesh(neckGeo, walnutMat);
  neck.position.y = 0.55;
  neck.castShadow = true;
  standGroup.add(neck);

  // Upper walnut cup rim
  const cupGeo = new THREE.CylinderGeometry(1.35, 1.0, 0.25, 32);
  const cup = new THREE.Mesh(cupGeo, walnutMat);
  cup.position.y = 0.85;
  cup.castShadow = true;
  standGroup.add(cup);

  // Polished Brass Collar (holds the orb)
  const collarGeo = new THREE.TorusGeometry(1.35, 0.09, 16, 40);
  collarGeo.rotateX(Math.PI / 2);
  const collar = new THREE.Mesh(collarGeo, brassMat);
  collar.position.y = 0.98;
  collar.castShadow = true;
  standGroup.add(collar);

  roomGroup.add(standGroup);

  // Soft contact shadow directly under the walnut stand
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
  sGrad.addColorStop(0, 'rgba(25, 18, 14, 0.65)');
  sGrad.addColorStop(0.6, 'rgba(25, 18, 14, 0.25)');
  sGrad.addColorStop(1, 'rgba(25, 18, 14, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 5.2),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.85 })
  );
  shadowPlane.rotateX(-Math.PI / 2);
  shadowPlane.position.set(0, -2.89, 0);
  roomGroup.add(shadowPlane);

  // 5. Folded Linen Cloth on the Windowsill (Left of stand)
  const clothMat = new THREE.MeshStandardMaterial({
    color: 0xede4d6,
    roughness: 0.96,
    metalness: 0.01,
  });

  const clothGroup = new THREE.Group();
  clothGroup.position.set(-3.2, -2.88, 0.8);
  clothGroup.rotation.y = 0.35;

  // 3 folded tiers
  const fold1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 1.8), clothMat);
  fold1.position.set(0, 0.03, 0);
  fold1.castShadow = true;
  fold1.receiveShadow = true;
  clothGroup.add(fold1);

  const fold2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 1.6), clothMat);
  fold2.position.set(0.08, 0.08, -0.05);
  fold2.castShadow = true;
  clothGroup.add(fold2);

  const fold3 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 1.4), clothMat);
  fold3.position.set(0.12, 0.12, -0.1);
  fold3.castShadow = true;
  clothGroup.add(fold3);

  // Draped folded edge over front
  const hemGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.9, 12);
  hemGeo.rotateZ(Math.PI / 2);
  const hem = new THREE.Mesh(hemGeo, clothMat);
  hem.position.set(0, 0.05, 0.9);
  clothGroup.add(hem);

  roomGroup.add(clothGroup);

  // 6. Potted Succulent (Right of stand, establishing domestic scale)
  const potGroup = new THREE.Group();
  potGroup.position.set(3.4, -2.88, 0.4);

  // Terracotta pot
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xbd6545,
    roughness: 0.84,
  });
  const potGeo = new THREE.CylinderGeometry(0.65, 0.45, 0.9, 24);
  potGeo.translate(0, 0.45, 0);
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.castShadow = true;
  pot.receiveShadow = true;
  potGroup.add(pot);

  // Pot rim
  const potRimGeo = new THREE.TorusGeometry(0.66, 0.05, 12, 24);
  potRimGeo.rotateX(Math.PI / 2);
  const potRim = new THREE.Mesh(potRimGeo, potMat);
  potRim.position.y = 0.9;
  potGroup.add(potRim);

  // Dark potting soil
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x2b1e18, roughness: 0.95 });
  const soilGeo = new THREE.CircleGeometry(0.6, 16);
  soilGeo.rotateX(-Math.PI / 2);
  soilGeo.translate(0, 0.86, 0);
  const soil = new THREE.Mesh(soilGeo, soilMat);
  potGroup.add(soil);

  // Fleshy succulent leaves (Echeveria spiral rosette)
  const succMat = new THREE.MeshStandardMaterial({
    color: 0x4a8b68,
    roughness: 0.32,
    metalness: 0.05,
    flatShading: true,
  });
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0x9e5b72,
    roughness: 0.4,
    flatShading: true,
  });

  const rings = [
    { count: 10, radius: 0.48, scale: 0.22, y: 0.89, pitch: 0.35 },
    { count: 8, radius: 0.35, scale: 0.18, y: 0.96, pitch: 0.5 },
    { count: 6, radius: 0.22, scale: 0.14, y: 1.02, pitch: 0.65 },
    { count: 4, radius: 0.1, scale: 0.1, y: 1.07, pitch: 0.8 },
  ];

  rings.forEach((ring, rIdx) => {
    for (let i = 0; i < ring.count; i++) {
      const ang = (i * Math.PI * 2) / ring.count + rIdx * 0.35;
      const leafGroup = new THREE.Group();

      const leafGeo = new THREE.ConeGeometry(0.1, 0.28, 5);
      leafGeo.scale(1.2, 1.0, 0.5);
      leafGeo.rotateX(Math.PI / 2);
      const leaf = new THREE.Mesh(leafGeo, rIdx === 0 ? succMat : tipMat);
      leaf.castShadow = true;
      leafGroup.add(leaf);

      leafGroup.position.set(Math.cos(ang) * ring.radius, ring.y, Math.sin(ang) * ring.radius);
      leafGroup.rotation.y = -ang - Math.PI / 2;
      leafGroup.rotation.x = ring.pitch;
      leafGroup.scale.setScalar(ring.scale / 0.2);

      potGroup.add(leafGroup);
    }
  });

  roomGroup.add(potGroup);

  // 7. The Clear Glass Orb
  // Orb radius ~2.8 (approx 30cm scale in domestic setting), centered at (0, 0, 0)
  const orbGroup = new THREE.Group();
  orbGroup.name = 'GlassOrbGroup';

  const orbRadius = 2.85;

  // Outer Optical Glass Sphere
  const orbGeo = new THREE.SphereGeometry(orbRadius, 64, 48);
  const orbMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.94,
    opacity: 1,
    transparent: true,
    roughness: 0.05,
    ior: 1.48,
    thickness: 0.4,
    attenuationColor: new THREE.Color(0xd2f0e3), // faint green edges per prompt
    attenuationDistance: 4.5,
    specularIntensity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    depthWrite: false, // Ensure interior village is completely crisp & never occlusion-clipped
    side: THREE.FrontSide,
  });

  const orbMesh = new THREE.Mesh(orbGeo, orbMat);
  orbMesh.name = 'GlassOrb';
  orbGroup.add(orbMesh);

  // Curved window reflection highlight describing its round surface (per prompt)
  const curvedReflectCanvas = document.createElement('canvas');
  curvedReflectCanvas.width = 256;
  curvedReflectCanvas.height = 256;
  const crCtx = curvedReflectCanvas.getContext('2d')!;
  crCtx.clearRect(0, 0, 256, 256);

  // Soft curved window panes specular reflection
  const reflGrad = crCtx.createLinearGradient(60, 40, 180, 160);
  reflGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  reflGrad.addColorStop(0.4, 'rgba(255, 250, 240, 0.25)');
  reflGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  crCtx.fillStyle = reflGrad;

  // Window pane 1
  crCtx.beginPath();
  crCtx.roundRect(70, 50, 42, 50, 6);
  crCtx.fill();
  // Window pane 2
  crCtx.beginPath();
  crCtx.roundRect(120, 50, 42, 50, 6);
  crCtx.fill();
  // Window pane 3
  crCtx.beginPath();
  crCtx.roundRect(70, 110, 42, 50, 6);
  crCtx.fill();
  // Window pane 4
  crCtx.beginPath();
  crCtx.roundRect(120, 110, 42, 50, 6);
  crCtx.fill();

  const reflTex = new THREE.CanvasTexture(curvedReflectCanvas);
  reflTex.colorSpace = THREE.SRGBColorSpace;

  const curvedReflGeo = new THREE.SphereGeometry(orbRadius + 0.005, 32, 24, -Math.PI / 4, Math.PI / 2, Math.PI / 6, Math.PI / 3);
  const curvedReflMat = new THREE.MeshBasicMaterial({
    map: reflTex,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
  const curvedReflMesh = new THREE.Mesh(curvedReflGeo, curvedReflMat);
  orbGroup.add(curvedReflMesh);

  // 8. Drifting Fireflies inside the glass orb (Night mode)
  const fireflyGroup = new THREE.Group();
  fireflyGroup.name = 'Fireflies';
  const fireflies: Array<{ mesh: THREE.Mesh; seed: number; speed: number; radius: number }> = [];

  const fireflyMat = new THREE.MeshBasicMaterial({
    color: 0xddff66,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const fireflyGeo = new THREE.SphereGeometry(0.02, 6, 6);

  for (let i = 0; i < 14; i++) {
    const ff = new THREE.Mesh(fireflyGeo, fireflyMat.clone());
    const seed = Math.random() * Math.PI * 2;
    const speed = 0.4 + Math.random() * 0.5;
    const radius = 1.9 + Math.random() * 0.7; // suspended inside orb atmosphere
    ff.position.set(
      Math.sin(seed) * radius,
      (Math.random() - 0.5) * 1.8,
      Math.cos(seed) * radius
    );
    fireflyGroup.add(ff);
    fireflies.push({ mesh: ff, seed, speed, radius });
  }

  orbGroup.add(fireflyGroup);
  roomGroup.add(orbGroup);

  // 9. Room Lighting Rig
  // Key Window Light (soft warm evening light coming from upper-left-back)
  const windowLight = new THREE.DirectionalLight(0xffeed6, 1.6);
  windowLight.position.set(-5, 6, -3);
  windowLight.castShadow = true;
  windowLight.shadow.mapSize.width = 1024;
  windowLight.shadow.mapSize.height = 1024;
  windowLight.shadow.camera.near = 1;
  windowLight.shadow.camera.far = 18;
  windowLight.shadow.camera.left = -6;
  windowLight.shadow.camera.right = 6;
  windowLight.shadow.camera.top = 6;
  windowLight.shadow.camera.bottom = -6;
  windowLight.shadow.bias = -0.0004;
  roomGroup.add(windowLight);

  // Soft Warm Room Fill Light
  const roomFillLight = new THREE.HemisphereLight(0xdde3ea, 0x5a4a3e, 0.7);
  roomGroup.add(roomFillLight);

  // Dynamic Time-of-Day Updater for Room Lighting & Sky
  const updateTimeOfDay = (timeOfDay: number) => {
    // 0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight
    const isNight = timeOfDay > 0.45 && timeOfDay < 0.92;

    if (isNight) {
      // Darkened cozy room in night mode
      windowLight.color.setHex(0x667799);
      windowLight.intensity = 0.35;
      roomFillLight.intensity = 0.2;
      sillMat.color.setHex(0x353842);
      wallMat.color.setHex(0x242730);
    } else if (timeOfDay > 0.38 && timeOfDay <= 0.45) {
      // Golden hour sunset
      windowLight.color.setHex(0xffaa66);
      windowLight.intensity = 1.8;
      roomFillLight.intensity = 0.75;
      sillMat.color.setHex(0xf5ebe1);
      wallMat.color.setHex(0xded0c4);
    } else {
      // Daytime
      windowLight.color.setHex(0xfffaed);
      windowLight.intensity = 1.5;
      roomFillLight.intensity = 0.8;
      sillMat.color.setHex(0xf5f4ef);
      wallMat.color.setHex(0xded8ce);
    }
  };

  // Animate drifting fireflies
  const updateFireflies = (time: number, isNight: boolean) => {
    fireflies.forEach((ff, idx) => {
      const mat = ff.mesh.material as THREE.MeshBasicMaterial;
      if (isNight) {
        // Fade in and softly twinkle
        const pulse = 0.5 + 0.5 * Math.sin(time * 3 + ff.seed);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.4 + 0.55 * pulse, 0.08);

        // Gentle 3D wandering
        const angle = ff.seed + time * 0.2 * ff.speed + idx;
        const curR = ff.radius + Math.sin(time * 0.8 + idx) * 0.15;
        ff.mesh.position.x = Math.sin(angle) * curR;
        ff.mesh.position.z = Math.cos(angle) * curR;
        ff.mesh.position.y += Math.sin(time * 1.5 + ff.seed) * 0.003;

        // Keep inside bounds
        if (ff.mesh.position.y > 1.4) ff.mesh.position.y = -1.2;
        if (ff.mesh.position.y < -1.4) ff.mesh.position.y = 1.2;
      } else {
        // Fade out in daytime
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.0, 0.1);
      }
    });
  };

  return {
    roomGroup,
    orbGroup,
    orbMesh,
    windowLight,
    roomFillLight,
    fireflyGroup,
    fireflies,
    updateTimeOfDay,
    updateFireflies,
  };
}
