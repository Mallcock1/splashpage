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
      color: i % 2 === 0 ? 0x8479d0 : 0x394563,
      transparent: true,
      opacity: 0.4
    });

    const line = new THREE.LineLoop(geometry, material);
    line.rotation.x = i * 0.35;
    line.rotation.y = i * 0.7;
    group.add(line);
  }

  return group;
}

export function initHeroScene(canvas, { tier = "high", reducedMotion = false } = {}) {
  if (!canvas) {
    return null;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === "high" ? 2 : 1.5));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

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

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.48, tier === "high" ? 3 : 2),
    new THREE.MeshStandardMaterial({
      color: 0x8479d0,
      emissive: 0x2c2850,
      metalness: 0.24,
      roughness: 0.26,
      transparent: true,
      opacity: 0.92
    })
  );

  const shell = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.1, 220, tier === "high" ? 22 : 14),
    new THREE.MeshStandardMaterial({
      color: 0xc6c1ee,
      metalness: 0.68,
      roughness: 0.2,
      transparent: true,
      opacity: 0.35
    })
  );

  const nodeCloud = buildNodeCloud(tier === "high" ? 340 : 210, 1.35, 2.4);
  const arcs = buildArcs(tier === "high" ? 6 : 4, 1.08);

  const lattice = new THREE.Group();
  lattice.add(core, shell, arcs, nodeCloud);
  scene.add(lattice);

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

  function render(progress = 0) {
    const elapsed = clock.getElapsedTime();
    const easedProgress = THREE.MathUtils.smoothstep(progress, 0, 1);

    core.rotation.x = elapsed * 0.33;
    core.rotation.y = elapsed * 0.44;

    shell.rotation.x = elapsed * 0.16 + easedProgress * 0.5;
    shell.rotation.z = elapsed * 0.1;

    arcs.rotation.y = elapsed * 0.15 + easedProgress * 0.8;
    arcs.rotation.x = elapsed * 0.11;

    nodeCloud.rotation.y = -elapsed * 0.07;
    nodeCloud.material.opacity = 0.55 + easedProgress * 0.35;

    if (!reducedMotion) {
      lattice.rotation.y += (pointer.x - lattice.rotation.y) * 0.02;
      lattice.rotation.x += (pointer.y - lattice.rotation.x) * 0.02;
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
