
"use strict";

// Footer year
document.getElementById("year").textContent =
  new Date().getFullYear();

// Mobile navigation
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.textContent = open ? "✕" : "☰";
  menuToggle.setAttribute("aria-expanded", String(open));
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.textContent = "☰";
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// Scroll animations
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

function observeReveals(root = document) {
  root.querySelectorAll(".reveal").forEach(element => {
    if (reducedMotion) {
      element.classList.add("show");
    } else {
      revealObserver.observe(element);
    }
  });
}

observeReveals();

// Animated typing effect
const roleElement = document.getElementById("typing-role");
const roles = [
  "Computer Science Undergraduate",
  "Web Development Enthusiast",
  "Database Systems Explorer",
  "Developer & Technology Learner"
];

if (!reducedMotion) {
  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function typeRole() {
    const role = roles[roleIndex];
    roleElement.textContent = role.slice(0, charIndex);

    let delay = 75;

    if (!deleting && charIndex < role.length) {
      charIndex++;
    } else if (!deleting) {
      deleting = true;
      delay = 1600;
    } else if (charIndex > 0) {
      charIndex--;
      delay = 35;
    } else {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 350;
    }

    setTimeout(typeRole, delay);
  }

  typeRole();
}

// Cursor glow
const cursorGlow = document.querySelector(".cursor-glow");

if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", event => {
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  }, { passive: true });
}

// Active navigation link
const navigationLinks = document.querySelectorAll(".nav-links a");

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navigationLinks.forEach(link => {
        link.classList.toggle(
          "active",
          link.getAttribute("href") === `#${entry.target.id}`
        );
      });
    }
  });
}, { rootMargin: "-25% 0px -60% 0px" });

document.querySelectorAll("main section").forEach(section => {
  sectionObserver.observe(section);
});

// Escape database values before inserting HTML
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Accept only safe HTTP/HTTPS project URLs
function safeLink(url, label) {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return `<a href="${escapeHTML(parsed.href)}"
      target="_blank" rel="noopener noreferrer">
      ${escapeHTML(label)} ↗
    </a>`;
  } catch {
    return "";
  }
}

// Load extra projects from the existing backend.
// The featured DBMS project stays visible at all times.
async function loadProjects() {
  const container = document.getElementById("project-list");
  const status = document.getElementById("project-status");

  try {
    const response = await fetch("/api/projects");

    if (!response.ok) {
      throw new Error("Projects API unavailable");
    }

    const projects = await response.json();

    if (!Array.isArray(projects)) {
      throw new Error("Unexpected projects response");
    }

    if (projects.length === 0) {
      status.textContent = "";
      return;
    }

    const additionalProjects = projects.filter(project =>
      !String(project.title || "").toLowerCase()
        .includes("inventory management and sales system")
    );

    additionalProjects.forEach((project, index) => {
      const card = document.createElement("article");
      card.className = "project-card reveal";

      card.innerHTML = `
        <div class="project-body">
          <div class="project-meta">
            <span>DATABASE PROJECT</span>
            <span>${String(index + 2).padStart(2, "0")} / WORK</span>
          </div>
          <h3>${escapeHTML(project.title)}</h3>
          <p>${escapeHTML(project.description || "")}</p>
          <div class="skill-tags">
            ${String(project.technologies || "")
              .split(",")
              .filter(Boolean)
              .map(tech => `<span>${escapeHTML(tech.trim())}</span>`)
              .join("")}
          </div>
          <div class="project-links">
            ${safeLink(project.github_link, "GitHub")}
            ${safeLink(project.live_link, "Live Demo")}
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    observeReveals(container);
    status.textContent = "";
  } catch (error) {
    console.warn("Additional projects could not be loaded:", error);
    status.textContent =
      "Featured project displayed. Additional database projects are currently unavailable.";
  }
}

// Contact form using the existing backend API
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

contactForm.addEventListener("submit", async event => {
  event.preventDefault();

  const data = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    message: document.getElementById("message").value.trim()
  };

  if (!data.name || !data.email || !data.message) {
    formStatus.textContent = "Please complete all fields.";
    return;
  }

  const submitButton = contactForm.querySelector("button");
  submitButton.disabled = true;
  formStatus.textContent = "Sending your message...";

  try {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Message could not be sent.");
    }

    formStatus.textContent = "✓ Your message was sent successfully!";
    contactForm.reset();
  } catch (error) {
    formStatus.textContent =
      error.message || "Unable to send your message right now.";
  } finally {
    submitButton.disabled = false;
  }
});

loadProjects();
