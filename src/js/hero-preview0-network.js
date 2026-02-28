function emailLikeParallax(value, max) {
  return Math.max(-max, Math.min(max, value));
}

export function initHeroPreview0Network(canvas, { reducedMotion = false } = {}) {
  if (!canvas) {
    return null;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  const wrapper = canvas.parentElement;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  const nodeCount = reducedMotion ? 56 : 80;
  const maxLinkDist = 168;
  const cursorLinkDist = 180;
  const cursorLinksMax = 10;
  const speed = reducedMotion ? 1.1 : 2.0;

  const nodes = [];
  const mouse = { x: 0, y: 0, active: false };
  let width = 0;
  let height = 0;
  let rafId = 0;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initNodes() {
    nodes.length = 0;
    for (let i = 0; i < nodeCount; i += 1) {
      nodes.push({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-0.05, 0.05),
        vy: rand(-0.05, 0.05),
        r: rand(1.0, 2.2),
        accent: Math.random() < 0.34
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    if (mouse.active && wrapper && !reducedMotion) {
      const px = emailLikeParallax((mouse.x / Math.max(width, 1) - 0.5) * 6, 6);
      const py = emailLikeParallax((mouse.y / Math.max(height, 1) - 0.5) * 6, 6);
      wrapper.style.transform = `translate3d(${-px}px, ${-py}px, 0)`;
    }

    for (const node of nodes) {
      node.x += node.vx * speed;
      node.y += node.vy * speed;

      if (node.x < -5) node.x = width + 5;
      else if (node.x > width + 5) node.x = -5;
      if (node.y < -5) node.y = height + 5;
      else if (node.y > height + 5) node.y = -5;
    }

    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= maxLinkDist * maxLinkDist) {
          continue;
        }

        const d = Math.sqrt(d2);
        const alpha = 1 - d / maxLinkDist;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineWidth = 1.15;
        ctx.globalAlpha = alpha * 0.58;
        ctx.strokeStyle = "rgba(236, 243, 255, 1)";
        ctx.shadowColor = "rgba(170, 198, 255, 0.38)";
        ctx.shadowBlur = 3;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    if (mouse.active) {
      const nearby = [];
      for (const node of nodes) {
        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < cursorLinkDist * cursorLinkDist) {
          nearby.push({ node, d2 });
        }
      }
      nearby.sort((a, b) => a.d2 - b.d2);

      const k = Math.min(cursorLinksMax, nearby.length);
      for (let i = 0; i < k; i += 1) {
        const { node, d2 } = nearby[i];
        const d = Math.sqrt(d2);
        const alpha = 1 - d / cursorLinkDist;
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(node.x, node.y);
        ctx.lineWidth = 1.35;
        ctx.globalAlpha = Math.min(0.72, 0.2 + alpha * 0.7);
        ctx.strokeStyle = "rgba(226, 238, 255, 1)";
        ctx.shadowColor = "rgba(160, 193, 255, 0.72)";
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    for (const node of nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = node.accent ? "rgba(198, 224, 255, 0.98)" : "rgba(244, 248, 255, 0.96)";
      ctx.shadowColor = node.accent ? "rgba(166, 201, 255, 0.62)" : "rgba(220, 232, 255, 0.42)";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    rafId = window.requestAnimationFrame(draw);
  }

  function onMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.active = true;
  }

  function onLeave() {
    mouse.active = false;
    if (wrapper) {
      wrapper.style.removeProperty("transform");
    }
  }

  function onResize() {
    resize();
    initNodes();
  }

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });
  document.addEventListener("mousemove", onMove, { passive: true });
  canvas.addEventListener("mousemove", onMove, { passive: true });
  canvas.addEventListener("mouseenter", onMove, { passive: true });
  canvas.addEventListener("mouseleave", onLeave, { passive: true });

  resize();
  initNodes();
  draw();

  return {
    dispose() {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      document.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseenter", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      if (wrapper) {
        wrapper.style.removeProperty("transform");
      }
    }
  };
}
