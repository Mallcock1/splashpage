export function initHeroPreview2Playground(
  canvas,
  { reducedMotion = false, enableModeSwitch = false, onFirstInteraction = null } = {}
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  const interactionEl = canvas.closest("#hero") || canvas;

  const pointer = {
    x: window.innerWidth * 0.6,
    y: window.innerHeight * 0.45,
    tx: window.innerWidth * 0.6,
    ty: window.innerHeight * 0.45
  };
  const TOTAL_ENERGY = 1;

  let width = 0;
  let height = 0;
  let rafId = 0;
  let mode = 0; // 0: transmit, 1: receive
  let burst = 0;
  let pointerEnergy = 0.35;
  let orbiterEnergy = TOTAL_ENERGY - pointerEnergy;
  let lastTimestamp = 0;
  let hasInteracted = false;
  let packetSpawnCarry = 0;
  const beamPackets = [];

  function setCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function onPointerMove(event) {
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
  }

  function onClick() {
    if (!enableModeSwitch) {
      return;
    }
    if (!hasInteracted) {
      hasInteracted = true;
      if (typeof onFirstInteraction === "function") {
        onFirstInteraction();
      }
    }
    mode = mode === 0 ? 1 : 0;
    burst = 1;
  }

  function drawBackdrop(time) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (!enableModeSwitch || mode === 0) {
      gradient.addColorStop(0, "#0a1c45");
      gradient.addColorStop(0.45, "#1f56ab");
      gradient.addColorStop(1, "#11306e");
    } else {
      gradient.addColorStop(0, "#321554");
      gradient.addColorStop(0.5, "#6b3cb0");
      gradient.addColorStop(1, "#2a4ea0");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const aura = ctx.createRadialGradient(pointer.x, pointer.y, 10, pointer.x, pointer.y, Math.max(width, height) * 0.45);
    aura.addColorStop(0, !enableModeSwitch || mode === 0 ? "rgba(132, 210, 255, 0.45)" : "rgba(206, 149, 255, 0.45)");
    aura.addColorStop(1, "rgba(10, 18, 44, 0)");
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(240, 247, 255, 0.08)";
    for (let i = 0; i < 50; i += 1) {
      const x = ((i * 87 + time * 20) % (width + 120)) - 60;
      const y = (i * 53) % height;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  function drawFlowLines(time) {
    const lines = reducedMotion ? 14 : 22;
    const amplitude = height * 0.038;
    const freq = (Math.PI * 2) / Math.max(width, 1);

    for (let i = 0; i < lines; i += 1) {
      const p = i / Math.max(lines - 1, 1);
      const baseY = height * (0.12 + p * 0.76);
      const speed = 0.35 + p * 0.65;
      const phase = p * 4.8 + time * speed;

      ctx.beginPath();
      for (let x = -30; x <= width + 30; x += 12) {
        const pull = Math.exp(-Math.pow((x - pointer.x) / (width * 0.22), 2));
        const wave = Math.sin(x * freq * (1.5 + p * 1.8) + phase);
        const twist = Math.cos(x * freq * 0.85 - phase * 0.6);
        const shift = pull * (pointer.y - baseY) * (0.22 + p * 0.3);
        const y = baseY + wave * amplitude + twist * amplitude * 0.55 + shift;
        if (x === -30) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      const alpha = 0.26 + p * 0.45;
      const hue = !enableModeSwitch || mode === 0 ? 204 + p * 20 : 260 + p * 18;
      ctx.strokeStyle = `hsla(${hue}, 88%, ${64 - p * 10}%, ${alpha})`;
      ctx.lineWidth = 1.4 + p * 1.1;
      ctx.stroke();
    }
  }

  function drawLens() {
    const ringPulse = enableModeSwitch ? 1 + burst * 0.16 : 1;
    const r = Math.min(width, height) * 0.1 * ringPulse;

    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = !enableModeSwitch || mode === 0 ? "rgba(172, 218, 255, 0.7)" : "rgba(217, 171, 255, 0.72)";
    ctx.lineWidth = 1.9;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, r * 0.46, 0, Math.PI * 2);
    ctx.fillStyle = !enableModeSwitch || mode === 0 ? "rgba(129, 202, 255, 0.24)" : "rgba(207, 148, 255, 0.24)";
    ctx.fill();
  }

  function drawTransceiveLayer(time, deltaSeconds) {
    if (!enableModeSwitch) {
      return;
    }

    const marginX = width * 0.08;
    const marginY = height * 0.16;
    const orbitX = marginX + ((Math.sin(time * 0.58) + 1) * 0.5) * (width - marginX * 2);
    const orbitY = marginY + ((Math.sin(time * 0.93 + 0.9) + 1) * 0.5) * (height - marginY * 2);
    const orbiter = { x: orbitX, y: orbitY };
    const source = mode === 0 ? orbiter : pointer;
    const target = mode === 0 ? pointer : orbiter;
    const transferPerSecond = 0.18;
    const flowAmount = transferPerSecond * deltaSeconds;
    const sourceEnergy = mode === 0 ? orbiterEnergy : pointerEnergy;
    const targetEnergy = mode === 0 ? pointerEnergy : orbiterEnergy;
    const transferable = Math.min(flowAmount, sourceEnergy, 1 - targetEnergy);
    const isTransmitting = transferable > 0.0001;

    if (mode === 0 && isTransmitting) {
      orbiterEnergy = Math.max(0, orbiterEnergy - transferable);
      pointerEnergy = Math.min(1, pointerEnergy + transferable);
    } else if (mode === 1 && isTransmitting) {
      pointerEnergy = Math.max(0, pointerEnergy - transferable);
      orbiterEnergy = Math.min(1, orbiterEnergy + transferable);
    }

    // Keep total system energy fixed at 100%.
    const total = pointerEnergy + orbiterEnergy;
    if (Math.abs(total - TOTAL_ENERGY) > 0.000001) {
      orbiterEnergy = Math.max(0, Math.min(1, TOTAL_ENERGY - pointerEnergy));
    }

    const packetSpawnRate = reducedMotion ? 4.5 : 8;
    if (isTransmitting) {
      packetSpawnCarry += packetSpawnRate * deltaSeconds;
      while (packetSpawnCarry >= 1) {
        beamPackets.push({
          progress: 0,
          speed: 0.65 + Math.random() * 0.2,
          offset: (Math.random() - 0.5) * 9,
          phase: Math.random() * Math.PI * 2,
          directionMode: mode
        });
        packetSpawnCarry -= 1;
      }
    }

    for (let i = beamPackets.length - 1; i >= 0; i -= 1) {
      const packet = beamPackets[i];
      packet.progress += packet.speed * deltaSeconds;
      if (packet.progress >= 1) {
        beamPackets.splice(i, 1);
      }
    }

    // Link remains visible even when no transfer is occurring.
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = isTransmitting
      ? mode === 0
        ? "rgba(141, 203, 255, 0.45)"
        : "rgba(201, 155, 255, 0.45)"
      : "rgba(187, 200, 236, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const activeColor = mode === 0 ? "rgba(173, 221, 255, 0.92)" : "rgba(224, 191, 255, 0.92)";
    beamPackets.forEach((packet) => {
      const packetSource = packet.directionMode === 0 ? orbiter : pointer;
      const packetTarget = packet.directionMode === 0 ? pointer : orbiter;
      const t = Math.max(0, Math.min(1, packet.progress));
      const x = packetSource.x + (packetTarget.x - packetSource.x) * t;
      const y =
        packetSource.y +
        (packetTarget.y - packetSource.y) * t +
        Math.sin(t * Math.PI * 2 + packet.phase + time * 4.2) * 5 +
        packet.offset * 0.06;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = activeColor;
      ctx.fill();
    });

    const sourceIsOrbiter = mode === 0;
    drawNode(orbiter.x, orbiter.y, sourceIsOrbiter);
    drawNode(pointer.x, pointer.y, !sourceIsOrbiter);

    drawEnergyBar(orbiter.x, orbiter.y + 26, orbiterEnergy);
    drawEnergyBar(pointer.x, pointer.y + 24, pointerEnergy);
  }

  function drawNode(x, y, isSource) {
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fillStyle = isSource ? "rgba(203, 228, 255, 0.28)" : "rgba(220, 229, 255, 0.14)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 17, 0, Math.PI * 2);
    ctx.strokeStyle = isSource ? "rgba(207, 230, 255, 0.84)" : "rgba(204, 215, 245, 0.5)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  function drawEnergyBar(x, y, value) {
    const barWidth = 92;
    const barHeight = 7;
    const left = Math.max(8, Math.min(width - barWidth - 8, x - barWidth / 2));
    let color = "rgba(237, 139, 111, 0.78)";
    if (value >= 0.66) {
      color = "rgba(143, 215, 162, 0.78)";
    } else if (value >= 0.33) {
      color = "rgba(236, 181, 117, 0.78)";
    }

    ctx.fillStyle = "rgba(8, 16, 36, 0.62)";
    ctx.fillRect(left, y, barWidth, barHeight);

    ctx.fillStyle = color;
    ctx.fillRect(left, y, barWidth * Math.max(0, Math.min(1, value)), barHeight);

    ctx.strokeStyle = "rgba(214, 228, 255, 0.72)";
    ctx.lineWidth = 1;
    ctx.strokeRect(left, y, barWidth, barHeight);
  }

  function draw(timeSec, deltaSeconds) {
    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;
    burst *= 0.92;

    drawBackdrop(timeSec);
    drawFlowLines(timeSec);
    if (!enableModeSwitch) {
      drawLens();
    }
    drawTransceiveLayer(timeSec, deltaSeconds);
  }

  function loop(timestamp) {
    const timeSec = timestamp * 0.001;
    const rawDelta = lastTimestamp ? (timestamp - lastTimestamp) * 0.001 : 1 / 60;
    const deltaSeconds = Math.min(0.05, Math.max(0.001, rawDelta));
    lastTimestamp = timestamp;
    draw(timeSec, deltaSeconds);
    rafId = window.requestAnimationFrame(loop);
  }

  setCanvasSize();
  window.addEventListener("resize", setCanvasSize);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  if (enableModeSwitch) {
    interactionEl.addEventListener("click", onClick, { passive: true });
  }
  rafId = window.requestAnimationFrame(loop);

  return {
    dispose() {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", setCanvasSize);
      window.removeEventListener("pointermove", onPointerMove);
      if (enableModeSwitch) {
        interactionEl.removeEventListener("click", onClick);
      }
    }
  };
}
