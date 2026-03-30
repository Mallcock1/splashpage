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
import { initHeroPreview5Showcase } from "./hero-preview5-showcase";
import { initTechnologyImageCompare } from "./technology-image-compare";

const NEWSLETTER_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwp6yVhEvSS5paW-viO8SgCOGNKb2QHhi27FByRXu7LCUHovFD1-ND59oTq7-cRG76EbA/exec";

const HERO_PREVIEW_VARIANT = "preview-5";

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

function applyPreviewVariantPresentation() {
  document.body.classList.add(`variant-${HERO_PREVIEW_VARIANT}`);
}

function renderRoadmap() {
  const list = document.getElementById("roadmap-list");
  if (!list) {
    return;
  }

  roadmap.forEach((item) => {
    const timelineLabel = item.quarter ? `${item.quarter} ${item.year}` : String(item.year);
    const statusClass = item.status
      ? ` status-pill-${item.status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
      : "";
    const statusMarkup = item.status ? `<p class="status-pill${statusClass}">${item.status}</p>` : "";
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

  const normalizeHighlight = (item) => {
    if (typeof item !== "string") {
      return item;
    }
    if (/^RF engineering\.?$/i.test(item.trim())) {
      return "PhD in RF engineering.";
    }
    return item;
  };

  team.forEach((person) => {
    const links = person.links
      .map((link) => `<a class="text-link" href="${link.url}">${link.label}</a>`)
      .join("");
    const highlights = (person.highlights || [])
      .map((item) => `<li>${normalizeHighlight(item)}</li>`)
      .join("");

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img class="team-photo" src="${person.photoPath}" alt="${person.name}" loading="lazy" onerror="this.src='./assets/images/team/cofounder-placeholder.svg'" />
      <div class="team-content">
        <h3 class="person-name">${person.name}</h3>
        ${person.role ? `<p class="person-role">${person.role}</p>` : ""}
        ${highlights ? `<ul class="person-highlights">${highlights}</ul>` : ""}
        ${links ? `<p class="person-links">${links}</p>` : ""}
      </div>
    `;
    grid.append(card);
  });
}

function initHeroVisual() {
  const heroVisualSlot = document.getElementById("hero-visual-slot");
  const fallback = document.getElementById("hero-fallback");
  const controller = initHeroPreview5Showcase(heroVisualSlot, {
    reducedMotion: false
  });
  if (!controller && fallback) {
    fallback.hidden = false;
  }
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

function bindHeroLearnMore() {
  const hero = document.getElementById("hero");
  const button = document.querySelector("#hero .hero-actions .button");
  if (!hero || !button) {
    return;
  }

  const nextSection = hero.nextElementSibling;
  if (!(nextSection instanceof HTMLElement) || !nextSection.id) {
    return;
  }

  button.setAttribute("href", `#${nextSection.id}`);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function initMobileNav() {
  const header = document.getElementById("site-header");
  const toggle = header?.querySelector(".nav-toggle");
  const menu = header?.querySelector("#site-nav-menu");
  if (!header || !(toggle instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) {
    return;
  }

  const mobileQuery = window.matchMedia("(max-width: 1050px)");

  const setOpen = (open) => {
    const isOpen = Boolean(open) && mobileQuery.matches;
    header.classList.toggle("is-menu-open", isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    menu.setAttribute("aria-hidden", isOpen ? "false" : "true");
  };

  const closeMenu = () => {
    setOpen(false);
  };

  const syncLayout = () => {
    if (mobileQuery.matches) {
      const isOpen = header.classList.contains("is-menu-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      menu.setAttribute("aria-hidden", isOpen ? "false" : "true");
      return;
    }
    header.classList.remove("is-menu-open");
    toggle.setAttribute("aria-expanded", "false");
    menu.removeAttribute("aria-hidden");
  };

  toggle.addEventListener("click", () => {
    setOpen(!header.classList.contains("is-menu-open"));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  document.addEventListener("click", (event) => {
    if (!mobileQuery.matches || !header.classList.contains("is-menu-open")) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (!header.contains(target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", syncLayout, { passive: true });
  syncLayout();
}

function initHeroIntroEntrance() {
  if (HERO_PREVIEW_VARIANT === "preview-5") {
    return;
  }

  const heroContent = document.querySelector("#hero .hero-content");
  if (!heroContent) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    return;
  }

  const sequence = [
    heroContent.querySelector(".hero-brand"),
    heroContent.querySelector("h1"),
    heroContent.querySelector(".lead"),
    heroContent.querySelector(".hero-actions")
  ].filter(Boolean);

  sequence.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
  });

  window.requestAnimationFrame(() => {
    sequence.forEach((el, idx) => {
      const animation = el.animate(
        [
          { opacity: 0, transform: "translateY(20px)" },
          { opacity: 1, transform: "translateY(0)" }
        ],
        {
          duration: 1250,
          delay: 900 + idx * 180,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards"
        }
      );
      animation.addEventListener("finish", () => {
        el.style.removeProperty("opacity");
        el.style.removeProperty("transform");
      });
    });
  });
}

function initApp() {
  hydrateCopy();
  applyPreviewVariantPresentation();
  renderTechnology();
  initTechnologyImageCompare();
  renderRoadmap();
  renderSupporters();
  renderTeam();
  initCapabilitiesUnlocked();

  const year = document.getElementById("year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  initStickyNav({ heroSelector: "#hero", navSelector: "#site-header" });
  initMobileNav();
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
  bindHeroLearnMore();
  initHeroIntroEntrance();

  const newsletterForm = document.getElementById("signup-form");
  bindEmailCaptureForm(newsletterForm, NEWSLETTER_SCRIPT_URL);
}

initApp();
