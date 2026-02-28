const HOLD_MS = 8000;
const TRANSITION_MS = 1200;
const MAX_DPR = 2;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothStep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function createSeededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width * 0.5, height * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function pointOnRotatedEllipse(cx, cy, rx, ry, rotation, angle) {
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const ex = Math.cos(angle) * rx;
  const ey = Math.sin(angle) * ry;
  return {
    x: cx + ex * cosR - ey * sinR,
    y: cy + ex * sinR + ey * cosR
  };
}

function quadraticPoint(a, c, b, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x,
    y: mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y
  };
}

function drawSoftShadow(ctx, x, y, radiusX, radiusY, alpha) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(8, 14, 35, ${alpha})`;
  ctx.fill();
  ctx.restore();
}

function drawBeam(ctx, start, end, timeSec, reducedMotion, options = {}) {
  const {
    curvature = 0.14,
    width = 3.2,
    colorStart = "rgba(168, 206, 255, 0.92)",
    colorEnd = "rgba(198, 164, 255, 0.86)",
    packetCount = 0,
    packetSpeed = 0.48
  } = options;

  const normalX = end.y - start.y;
  const normalY = -(end.x - start.x);
  const normalLength = Math.max(1, Math.hypot(normalX, normalY));
  const nx = normalX / normalLength;
  const ny = normalY / normalLength;
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const curveOffset = distance * curvature;
  const control = {
    x: (start.x + end.x) * 0.5 + nx * curveOffset,
    y: (start.y + end.y) * 0.5 + ny * curveOffset
  };

  const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
  ctx.strokeStyle = "rgba(141, 184, 247, 0.24)";
  ctx.lineWidth = width + 2.6;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = width;
  ctx.stroke();

  const packets = reducedMotion ? 0 : packetCount;
  for (let i = 0; i < packets; i += 1) {
    const phase = (timeSec * packetSpeed + i / packets) % 1;
    const point = quadraticPoint(start, control, end, phase);
    const pulse = 1 + Math.sin((timeSec * 4 + i) % (Math.PI * 2)) * 0.18;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2.4 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(224, 236, 255, 0.95)";
    ctx.fill();
  }

  ctx.restore();
}

function drawSatellite(ctx, x, y, angle, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(104, 148, 235, 0.72)";
  roundedRectPath(ctx, -14, -3.8, 9.5, 7.6, 2.5);
  ctx.fill();
  roundedRectPath(ctx, 4.5, -3.8, 9.5, 7.6, 2.5);
  ctx.fill();

  const bodyGradient = ctx.createLinearGradient(-4.5, -5.2, 4.5, 6.2);
  bodyGradient.addColorStop(0, "rgba(233, 241, 255, 0.97)");
  bodyGradient.addColorStop(1, "rgba(167, 194, 239, 0.94)");
  roundedRectPath(ctx, -5.2, -5, 10.4, 10, 3.5);
  ctx.fillStyle = bodyGradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(206, 225, 255, 0.74)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawSceneGroundToDrone(ctx, width, height, timeSec, reducedMotion) {
  const tileCx = width * 0.52;
  const tileCy = height * 0.76;
  const tileWidth = width * 0.62;
  const tileHeight = height * 0.24;
  const halfW = tileWidth * 0.5;
  const halfH = tileHeight * 0.5;

  drawSoftShadow(ctx, tileCx, tileCy + halfH * 0.8, halfW * 0.92, halfH * 0.56, 0.2);

  const tileGradient = ctx.createLinearGradient(tileCx - halfW, tileCy - halfH, tileCx + halfW, tileCy + halfH);
  tileGradient.addColorStop(0, "rgba(93, 156, 96, 0.9)");
  tileGradient.addColorStop(1, "rgba(67, 127, 82, 0.96)");

  ctx.beginPath();
  ctx.moveTo(tileCx, tileCy - halfH);
  ctx.lineTo(tileCx + halfW, tileCy);
  ctx.lineTo(tileCx, tileCy + halfH);
  ctx.lineTo(tileCx - halfW, tileCy);
  ctx.closePath();
  ctx.fillStyle = tileGradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(201, 227, 189, 0.64)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.strokeStyle = "rgba(201, 222, 168, 0.26)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i += 1) {
    const t = i / 5;
    const left = lerp(tileCx - halfW, tileCx, t);
    const right = lerp(tileCx, tileCx + halfW, t);
    const y = lerp(tileCy, tileCy - halfH, t);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y + halfH * t);
    ctx.stroke();
  }

  const emitter = {
    x: tileCx - tileWidth * 0.16,
    y: tileCy - tileHeight * 0.02
  };
  const drift = reducedMotion ? 0 : Math.sin(timeSec * 0.52) * width * 0.09;
  const bob = reducedMotion ? 0 : Math.sin(timeSec * 2.05) * 7;
  const drone = {
    x: tileCx + tileWidth * 0.21 + drift,
    y: height * 0.31 + bob
  };

  drawSoftShadow(ctx, drone.x + 2, tileCy + tileHeight * 0.14, 40, 9, 0.21);
  drawBeam(ctx, emitter, drone, timeSec, reducedMotion, {
    curvature: 0.16,
    width: 3.2,
    packetCount: 6,
    packetSpeed: 0.5,
    colorStart: "rgba(175, 210, 255, 0.95)",
    colorEnd: "rgba(214, 170, 255, 0.88)"
  });

  const pulse = reducedMotion ? 0.56 : 0.54 + Math.sin(timeSec * 2.4) * 0.12;
  ctx.beginPath();
  ctx.arc(emitter.x, emitter.y, 14, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(45, 73, 40, 0.95)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(emitter.x, emitter.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(182, 230, 188, 0.86)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(emitter.x, emitter.y, 19 + pulse * 6, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(174, 211, 172, ${0.24 + pulse * 0.24})`;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  const droneGradient = ctx.createLinearGradient(drone.x - 26, drone.y - 18, drone.x + 28, drone.y + 20);
  droneGradient.addColorStop(0, "rgba(236, 244, 255, 0.98)");
  droneGradient.addColorStop(1, "rgba(171, 196, 239, 0.95)");
  roundedRectPath(ctx, drone.x - 34, drone.y - 13, 68, 26, 13);
  ctx.fillStyle = droneGradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(194, 218, 255, 0.8)";
  ctx.lineWidth = 1;
  ctx.stroke();

  roundedRectPath(ctx, drone.x - 16, drone.y - 22, 32, 10, 5);
  ctx.fillStyle = "rgba(151, 177, 228, 0.95)";
  ctx.fill();

  ctx.fillStyle = "rgba(72, 108, 189, 0.64)";
  roundedRectPath(ctx, drone.x - 48, drone.y - 7, 11, 7, 3);
  ctx.fill();
  roundedRectPath(ctx, drone.x + 37, drone.y - 7, 11, 7, 3);
  ctx.fill();
}

function drawSceneOrbitalTrading(ctx, width, height, timeSec, reducedMotion) {
  const centerX = width * 0.52;
  const centerY = height * 0.54;
  const radius = Math.min(width, height) * 0.16;

  drawSoftShadow(ctx, centerX, centerY + radius * 1.15, radius * 1.3, radius * 0.28, 0.22);

  const globeGradient = ctx.createRadialGradient(
    centerX - radius * 0.32,
    centerY - radius * 0.36,
    radius * 0.15,
    centerX,
    centerY,
    radius * 1.05
  );
  globeGradient.addColorStop(0, "rgba(112, 184, 255, 0.98)");
  globeGradient.addColorStop(0.56, "rgba(64, 126, 225, 0.95)");
  globeGradient.addColorStop(1, "rgba(38, 74, 170, 0.94)");
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = globeGradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(194, 222, 255, 0.65)";
  ctx.lineWidth = 1.3;
  ctx.stroke();

  ctx.fillStyle = "rgba(145, 214, 196, 0.56)";
  ctx.beginPath();
  ctx.ellipse(centerX - radius * 0.22, centerY - radius * 0.08, radius * 0.34, radius * 0.18, -0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(centerX + radius * 0.22, centerY + radius * 0.14, radius * 0.24, radius * 0.13, 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.06, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(175, 220, 255, 0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const orbitalDefs = [
    { rx: radius * 1.56, ry: radius * 0.64, rot: -0.52, speed: 0.31, phase: 0.2 },
    { rx: radius * 1.84, ry: radius * 0.79, rot: 0.12, speed: 0.23, phase: 1.44 },
    { rx: radius * 2.15, ry: radius * 0.98, rot: 0.53, speed: 0.19, phase: 2.74 },
    { rx: radius * 1.66, ry: radius * 0.61, rot: 0.86, speed: 0.27, phase: 3.34 },
    { rx: radius * 1.96, ry: radius * 0.72, rot: -0.18, speed: 0.22, phase: 4.2 }
  ];

  const satellites = [];
  const speedScale = reducedMotion ? 0.22 : 1;

  orbitalDefs.forEach((orbit, idx) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(orbit.rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, orbit.rx, orbit.ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(182, 204, 255, 0.27)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();

    const angle = timeSec * orbit.speed * speedScale + orbit.phase;
    const position = pointOnRotatedEllipse(centerX, centerY, orbit.rx, orbit.ry, orbit.rot, angle);
    const behindFactor = clamp((Math.sin(angle) + 0.14) / 1.14, 0, 1);
    const visibility = 1 - behindFactor * 0.68;
    satellites.push({
      x: position.x,
      y: position.y,
      visibility
    });
    ctx.save();
    ctx.globalAlpha = visibility;
    drawSatellite(ctx, position.x, position.y, angle + idx * 0.5, 1.02);
    ctx.restore();
  });

  for (let i = 0; i < satellites.length; i += 1) {
    const from = satellites[i];
    const to = satellites[(i + 1) % satellites.length];
    const beamVisibility = Math.min(from.visibility, to.visibility) * 0.92;
    ctx.save();
    ctx.globalAlpha = beamVisibility;
    drawBeam(ctx, from, to, timeSec + i * 0.15, reducedMotion, {
      curvature: 0.08,
      width: 2.1,
      packetCount: 3,
      packetSpeed: 0.35,
      colorStart: "rgba(188, 215, 255, 0.84)",
      colorEnd: "rgba(205, 176, 255, 0.72)"
    });
    ctx.restore();
  }
}

function drawSceneLunarRelay(ctx, width, height, timeSec, reducedMotion) {
  const moon = {
    x: width * 0.58,
    y: height * 0.56,
    r: Math.min(width, height) * 0.22
  };
  const orbit = {
    cx: moon.x,
    cy: moon.y,
    rx: moon.r * 1.6,
    ry: moon.r * 0.82,
    rot: -0.28
  };
  const orbitAngle = reducedMotion ? 0.9 : timeSec * 0.58;

  function evaluateSatellite(angle) {
    const position = pointOnRotatedEllipse(orbit.cx, orbit.cy, orbit.rx, orbit.ry, orbit.rot, angle);
    const moonDistance = Math.hypot(position.x - moon.x, position.y - moon.y);
    const overMoonDisk = moonDistance <= moon.r * 0.98;
    const isTopOrbit = position.y < moon.y - moon.r * 0.01;
    const behindMoon = isTopOrbit && overMoonDisk;
    const topRevealSpan = moon.r * 0.22;
    let satAlpha = 1;
    if (isTopOrbit) {
      satAlpha = clamp((moonDistance - moon.r * 0.98) / topRevealSpan, 0, 1);
    }
    const satVisible = satAlpha > 0.001;
    const isLowerOrbit = position.y > moon.y + moon.r * 0.02;
    const isFrontOrbit = position.y >= moon.y;
    const canBeamToBase = !behindMoon && isLowerOrbit;

    return {
      angle,
      position,
      overMoonDisk,
      satAlpha,
      satVisible,
      isFrontOrbit,
      canBeamToBase
    };
  }

  const satellites = [evaluateSatellite(orbitAngle), evaluateSatellite(orbitAngle + Math.PI)];

  ctx.save();
  ctx.translate(orbit.cx, orbit.cy);
  ctx.rotate(orbit.rot);
  ctx.beginPath();
  ctx.ellipse(0, 0, orbit.rx, orbit.ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(179, 204, 255, 0.26)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  const moonGradient = ctx.createRadialGradient(
    moon.x - moon.r * 0.28,
    moon.y - moon.r * 0.32,
    moon.r * 0.16,
    moon.x,
    moon.y,
    moon.r * 1.08
  );
  moonGradient.addColorStop(0, "rgba(236, 242, 255, 0.96)");
  moonGradient.addColorStop(0.55, "rgba(182, 194, 226, 0.95)");
  moonGradient.addColorStop(1, "rgba(126, 140, 178, 0.95)");
  ctx.beginPath();
  ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2);
  ctx.fillStyle = moonGradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(206, 220, 245, 0.56)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = "rgba(143, 158, 196, 0.28)";
  for (let i = 0; i < 4; i += 1) {
    const a = 1.35 + i * 0.5;
    const crater = {
      x: moon.x + Math.cos(a) * moon.r * (0.22 + i * 0.1),
      y: moon.y + Math.sin(a) * moon.r * (0.2 + i * 0.08)
    };
    ctx.beginPath();
    ctx.ellipse(crater.x, crater.y, moon.r * 0.08, moon.r * 0.05, a * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const receiverAngle = -2.42;
  const receiverYOffset = Math.sin(receiverAngle) * moon.r * 0.84;
  const receiver = {
    x: moon.x,
    y: moon.y + receiverYOffset
  };
  const baseWidth = 52;
  const baseOrigin = {
    x: receiver.x - baseWidth * 0.5,
    y: receiver.y - 14
  };

  drawSoftShadow(ctx, receiver.x, baseOrigin.y + 28, 36, 9, 0.2);
  roundedRectPath(ctx, baseOrigin.x, baseOrigin.y + 8, baseWidth, 18, 6);
  ctx.fillStyle = "rgba(216, 226, 246, 0.95)";
  ctx.fill();
  roundedRectPath(ctx, receiver.x - 12, baseOrigin.y - 4, 24, 10, 4);
  ctx.fillStyle = "rgba(174, 188, 221, 0.95)";
  ctx.fill();
  roundedRectPath(ctx, receiver.x - 28, baseOrigin.y + 10, 10, 12, 4);
  ctx.fillStyle = "rgba(190, 203, 230, 0.95)";
  ctx.fill();
  roundedRectPath(ctx, receiver.x + 18, baseOrigin.y + 10, 10, 12, 4);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(receiver.x, receiver.y, 5.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(188, 210, 247, 0.97)";
  ctx.fill();

  satellites.forEach((sat) => {
    if (sat.satVisible) {
      ctx.save();
      ctx.globalAlpha = sat.satAlpha;
      drawSatellite(ctx, sat.position.x, sat.position.y, sat.angle + 0.85, 1.1);
      ctx.restore();
      if (sat.isFrontOrbit && sat.overMoonDisk) {
        drawSoftShadow(ctx, sat.position.x + 3, sat.position.y + 18, 18, 6, 0.12);
      }
    }

    if (sat.canBeamToBase) {
      drawBeam(ctx, sat.position, receiver, timeSec, reducedMotion, {
        curvature: 0.08,
        width: 2.8,
        packetCount: 5,
        packetSpeed: 0.52,
        colorStart: "rgba(186, 217, 255, 0.94)",
        colorEnd: "rgba(202, 177, 255, 0.84)"
      });
    }
  });

  const glowStrength = reducedMotion ? 0.42 : 0.36 + (Math.sin(timeSec * 3.4) + 1) * 0.14;
  const glow = ctx.createRadialGradient(receiver.x, receiver.y, 0, receiver.x, receiver.y, 22);
  glow.addColorStop(0, `rgba(195, 224, 255, ${0.36 + glowStrength})`);
  glow.addColorStop(1, "rgba(195, 224, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(receiver.x, receiver.y, 22, 0, Math.PI * 2);
  ctx.fill();
}

function buildStars(width, height) {
  const count = Math.max(36, Math.floor((width * height) / 24000));
  const random = createSeededRandom((width << 16) ^ height ^ 0x9e3779b9);
  return Array.from({ length: count }, () => ({
    x: random() * width,
    y: random() * height * 0.76,
    radius: 0.7 + random() * 1.5,
    alpha: 0.2 + random() * 0.55,
    phase: random() * Math.PI * 2
  }));
}

function drawBackdrop(ctx, width, height, timeSec, stars, reducedMotion, theme = "space") {
  const radius = Math.min(width, height) * 0.08;
  roundedRectPath(ctx, 0, 0, width, height, radius);
  ctx.save();
  ctx.clip();

  if (theme === "day") {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "rgba(152, 210, 255, 1)");
    sky.addColorStop(0.56, "rgba(185, 228, 255, 1)");
    sky.addColorStop(1, "rgba(186, 233, 196, 0.86)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const sun = ctx.createRadialGradient(width * 0.86, height * 0.18, 0, width * 0.86, height * 0.18, width * 0.23);
    sun.addColorStop(0, "rgba(255, 248, 204, 0.92)");
    sun.addColorStop(1, "rgba(255, 248, 204, 0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, width, height);

    const cloudOffset = reducedMotion ? 0 : Math.sin(timeSec * 0.14) * width * 0.02;
    ctx.fillStyle = "rgba(245, 251, 255, 0.74)";
    const clouds = [
      { x: width * 0.2 + cloudOffset, y: height * 0.18, w: width * 0.22, h: height * 0.08 },
      { x: width * 0.62 - cloudOffset * 0.8, y: height * 0.24, w: width * 0.18, h: height * 0.07 },
      { x: width * 0.46 + cloudOffset * 0.6, y: height * 0.12, w: width * 0.16, h: height * 0.06 }
    ];
    clouds.forEach((cloud) => {
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, cloud.w * 0.34, cloud.h * 0.5, 0, 0, Math.PI * 2);
      ctx.ellipse(cloud.x - cloud.w * 0.2, cloud.y + cloud.h * 0.06, cloud.w * 0.24, cloud.h * 0.44, 0, 0, Math.PI * 2);
      ctx.ellipse(cloud.x + cloud.w * 0.2, cloud.y + cloud.h * 0.04, cloud.w * 0.27, cloud.h * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    const horizon = ctx.createLinearGradient(0, height * 0.6, 0, height);
    horizon.addColorStop(0, "rgba(143, 198, 134, 0)");
    horizon.addColorStop(1, "rgba(127, 185, 109, 0.42)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, height * 0.6, width, height * 0.4);
  } else {
    const base = ctx.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, "rgba(14, 26, 62, 1)");
    base.addColorStop(0.48, "rgba(24, 45, 95, 1)");
    base.addColorStop(1, "rgba(16, 31, 74, 1)");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    const glowA = ctx.createRadialGradient(width * 0.2, height * 0.22, 0, width * 0.2, height * 0.22, width * 0.6);
    glowA.addColorStop(0, "rgba(133, 131, 235, 0.24)");
    glowA.addColorStop(1, "rgba(133, 131, 235, 0)");
    ctx.fillStyle = glowA;
    ctx.fillRect(0, 0, width, height);

    const glowB = ctx.createRadialGradient(width * 0.78, height * 0.66, 0, width * 0.78, height * 0.66, width * 0.52);
    glowB.addColorStop(0, "rgba(109, 182, 255, 0.17)");
    glowB.addColorStop(1, "rgba(109, 182, 255, 0)");
    ctx.fillStyle = glowB;
    ctx.fillRect(0, 0, width, height);

    stars.forEach((star) => {
      const twinkle = reducedMotion ? 1 : 0.7 + Math.sin(timeSec * 0.9 + star.phase) * 0.3;
      ctx.globalAlpha = star.alpha * twinkle;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(233, 242, 255, 1)";
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const floorGlow = ctx.createLinearGradient(0, height * 0.52, 0, height);
    floorGlow.addColorStop(0, "rgba(196, 172, 255, 0)");
    floorGlow.addColorStop(1, "rgba(196, 172, 255, 0.08)");
    ctx.fillStyle = floorGlow;
    ctx.fillRect(0, height * 0.52, width, height * 0.48);
  }

  ctx.restore();
}

const SCENES = [
  { draw: drawSceneOrbitalTrading, theme: "space" },
  { draw: drawSceneLunarRelay, theme: "space" },
  { draw: drawSceneGroundToDrone, theme: "day" }
];

function drawSceneLayer(ctx, scene, width, height, timeSec, reducedMotion, transform) {
  const {
    alpha = 1,
    shiftX = 0,
    shiftY = 0,
    scale = 1,
    skew = 0
  } = transform;

  const anchorY = height * 0.55;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(width * 0.5 + shiftX, anchorY + shiftY);
  if (!reducedMotion && skew !== 0) {
    ctx.transform(1, 0, skew, 1, 0, 0);
  }
  ctx.scale(scale, scale);
  ctx.translate(-width * 0.5, -anchorY);
  scene(ctx, width, height, timeSec, reducedMotion);
  ctx.restore();
}

function renderShowcaseFrame(ctx, width, height, elapsedMs, reducedMotion, stars) {
  const timeSec = elapsedMs * 0.001;

  const segmentMs = HOLD_MS + TRANSITION_MS;
  const cycleMs = segmentMs * SCENES.length;
  const cyclePos = ((elapsedMs % cycleMs) + cycleMs) % cycleMs;
  const sceneIndex = Math.floor(cyclePos / segmentMs);
  const scenePos = cyclePos - sceneIndex * segmentMs;
  const currentScene = SCENES[sceneIndex];
  const nextScene = SCENES[(sceneIndex + 1) % SCENES.length];

  if (scenePos <= HOLD_MS) {
    drawBackdrop(ctx, width, height, timeSec, stars, reducedMotion, currentScene.theme);
    drawSceneLayer(ctx, currentScene.draw, width, height, timeSec, reducedMotion, {});
    return;
  }

  const transition = smoothStep((scenePos - HOLD_MS) / TRANSITION_MS);
  if (reducedMotion) {
    const phase = transition < 0.5 ? currentScene : nextScene;
    drawBackdrop(ctx, width, height, timeSec, stars, true, phase.theme);
    drawSceneLayer(ctx, phase.draw, width, height, timeSec, true, {});
    return;
  }

  if (transition < 0.5) {
    const outT = smoothStep(transition / 0.5);
    drawBackdrop(ctx, width, height, timeSec, stars, false, currentScene.theme);
    drawSceneLayer(ctx, currentScene.draw, width, height, timeSec, false, {
      alpha: 1 - outT * 0.95,
      shiftX: -width * 0.28 * outT,
      scale: 1 - outT * 0.06
    });
    return;
  }

  const inT = smoothStep((transition - 0.5) / 0.5);
  drawBackdrop(ctx, width, height, timeSec, stars, false, nextScene.theme);
  drawSceneLayer(ctx, nextScene.draw, width, height, timeSec, false, {
    alpha: 0.05 + inT * 0.95,
    shiftX: width * 0.28 * (1 - inT),
    scale: 0.94 + inT * 0.06
  });
}

export function initHeroPreview5Showcase(containerEl, { reducedMotion = false } = {}) {
  if (!(containerEl instanceof HTMLElement)) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "hero-preview5-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const controls = document.createElement("div");
  controls.className = "hero-visual-controls";
  controls.setAttribute("role", "tablist");
  controls.setAttribute("aria-label", "Animation scenes");
  controls.style.cssText =
    "position:absolute;right:0.85rem;bottom:0.85rem;display:inline-flex;align-items:center;gap:0.3rem;padding:0;margin:0;background:transparent;border:0;box-shadow:none;backdrop-filter:none;";
  controls.innerHTML = `
    ${SCENES.map(
      (_, idx) =>
        `<button type="button" class="hero-visual-dot" data-scene="${idx}" role="tab" aria-label="Show animation ${idx + 1}" aria-selected="false"></button>`
    ).join("")}
  `;

  containerEl.replaceChildren(canvas, controls);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  let width = 1;
  let height = 1;
  let rafId = 0;
  let stars = [];
  let disposed = false;
  let dpr = 1;
  let lastNow = 0;
  let sceneIndex = 0;
  let scenePhaseMs = 0;
  const segmentMs = HOLD_MS + TRANSITION_MS;
  const dotButtons = Array.from(controls.querySelectorAll(".hero-visual-dot"));

  function updateControls() {
    dotButtons.forEach((button, idx) => {
      const active = idx === sceneIndex;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function setScene(index) {
    sceneIndex = (index + SCENES.length) % SCENES.length;
    scenePhaseMs = 0;
    updateControls();
  }

  controls.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const sceneAttr = target.getAttribute("data-scene");
    if (sceneAttr) {
      const next = Number(sceneAttr);
      if (Number.isFinite(next)) {
        setScene(next);
      }
    }
  });
  updateControls();

  function resize(force = false) {
    const nextWidth = Math.max(1, Math.round(containerEl.clientWidth || 0));
    const nextHeight = Math.max(1, Math.round(containerEl.clientHeight || 0));
    const nextDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const widthChanged = nextWidth !== width || nextHeight !== height;
    const dprChanged = nextDpr !== dpr;

    if (!force && !widthChanged && !dprChanged) {
      return;
    }

    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = buildStars(width, height);
  }

  const resizeObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(() => {
          resize();
        })
      : null;

  if (resizeObserver) {
    resizeObserver.observe(containerEl);
  }
  const onWindowResize = () => {
    resize(true);
  };
  window.addEventListener("resize", onWindowResize, { passive: true });
  resize(true);

  function loop(now) {
    if (disposed) {
      return;
    }
    if (!lastNow) {
      lastNow = now;
    }
    const dt = Math.min(80, Math.max(0, now - lastNow));
    lastNow = now;
    scenePhaseMs += dt;
    if (scenePhaseMs >= segmentMs) {
      scenePhaseMs -= segmentMs;
      sceneIndex = (sceneIndex + 1) % SCENES.length;
      updateControls();
    }

    resize();
    const currentScene = SCENES[sceneIndex];
    const nextScene = SCENES[(sceneIndex + 1) % SCENES.length];
    const timeSec = now * 0.001;

    if (scenePhaseMs <= HOLD_MS) {
      drawBackdrop(ctx, width, height, timeSec, stars, reducedMotion, currentScene.theme);
      drawSceneLayer(ctx, currentScene.draw, width, height, timeSec, reducedMotion, {});
    } else {
      const transition = smoothStep((scenePhaseMs - HOLD_MS) / TRANSITION_MS);
      if (reducedMotion) {
        const phase = transition < 0.5 ? currentScene : nextScene;
        drawBackdrop(ctx, width, height, timeSec, stars, true, phase.theme);
        drawSceneLayer(ctx, phase.draw, width, height, timeSec, true, {});
      } else if (transition < 0.5) {
        const outT = smoothStep(transition / 0.5);
        drawBackdrop(ctx, width, height, timeSec, stars, false, currentScene.theme);
        drawSceneLayer(ctx, currentScene.draw, width, height, timeSec, false, {
          alpha: 1 - outT * 0.95,
          shiftX: -width * 0.28 * outT,
          scale: 1 - outT * 0.06
        });
      } else {
        const inT = smoothStep((transition - 0.5) / 0.5);
        drawBackdrop(ctx, width, height, timeSec, stars, false, nextScene.theme);
        drawSceneLayer(ctx, nextScene.draw, width, height, timeSec, false, {
          alpha: 0.05 + inT * 0.95,
          shiftX: width * 0.28 * (1 - inT),
          scale: 0.94 + inT * 0.06
        });
      }
    }

    rafId = window.requestAnimationFrame(loop);
  }

  rafId = window.requestAnimationFrame(loop);

  return {
    dispose() {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onWindowResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      containerEl.replaceChildren();
    }
  };
}
