import capabilities from "../../data/capabilities.json";
import segments from "../../data/segments.json";

function renderSegmentButton(segment, isActive) {
  return `
    <button class="segment-chip${isActive ? " is-active" : ""}" type="button" data-segment="${segment.id}">
      ${segment.label}
    </button>
  `;
}

function renderCapabilityCard(item) {
  const segmentBadges = item.segments
    .map((segmentId) => segments.find((s) => s.id === segmentId))
    .filter(Boolean)
    .map((segment) => `<span class="capability-badge">${segment.label}</span>`)
    .join("");

  return `
    <article class="capability-card" data-capability-id="${item.id}">
      <h4>${item.title}</h4>
      <p>${item.description}</p>
      <p class="capability-impact">${item.impact}</p>
      <div class="capability-badges">${segmentBadges}</div>
    </article>
  `;
}

export function initCapabilitiesUnlocked() {
  const filtersEl = document.getElementById("capabilities-filters");
  const gridEl = document.getElementById("capabilities-grid");
  if (!filtersEl || !gridEl) {
    return;
  }

  let activeSegment = "all";

  function render() {
    filtersEl.innerHTML = segments.map((segment) => renderSegmentButton(segment, segment.id === activeSegment)).join("");

    const visible =
      activeSegment === "all"
        ? capabilities
        : capabilities.filter((item) => item.segments.includes(activeSegment));

    gridEl.innerHTML = visible.map((item) => renderCapabilityCard(item)).join("");

    filtersEl.querySelectorAll("[data-segment]").forEach((button) => {
      button.addEventListener("click", () => {
        activeSegment = button.getAttribute("data-segment") || "all";
        render();
      });
    });
  }

  render();
}
