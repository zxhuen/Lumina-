import { api } from "./api.js";

let allSubjects = [];

async function renderSubjects() {
    const container = document.getElementById('subjects-grid');
    if (!container) return;

    try {
        allSubjects = await api.listSubjects();

        if (!allSubjects || allSubjects.length === 0) {
            container.innerHTML = `<p style="color: var(--text-tertiary); grid-column: 1/-1;">No subjects found in the database.</p>`;
            return;
        }

        displaySubjects(allSubjects);

    } catch (err) {
        container.innerHTML = `
            <p style="color: var(--text-tertiary); grid-column: 1/-1;">
                ⚠️ Failed to load subjects from backend API.
            </p>
        `;
    }
}

function displaySubjects(subjects) {
    const container = document.getElementById('subjects-grid');
    if (!container) return;

    if (subjects.length === 0) {
        container.innerHTML = `<p style="color: var(--text-tertiary); grid-column: 1/-1;">No matching subjects found.</p>`;
        return;
    }

    // 1. Added `cursor: pointer` and `data-id="${s.id}"`
    container.innerHTML = subjects.map((s, index) => `
        <div class="card card-hover subject-card" 
             data-id="${s.id}"
             style="opacity: 0; transform: translateY(12px); transition: opacity 0.3s ease, transform 0.3s ease; transition-delay: ${index * 0.04}s; cursor: pointer;">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-primary); font-weight: 600; margin-bottom: 8px; letter-spacing: 0.05em;">
                Course Track
            </div>
            <h3 style="font-size: 1.15rem; line-height: 1.3; font-weight: 600;">${escapeHtml(s.name)}</h3>
        </div>
    `).join('');

    // 2. Attach click listeners directly in JS module scope
    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => {
            const subjectId = card.dataset.id;
            if (subjectId) {
                window.location.href = `chat.html?subject_id=${encodeURIComponent(subjectId)}`;
            }
        });
    });

    // Trigger stagger fade-in animation frame
    requestAnimationFrame(() => {
        document.querySelectorAll('.subject-card').forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('subject-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = allSubjects.filter(s => s.name.toLowerCase().includes(query));

        const currentCards = document.querySelectorAll('.subject-card');
        currentCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.96)';
        });

        setTimeout(() => {
            displaySubjects(filtered);
        }, 150);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    renderSubjects();
    setupSearch();
});