import "../styles/base.css";

import content from "../data/content.json";
import roadmap from "../data/roadmap.json";
import supporters from "../data/supporters.json";
import team from "../data/team.json";

import { bindEmailCaptureForm } from "./form-email-capture";
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

  const titleText = `NeoWatt | ${content.meta.tagline}`;
  document.title = titleText;

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute("content", titleText);
  }
}

function renderTechnology() {
  const grid = document.getElementById("technology-grid");
  if (!grid) {
    return;
  }

  content.technology.features.forEach((feature) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `<h3>${feature.title}</h3><p>${feature.description}</p>`;
    grid.append(card);
  });
}

function renderRoadmap() {
  const list = document.getElementById("roadmap-list");
  if (!list) {
    return;
  }

  roadmap.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="timeline-meta">${item.quarter} ${item.year}</div>
      <div>
        <p class="status-pill">${item.status}</p>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
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
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <p class="status-pill">${entry.tier}</p>
      <h3>${entry.name}</h3>
      <a class="supporter-logo" href="${entry.url}" target="_blank" rel="noreferrer">
        <img src="${entry.logoPath}" alt="${entry.name} logo" loading="lazy" />
      </a>
    `;
    grid.append(card);
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

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3 class="person-name">${person.name}</h3>
      <p class="person-role">${person.role}</p>
      <p>${person.bio}</p>
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

function initApp() {
  hydrateCopy();
  renderTechnology();
  renderRoadmap();
  renderSupporters();
  renderTeam();

  const year = document.getElementById("year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  initStickyNav({ heroSelector: "#hero", navSelector: "#site-header" });
  initSectionObserver([
    "#vision",
    "#problem",
    "#technology",
    "#roadmap",
    "#supporters",
    "#team",
    "#contact"
  ]);

  initScrollReveal();
  initHeroVisual();

  const form = document.getElementById("signup-form");
  bindEmailCaptureForm(form, SCRIPT_URL);
}

initApp();
