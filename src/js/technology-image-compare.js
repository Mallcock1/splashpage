export function initTechnologyImageCompare() {
  const slider = document.getElementById("technology-image-slider");
  const overlay = document.getElementById("technology-image-overlay");
  const divider = document.getElementById("technology-image-divider");

  if (!slider || !overlay || !divider) {
    return;
  }

  function update(value) {
    const percent = Math.max(0, Math.min(100, Number(value)));
    const rightInset = 100 - percent;
    overlay.style.clipPath = `inset(0 ${rightInset}% 0 0)`;
    overlay.style.webkitClipPath = `inset(0 ${rightInset}% 0 0)`;
    divider.style.left = `${percent}%`;
  }

  slider.addEventListener("input", (event) => {
    update(event.target.value);
  });

  update(slider.value);
}
