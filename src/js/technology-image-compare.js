export function initTechnologyImageCompare() {
  const compare = document.getElementById("technology-image-compare");
  const slider = document.getElementById("technology-image-slider");
  const overlay = document.getElementById("technology-image-overlay");
  const divider = document.getElementById("technology-image-divider");

  if (!compare || !slider || !overlay || !divider) {
    return;
  }

  function update(value) {
    const percent = Math.max(0, Math.min(100, Number(value)));
    const rightInset = 100 - percent;
    overlay.style.clipPath = `inset(0 ${rightInset}% 0 0)`;
    overlay.style.webkitClipPath = `inset(0 ${rightInset}% 0 0)`;
    divider.style.left = `${percent}%`;
  }

  let wobbleRaf = 0;
  let wobbleCancelled = false;

  function cancelWobble() {
    wobbleCancelled = true;
    if (wobbleRaf) {
      window.cancelAnimationFrame(wobbleRaf);
      wobbleRaf = 0;
    }
  }

  function runSliderWobble() {
    const base = Math.max(0, Math.min(100, Number(slider.value)));
    const amplitude = Math.min(8, Math.max(4, Math.min(base, 100 - base)));
    const durationMs = 1150;
    const keyframes = [
      { t: 0, o: 0 },
      { t: 0.18, o: -1 },
      { t: 0.36, o: 0.85 },
      { t: 0.54, o: -0.6 },
      { t: 0.72, o: 0.35 },
      { t: 1, o: 0 }
    ];

    const start = performance.now();

    function sample(progress) {
      for (let i = 1; i < keyframes.length; i += 1) {
        const a = keyframes[i - 1];
        const b = keyframes[i];
        if (progress <= b.t) {
          const span = Math.max(0.0001, b.t - a.t);
          const local = (progress - a.t) / span;
          return a.o + (b.o - a.o) * local;
        }
      }
      return 0;
    }

    function frame(now) {
      if (wobbleCancelled) {
        update(slider.value);
        return;
      }
      const p = Math.min(1, (now - start) / durationMs);
      const offset = sample(p) * amplitude;
      const value = Math.max(0, Math.min(100, base + offset));
      slider.value = String(value);
      update(value);
      if (p < 1) {
        wobbleRaf = window.requestAnimationFrame(frame);
      } else {
        slider.value = String(base);
        update(base);
        wobbleRaf = 0;
      }
    }

    wobbleRaf = window.requestAnimationFrame(frame);
  }

  slider.addEventListener("pointerdown", cancelWobble, { passive: true });
  slider.addEventListener("input", (event) => {
    wobbleCancelled = true;
    update(event.target.value);
  });

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let hinted = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (hinted) {
          return;
        }
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            hinted = true;
            wobbleCancelled = false;
            runSliderWobble();
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.35,
        rootMargin: "0px 0px -8% 0px"
      }
    );
    observer.observe(compare);
  }

  update(slider.value);
}
