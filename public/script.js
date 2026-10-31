
// ======================================
// PERSONAL PORTFOLIO INTERACTIONS
// ======================================

// 1. Footer year
document.getElementById("year").textContent =
    new Date().getFullYear();


// 2. Animated typing effect
const roleElement = document.querySelector(".hero h2");

const roles = [
    "Computer Science Student",
    "Full Stack Developer",
    "Web Development Enthusiast",
    "Technology Explorer"
];

let roleIndex = 0;
let charIndex = 0;
let deleting = false;

function typeEffect() {
    if (!roleElement) return;

    const currentRole = roles[roleIndex];

    roleElement.textContent = currentRole.substring(
        0,
        charIndex
    );

    if (!deleting && charIndex < currentRole.length) {
        charIndex++;
        setTimeout(typeEffect, 85);
    } else if (!deleting) {
        deleting = true;
        setTimeout(typeEffect, 1400);
    } else if (charIndex > 0) {
        charIndex--;
        setTimeout(typeEffect, 40);
    } else {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        setTimeout(typeEffect, 300);
    }
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    typeEffect();
}


// 3. Scroll reveal animations
const revealElements = document.querySelectorAll(
    ".section-label, .section-title, " +
    ".about-content, .skills-grid, " +
    ".projects-grid, .education-card, " +
    ".contact-description, .contact-form"
);

revealElements.forEach(element => {
    element.classList.add("reveal");
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.12
});

revealElements.forEach(element => observer.observe(element));


// 4. Animate individual skill cards
document.querySelectorAll(".skill-card").forEach((card, index) => {
    card.classList.add("reveal");
    card.style.transitionDelay = `${(index % 5) * 100}ms`;
    observer.observe(card);
});


// 5. Mobile navigation
const navbar = document.querySelector(".navbar");
const navLinks = document.querySelector(".nav-links");

if (navbar && navLinks) {
    const menuButton = document.createElement("button");

    menuButton.className = "menu-toggle";
    menuButton.innerHTML = "☰";
    menuButton.setAttribute("aria-label", "Toggle navigation");
    menuButton.setAttribute("aria-expanded", "false");

    navbar.insertBefore(menuButton, navLinks);

    menuButton.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");

        menuButton.innerHTML = isOpen ? "✕" : "☰";
        menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("open");
            menuButton.innerHTML = "☰";
            menuButton.setAttribute("aria-expanded", "false");
        });
    });
}


// 6. Highlight active navigation link
const sections = document.querySelectorAll("main section");
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
}, {
    rootMargin: "-30% 0px -60% 0px"
});

sections.forEach(section => sectionObserver.observe(section));


// 7. Escape HTML to safely display project data
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// 8. Validate external project links
function safeLink(url, label) {
    if (!url) return "";

    try {
        const parsed = new URL(url);

        if (!["http:", "https:"].includes(parsed.protocol)) {
            return "";
        }

        return `<a href="${escapeHTML(parsed.href)}"
            target="_blank"
            rel="noopener noreferrer">${label} ↗</a>`;
    } catch {
        return "";
    }
}


// 9. Fetch projects from MySQL through backend
async function loadProjects() {
    const container = document.getElementById("project-list");

    try {
        const response = await fetch("/api/projects");

        if (!response.ok) {
            throw new Error("Unable to load projects");
        }

        const projects = await response.json();

        if (projects.length === 0) {
            container.innerHTML = "<p>No projects added yet.</p>";
            return;
        }

        container.innerHTML = projects.map(project => `
            <article class="project-card reveal">
                <h3>${escapeHTML(project.title)}</h3>

                <p>${escapeHTML(project.description || "")}</p>

                <div class="project-tech">
                    ${escapeHTML(project.technologies || "")}
                </div>

                <div class="project-links">
                    ${safeLink(project.github_link, "GitHub")}
                    ${safeLink(project.live_link, "Live Demo")}
                </div>
            </article>
        `).join("");

        container.querySelectorAll(".project-card").forEach(card => {
            observer.observe(card);
        });

    } catch (error) {
        container.innerHTML =
            "<p>Unable to load projects. Please try again later.</p>";

        console.error(error);
    }
}


// 10. Contact form submission
const contactForm = document.getElementById("contact-form");

contactForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const status = document.getElementById("form-status");

    const data = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        message: document.getElementById("message").value.trim()
    };

    if (!data.name || !data.email || !data.message) {
        status.textContent = "Please complete all fields.";
        return;
    }

    status.textContent = "Sending your message...";

    const submitButton = contactForm.querySelector("button");
    submitButton.disabled = true;

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

        status.textContent = "✓ Your message was sent successfully!";
        contactForm.reset();

    } catch (error) {
        status.textContent = error.message;
    } finally {
        submitButton.disabled = false;
    }
});


// 11. Load the portfolio projects
loadProjects();
