import "../styles/base.css";

import content from "../data/content.json";
import roadmap from "../data/roadmap.json";
import supporters from "../data/supporters.json";
import team from "../data/team.json";

import { bindEmailCaptureForm } from "./form-email-capture";
import { initCapabilitiesUnlocked } from "./capabilities/capabilities-unlocked";
import { initStickyNav } from "./nav-sticky";
import { initScrollReveal } from "./scroll-reveal";
import { initSectionObserver } from "./scroll-progress";
import { createHeroScrollSync } from "./three/hero-scroll-sync";
import { initHeroScene } from "./three/hero-scene";
import { detectRenderTier, supportsWebGL } from "./three/loaders";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwp6yVhEvSS5paW-viO8SgCOGNKb2QHhi27FByRXu7LCUHovFD1-ND59oTq7-cRG76EbA/exec";

function getByPath(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function hydrateCopy() {
  document.querySelectorAll("[data-copy]").forEach((element) => {
    const value = getByPath(content, element.dataset.copy || "");
    if (typeof value === "string") {
      element.textContent = value;
    }
  });

  const titleText = `NEOWATT | ${content.meta.tagline}`;
  document.title = titleText;

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute("content", titleText);
  }
}

function renderTechnology() {
  const stepsEl = document.getElementById("technology-flow-steps");
  const diagramEl = document.getElementById("technology-flow-diagram");
  const copyEl = document.getElementById("technology-flow-copy");
  const flow = content.technology.flow || [];

  if (!stepsEl || !diagramEl || !copyEl || !flow.length) {
    return;
  }

  function renderActive(activeId) {
    stepsEl.innerHTML = flow
      .map(
        (step) =>
          `<button class="tech-step${step.id === activeId ? " is-active" : ""}" type="button" data-step-id="${step.id}">${step.label}</button>`
      )
      .join("");

    diagramEl.innerHTML = flow
      .map((step, idx) => {
        const isActive = step.id === activeId;
        const connector = idx < flow.length - 1 ? `<span class="tech-connector" aria-hidden="true"></span>` : "";
        return `
          <div class="tech-node-wrap">
            <article class="tech-node${isActive ? " is-active" : ""}">
              <h3>${step.label}</h3>
              <p>${step.infra}</p>
            </article>
            ${connector}
          </div>
        `;
      })
      .join("");

    const active = flow.find((step) => step.id === activeId);
    copyEl.textContent = active ? active.copy : "";

    stepsEl.querySelectorAll("[data-step-id]").forEach((button) => {
      button.addEventListener("click", () => {
        renderActive(button.getAttribute("data-step-id") || flow[0].id);
      });
    });
  }

  renderActive(flow[0].id);
}

function renderRoadmap() {
  const list = document.getElementById("roadmap-list");
  if (!list) {
    return;
  }

  roadmap.forEach((item) => {
    const timelineLabel = item.quarter ? `${item.quarter} ${item.year}` : String(item.year);
    const statusMarkup = item.status ? `<p class="status-pill">${item.status}</p>` : "";
    const descriptionMarkup = item.description ? `<p>${item.description}</p>` : "";

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="timeline-meta">${timelineLabel}</div>
      <div>
        ${statusMarkup}
        <h3>${item.title}</h3>
        ${descriptionMarkup}
      </div>
    `;
    list.append(li);
  });
}

function renderSupporters() {
  const grid = document.getElementById("supporters-grid");
  if (!grid) {
    return;
  }

  supporters.forEach((entry) => {
    const logo = document.createElement(entry.url && entry.url !== "#" ? "a" : "div");
    logo.className = "supporter-logo";
    logo.setAttribute("aria-label", entry.name);
    if (entry.url && entry.url !== "#") {
      logo.href = entry.url;
      logo.target = "_blank";
      logo.rel = "noreferrer";
    }
    logo.innerHTML = `
        <img src="${entry.logoPath}" alt="${entry.name} logo" loading="lazy" />
    `;
    grid.append(logo);
  });
}

function renderTeam() {
  const grid = document.getElementById("team-grid");
  if (!grid) {
    return;
  }

  team.forEach((person) => {
    const links = person.links
      .map((link) => `<a class="text-link" href="${link.url}">${link.label}</a>`)
      .join(" ");
    const highlights = (person.highlights || [])
      .map((item) => `<li>${item}</li>`)
      .join("");

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img class="team-photo" src="${person.photoPath}" alt="${person.name}" loading="lazy" onerror="this.src='/assets/images/team/cofounder-placeholder.svg'" />
      <h3 class="person-name">${person.name}</h3>
      <p class="person-role">${person.role}</p>
      ${highlights ? `<ul class="person-highlights">${highlights}</ul>` : ""}
      ${links ? `<p>${links}</p>` : ""}
    `;
    grid.append(card);
  });
}

function initHeroVisual() {
  const canvas = document.getElementById("hero-canvas");
  const fallback = document.getElementById("hero-fallback");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!canvas || !supportsWebGL()) {
    if (fallback) {
      fallback.hidden = false;
    }
    return;
  }

  const controller = initHeroScene(canvas, {
    tier: detectRenderTier(),
    reducedMotion: prefersReducedMotion
  });

  if (!controller) {
    if (fallback) {
      fallback.hidden = false;
    }
    return;
  }

  createHeroScrollSync("#hero", controller);
}

function initHeroCopyMotion() {
  const hero = document.getElementById("hero");
  const heroContent = hero?.querySelector(".hero-content");
  if (!hero || !heroContent) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    return;
  }

  let rafId = 0;

  const onScroll = () => {
    if (rafId) {
      return;
    }

    rafId = window.requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const total = Math.max(window.innerHeight * 1.2, 1);
      const traveled = Math.max(0, -rect.top);
      const progress = Math.min(traveled / total, 1);

      const shiftPx = progress * -22;
      const fade = 1 - progress * 0.2;
      heroContent.style.setProperty("--hero-copy-shift", `${shiftPx.toFixed(2)}px`);
      heroContent.style.setProperty("--hero-copy-fade", fade.toFixed(3));
      rafId = 0;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
}

function initApp() {
  hydrateCopy();
  renderTechnology();
  renderRoadmap();
  renderSupporters();
  renderTeam();
  initCapabilitiesUnlocked();

  const year = document.getElementById("year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  initStickyNav({ heroSelector: "#hero", navSelector: "#site-header" });
  initSectionObserver([
    "#problem",
    "#vision",
    "#technology",
    "#capabilities",
    "#roadmap",
    "#team",
    "#supporters",
    "#contact"
  ]);

  initScrollReveal();
  initHeroVisual();
  initHeroCopyMotion();

  const form = document.getElementById("signup-form");
  bindEmailCaptureForm(form, SCRIPT_URL);
}

initApp();
