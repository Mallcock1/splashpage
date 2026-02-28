import * as THREE from "three";

function buildNodeCloud(count, radiusMin, radiusMax) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const randomSphere = new THREE.Spherical();

  for (let i = 0; i < count; i += 1) {
    randomSphere.radius = THREE.MathUtils.randFloat(radiusMin, radiusMax);
    randomSphere.phi = THREE.MathUtils.randFloat(0.12, Math.PI - 0.12);
    randomSphere.theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const point = new THREE.Vector3().setFromSpherical(randomSphere);
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xc6c1ee,
    size: 0.035,
    transparent: true,
    opacity: 0.9
  });

  return new THREE.Points(geometry, material);
}

function buildArcs(count, radius) {
  const group = new THREE.Group();

  for (let i = 0; i < count; i += 1) {
    const curve = new THREE.EllipseCurve(
      0,
      0,
      radius + i * 0.07,
      radius * (0.55 + i * 0.05),
      0,
      Math.PI * 2,
      false,
      i * 0.42
    );
    const points = curve.getPoints(120).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: i % 2 === 0 ? 0xa7b8ff : 0x6e83c6,
      transparent: true,
      opacity: 0.6
    });

    const line = new THREE.LineLoop(geometry, material);
    line.rotation.x = i * 0.35;
    line.rotation.y = i * 0.7;
    group.add(line);
  }

  return group;
}

function createPreview1(tier) {
  const root = new THREE.Group();

  const arcs = buildArcs(tier === "high" ? 5 : 4, 1.05);
  const nodeCloud = buildNodeCloud(tier === "high" ? 300 : 210, 1.2, 2.45);
  nodeCloud.material.size = 0.085;
  nodeCloud.material.opacity = 0.74;

  const coreTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.44, 0.11, 24, 80),
    new THREE.MeshBasicMaterial({
      color: 0xa7b8ff,
      transparent: true,
      opacity: 0.86
    })
  );
  coreTorus.rotation.x = Math.PI * 0.32;

  const innerTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.06, 18, 64),
    new THREE.MeshBasicMaterial({
      color: 0xd7e4ff,
      transparent: true,
      opacity: 0.9
    })
  );
  innerTorus.rotation.y = Math.PI * 0.25;

  const centerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xc6c1ee,
      transparent: true,
      opacity: 0.82
    })
  );

  root.add(arcs, nodeCloud, coreTorus, innerTorus, centerGlow);
  root.position.x = 0.56;
  root.position.y = -0.04;
  root.scale.setScalar(1.16);

  return {
    root,
    update({ elapsed, progress }) {
      arcs.rotation.y = elapsed * 0.14 + progress * 0.45;
      arcs.rotation.x = elapsed * 0.09;
      nodeCloud.rotation.y = -elapsed * 0.05;
      nodeCloud.material.opacity = 0.58 + progress * 0.25;
      coreTorus.rotation.y = elapsed * 0.48;
      coreTorus.rotation.z = elapsed * 0.2;
      innerTorus.rotation.x = elapsed * 0.65;
      innerTorus.rotation.z = elapsed * 0.36;
      centerGlow.material.opacity = 0.64 + progress * 0.24;

    }
  };
}

function createPreview2(tier) {
  const root = new THREE.Group();

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, tier === "high" ? 44 : 28, tier === "high" ? 44 : 28),
    new THREE.MeshStandardMaterial({
      color: 0x18306a,
      emissive: 0x091533,
      emissiveIntensity: 0.8,
      roughness: 0.52,
      metalness: 0.18,
      transparent: true,
      opacity: 0.95
    })
  );

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.79, tier === "high" ? 34 : 20, tier === "high" ? 34 : 20),
    new THREE.MeshBasicMaterial({
      color: 0x8fd8ff,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    })
  );

  const orbitalShell = new THREE.Group();
  for (let i = 0; i < 4; i += 1) {
    const curve = new THREE.EllipseCurve(0, 0, 1.06 + i * 0.14, 0.58 + i * 0.07, 0, Math.PI * 2, false, i * 0.34);
    const points = curve.getPoints(120).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: i % 2 === 0 ? 0x8ca4ff : 0x9edcff,
      transparent: true,
      opacity: 0.24 + i * 0.07
    });
    const line = new THREE.LineLoop(geometry, material);
    line.rotation.set(i * 0.28 + 0.2, i * 0.55 + 0.1, i * 0.2);
    orbitalShell.add(line);
  }

  const stars = buildNodeCloud(tier === "high" ? 520 : 300, 1.8, 3.6);
  stars.material.size = 0.017;
  stars.material.opacity = 0.68;

  const corridors = [];
  const corridorGroup = new THREE.Group();
  const routes = [
    [new THREE.Vector3(-1.9, 0.3, 0.35), new THREE.Vector3(0.1, 0.95, 0.05), new THREE.Vector3(2.0, 0.22, -0.2)],
    [new THREE.Vector3(-1.6, -0.6, -0.25), new THREE.Vector3(0.1, -1.0, 0.18), new THREE.Vector3(1.9, -0.52, 0.3)],
    [new THREE.Vector3(-1.8, -0.12, 0.6), new THREE.Vector3(0.15, 0.2, 1.0), new THREE.Vector3(1.8, -0.08, 0.68)]
  ];

  routes.forEach((route, idx) => {
    const curve = new THREE.CatmullRomCurve3(route);
    const points = curve.getPoints(tier === "high" ? 90 : 50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: idx === 1 ? 0x8fc8ff : 0xa4b3ff,
      transparent: true,
      opacity: 0.28
    });
    const path = new THREE.Line(geometry, material);

    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0xd7e4ff,
        transparent: true,
        opacity: 0.95
      })
    );

    const source = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 10, 10),
      new THREE.MeshBasicMaterial({
        color: 0x9fc0ff,
        transparent: true,
        opacity: 0.85
      })
    );
    source.position.copy(route[0]);

    const target = source.clone();
    target.position.copy(route[2]);

    corridorGroup.add(path, pulse, source, target);
    corridors.push({
      curve,
      path,
      pulse,
      speed: 0.08 + idx * 0.02,
      phase: idx * 0.24
    });
  });

  root.add(globe, atmosphere, orbitalShell, corridorGroup, stars);

  return {
    root,
    update({ elapsed, progress }) {
      globe.rotation.y = elapsed * 0.16;
      globe.rotation.x = Math.sin(elapsed * 0.11) * 0.08;
      atmosphere.rotation.y = globe.rotation.y * 1.08;
      orbitalShell.rotation.y = elapsed * 0.08 + progress * 0.35;
      orbitalShell.rotation.x = elapsed * 0.05;
      corridorGroup.rotation.y = Math.sin(elapsed * 0.16) * 0.16;
      stars.rotation.y = -elapsed * 0.035;
      stars.material.opacity = 0.45 + progress * 0.34;

      corridors.forEach((corridor, idx) => {
        const t = (elapsed * corridor.speed + corridor.phase + progress * 0.18) % 1;
        corridor.pulse.position.copy(corridor.curve.getPointAt(t));
        corridor.path.material.opacity = 0.2 + progress * 0.45 + Math.sin(elapsed * 1.8 + idx) * 0.05;
        corridor.pulse.material.opacity = 0.5 + progress * 0.45;
      });

      atmosphere.material.opacity = 0.12 + progress * 0.2;
    }
  };
}

function createPreview3() {
  const root = new THREE.Group();

  const orb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 1),
    new THREE.MeshStandardMaterial({
      color: 0x9f94f8,
      emissive: 0x3d356a,
      emissiveIntensity: 0.65,
      metalness: 0.26,
      roughness: 0.18
    })
  );

  const receiver = new THREE.Mesh(
    new THREE.TorusGeometry(0.96, 0.06, 14, 72),
    new THREE.MeshStandardMaterial({
      color: 0xcfd6ff,
      metalness: 0.62,
      roughness: 0.23
    })
  );
  receiver.rotation.x = Math.PI / 2;

  const beams = [];
  for (let i = 0; i < 6; i += 1) {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.01, 2.1, 10, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xb4acff,
        transparent: true,
        opacity: 0.35
      })
    );
    beam.rotation.z = (Math.PI * 2 * i) / 6;
    beams.push(beam);
    root.add(beam);
  }

  root.add(orb, receiver);

  return {
    root,
    update({ elapsed, progress, reducedMotion }) {
      orb.rotation.x = elapsed * 0.5;
      orb.rotation.y = elapsed * 0.3;
      receiver.rotation.z = elapsed * 0.12;
      beams.forEach((beam, idx) => {
        beam.material.opacity = 0.2 + progress * 0.65 + Math.sin(elapsed * 2.6 + idx) * 0.06;
      });
      if (!reducedMotion) {
        root.rotation.y = elapsed * 0.08;
      }
    }
  };
}

function createPreview4(tier) {
  const root = new THREE.Group();

  const grid = new THREE.GridHelper(4.2, tier === "high" ? 22 : 14, 0x8fa7e0, 0x4f66a7);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -0.8;

  const cubes = [];
  for (let i = 0; i < 8; i += 1) {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xb3a8ff : 0x9bc6ff,
        emissive: i % 2 === 0 ? 0x3f3a74 : 0x2d4f7a,
        emissiveIntensity: 0.55,
        metalness: 0.45,
        roughness: 0.28
      })
    );
    const angle = (Math.PI * 2 * i) / 8;
    cube.userData.angle = angle;
    cube.userData.radius = 1.2 + (i % 3) * 0.35;
    cubes.push(cube);
    root.add(cube);
  }

  root.add(grid);
  root.position.x = 0.7;
  root.position.y = -0.06;
  root.scale.setScalar(1.2);

  return {
    root,
    update({ elapsed, progress }) {
      cubes.forEach((cube, idx) => {
        const t = elapsed * 0.35 + cube.userData.angle;
        const radius = cube.userData.radius + progress * 0.35;
        cube.position.set(Math.cos(t) * radius, Math.sin(t * 1.2 + idx) * 0.45, Math.sin(t) * radius);
        cube.rotation.x = elapsed * (0.4 + idx * 0.03);
        cube.rotation.y = elapsed * (0.3 + idx * 0.02);
      });
      const gridOpacity = 0.28 + progress * 0.38;
      if (Array.isArray(grid.material)) {
        grid.material.forEach((material) => {
          material.opacity = gridOpacity;
          material.transparent = true;
        });
      } else {
        grid.material.opacity = gridOpacity;
        grid.material.transparent = true;
      }
    }
  };
}

function createPreview5(tier) {
  const root = new THREE.Group();

  const halo = buildNodeCloud(tier === "high" ? 520 : 320, 1.2, 3.0);
  halo.material.color = new THREE.Color(0x9ab3ff);
  halo.material.size = 0.02;
  halo.material.opacity = 0.65;

  const core = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.55, 0),
    new THREE.MeshStandardMaterial({
      color: 0xbaaef9,
      emissive: 0x3d356a,
      emissiveIntensity: 0.5,
      metalness: 0.35,
      roughness: 0.22
    })
  );

  const spiral = [];
  for (let i = 0; i < 3; i += 1) {
    const line = new THREE.Mesh(
      new THREE.TorusGeometry(1.0 + i * 0.28, 0.02, 10, 120),
      new THREE.MeshStandardMaterial({
        color: 0x93a6ff,
        transparent: true,
        opacity: 0.45
      })
    );
    line.rotation.set(i * 0.5, i * 0.8, i * 0.3);
    spiral.push(line);
    root.add(line);
  }

  root.add(halo, core);

  return {
    root,
    update({ elapsed, progress }) {
      core.rotation.x = elapsed * 0.24;
      core.rotation.y = elapsed * 0.38;
      halo.rotation.y = -elapsed * 0.06;
      halo.material.opacity = 0.45 + progress * 0.5;
      spiral.forEach((line, idx) => {
        line.rotation.x += 0.002 + idx * 0.0008;
        line.rotation.z += 0.0018;
        line.material.opacity = 0.28 + progress * 0.5;
      });
    }
  };
}

function createVariantScene(variant, tier) {
  switch (variant) {
    case "preview-2":
      return createPreview2(tier);
    case "preview-3":
      return createPreview3();
    case "preview-4":
      return createPreview4(tier);
    case "preview-5":
      return createPreview5(tier);
    case "preview-1":
    default:
      return createPreview1(tier);
  }
}

export function initHeroScene(canvas, { tier = "high", reducedMotion = false, variant = "preview-1" } = {}) {
  if (!canvas) {
    return null;
  }

  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
  } catch {
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: true,
        powerPreference: "default"
      });
    } catch {
      return null;
    }
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === "high" ? 2 : 1.5));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x070e21, 2.6, 10);

  const camera = new THREE.PerspectiveCamera(48, canvas.clientWidth / canvas.clientHeight, 0.1, 30);
  camera.position.set(0, 0.18, 3.6);

  const ambient = new THREE.AmbientLight(0xc6c1ee, 0.6);
  const pointLight = new THREE.PointLight(0x8479d0, 10, 40, 2);
  pointLight.position.set(1.8, 1.3, 2.8);
  const fillLight = new THREE.PointLight(0x394563, 8, 30, 2);
  fillLight.position.set(-1.6, -1.4, 1.8);
  scene.add(ambient, pointLight, fillLight);

  const variantScene = createVariantScene(variant, tier);
  scene.add(variantScene.root);

  const pointer = { x: 0, y: 0 };
  const clock = new THREE.Clock();

  function onPointerMove(event) {
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;
    pointer.x = (x - 0.5) * 0.5;
    pointer.y = (y - 0.5) * 0.35;
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });

  function onResize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", onResize);
  onResize();

  function render(progress = 0) {
    const elapsed = clock.getElapsedTime();
    const easedProgress = THREE.MathUtils.smoothstep(progress, 0, 1);

    variantScene.update({
      elapsed,
      progress: easedProgress,
      reducedMotion
    });

    if (!reducedMotion) {
      variantScene.root.rotation.y += (pointer.x - variantScene.root.rotation.y) * 0.02;
      variantScene.root.rotation.x += (pointer.y - variantScene.root.rotation.x) * 0.02;
      camera.position.z = 3.6 - easedProgress * 0.6;
      camera.position.y = 0.18 - easedProgress * 0.12;
    }

    renderer.render(scene, camera);
  }

  let rafId;
  let targetProgress = 0;

  function loop() {
    render(targetProgress);
    rafId = window.requestAnimationFrame(loop);
  }

  loop();

  return {
    setProgress(progress) {
      targetProgress = THREE.MathUtils.clamp(progress, 0, 1);
    },
    dispose() {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((material) => material.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }
  };
}
