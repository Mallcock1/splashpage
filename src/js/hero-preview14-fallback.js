function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildPreview1Nodes(count) {
  const nodes = [];
  for (let i = 0; i < count; i += 1) {
    nodes.push({
      radius: 0.24 + Math.random() * 0.78,
      angle: Math.random() * Math.PI * 2,
      speed: 0.06 + Math.random() * 0.18,
      lift: (Math.random() - 0.5) * 0.22,
      size: 0.9 + Math.random() * 2.1
    });
  }
  return nodes;
}

function buildPreview4Bodies() {
  const bodies = [];
  for (let i = 0; i < 14; i += 1) {
    bodies.push({
      angle: (Math.PI * 2 * i) / 14,
      radius: 120 + (i % 5) * 34,
      drift: 0.16 + i * 0.012,
      bob: 12 + (i % 4) * 10,
      size: 9 + (i % 3) * 5
    });
  }
  return bodies;
}

function drawPreview1(ctx, t, width, height, reducedMotion, nodes, pointer) {
  const cx = width * 0.63 + pointer.x * width * 0.035;
  const cy = height * 0.5 + pointer.y * height * 0.03;
  const scale = Math.min(width, height) * 1.18;
  const rotBase = reducedMotion ? 0 : t * 0.00013;

  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 0; i < 6; i += 1) {
    ctx.save();
    ctx.rotate(rotBase * (0.55 + i * 0.22) + i * 0.64 + pointer.x * 0.06);
    ctx.strokeStyle = i % 2 === 0 ? "rgba(176,198,255,0.64)" : "rgba(132,156,214,0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, scale * (0.185 + i * 0.032), scale * (0.085 + i * 0.018), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = "rgba(192,214,255,0.86)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(0, 0, scale * 0.09, scale * 0.055, rotBase * 4.2 + pointer.x * 0.08, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(230,239,255,0.82)";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, scale * 0.051, scale * 0.033, -rotBase * 3.4 - pointer.y * 0.08, 0, Math.PI * 2);
  ctx.stroke();

  const flicker = 0.82 + Math.sin(t * 0.0019) * 0.12;
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    const angle = node.angle + t * 0.00032 * node.speed;
    const r = scale * node.radius * 0.54;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle * 1.15) * r * 0.55 + node.lift * scale * 0.08;
    ctx.fillStyle = `rgba(236,244,255,${flicker})`;
    ctx.beginPath();
    ctx.arc(x, y, node.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(214,228,255,0.92)";
  ctx.beginPath();
  ctx.arc(0, 0, scale * 0.016, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPreview4(ctx, t, width, height, reducedMotion, bodies, pointer) {
  const ox = width * 0.63 + pointer.x * width * 0.045;
  const oy = height * 0.47 + pointer.y * height * 0.03;
  const horizonY = height * 0.36;
  const floorY = height * 0.92;

  for (let i = -10; i <= 10; i += 1) {
    const x0 = ox + i * 34;
    const x1 = ox + i * 162;
    ctx.strokeStyle = "rgba(132,156,214,0.38)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, horizonY);
    ctx.lineTo(x1, floorY);
    ctx.stroke();
  }

  for (let i = 0; i < 9; i += 1) {
    const k = i / 7;
    const y = horizonY + (floorY - horizonY) * (k * k);
    const span = 220 + k * 560;
    ctx.strokeStyle = "rgba(108,132,199,0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox - span, y);
    ctx.lineTo(ox + span, y);
    ctx.stroke();
  }

  for (let i = 0; i < bodies.length; i += 1) {
    const body = bodies[i];
    const angle = body.angle + (reducedMotion ? 0 : t * 0.00035 * body.drift);
    const x = ox + Math.cos(angle) * body.radius;
    const y = oy + Math.sin(angle * 1.15) * body.bob;
    const z = (Math.sin(angle - 0.8) + 1) * 0.5;
    const size = body.size * (0.72 + z * 0.55);
    const alpha = 0.45 + z * 0.5;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * 0.8 + pointer.x * 0.22);
    ctx.fillStyle = i % 2 === 0 ? `rgba(182,173,255,${alpha})` : `rgba(160,206,255,${alpha})`;
    ctx.fillRect(-size * 0.5, -size * 0.5, size, size);
    ctx.restore();
  }
}

export function initHeroPreview14Fallback(canvas, { variant = "preview-1", reducedMotion = false } = {}) {
  if (!canvas) {
    return null;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
  const preview1Nodes = buildPreview1Nodes(reducedMotion ? 140 : 220);
  const preview4Bodies = buildPreview4Bodies();
  const pointerTarget = { x: 0, y: 0 };
  const pointer = { x: 0, y: 0 };
  let rafId = 0;
  let width = 0;
  let height = 0;

  function resize() {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(now) {
    ctx.clearRect(0, 0, width, height);

    pointer.x += (pointerTarget.x - pointer.x) * 0.08;
    pointer.y += (pointerTarget.y - pointer.y) * 0.08;

    if (variant === "preview-4") {
      drawPreview4(ctx, now, width, height, reducedMotion, preview4Bodies, pointer);
    } else {
      drawPreview1(ctx, now, width, height, reducedMotion, preview1Nodes, pointer);
    }
    rafId = window.requestAnimationFrame(frame);
  }

  function onPointerMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / Math.max(rect.width, 1);
    const y = (event.clientY - rect.top) / Math.max(rect.height, 1);
    pointerTarget.x = clamp((x - 0.5) * 2, -1, 1);
    pointerTarget.y = clamp((y - 0.5) * 2, -1, 1);
  }

  function onPointerLeave() {
    pointerTarget.x = 0;
    pointerTarget.y = 0;
  }

  window.addEventListener("resize", resize, { passive: true });
  canvas.addEventListener("pointermove", onPointerMove, { passive: true });
  canvas.addEventListener("pointerleave", onPointerLeave, { passive: true });
  resize();
  frame(0);

  return {
    dispose() {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    }
  };
}
