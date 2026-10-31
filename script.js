
document.getElementById("year").textContent =
    new Date().getFullYear();

// Load projects from MySQL through Express
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
            <div class="project-card">
                <h3>${escapeHTML(project.title)}</h3>
                <p>${escapeHTML(project.description || "")}</p>
                <div class="project-tech">
                    ${escapeHTML(project.technologies || "")}
                </div>
                <div class="project-links">
                    ${safeLink(project.github_link, "GitHub")}
                    ${safeLink(project.live_link, "Live Demo")}
                </div>
            </div>
        `).join("");

    } catch (error) {
        container.innerHTML =
            "<p>Projects are temporarily unavailable.</p>";
        console.error(error);
    }
}

// Safely display text
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Only allow safe external links
function safeLink(url, label) {
    if (!url) return "";

    try {
        const parsed = new URL(url);

        if (!["http:", "https:"].includes(parsed.protocol)) {
            return "";
        }

        return `<a href="${escapeHTML(parsed.href)}"
            target="_blank" rel="noopener noreferrer">${label} ↗</a>`;
    } catch {
        return "";
    }
}

// Submit contact form
document.getElementById("contact-form")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const status = document.getElementById("form-status");

        const data = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            message: document.getElementById("message").value.trim()
        };

        status.textContent = "Sending...";

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
                throw new Error(result.error || "Message failed");
            }

            status.textContent = "Message sent successfully!";
            this.reset();

        } catch (error) {
            status.textContent = error.message;
        }
    });

// Initial loading
loadProjects();
