import { api } from "./api.js";

document.addEventListener('DOMContentLoaded', async() => {
    const grid = document.getElementById('recent-subjects-grid');
    if (!grid) return;

    try {
        const subjects = await api.listSubjects();
        grid.innerHTML = '';

        if (!subjects || subjects.length === 0) {
            grid.innerHTML = `<p style="color: var(--text-tertiary); grid-column: 1/-1;">No active subjects found.</p>`;
            return;
        }

        document.getElementById("subject-count").textContent = subjects.length;

        // Show top 6 subjects with direct launch link
        subjects.slice(0, 6).forEach(subject => {
            const card = document.createElement('div');
            card.className = 'card card-hover';
            card.style.cssText = 'cursor: pointer; padding: var(--space-md); display: flex; flex-direction: column; justify-content: space-between;';

            card.onclick = () => {
                window.location.href = `chat.html?subject_id=${encodeURIComponent(subject.id)}`;
            };

            card.innerHTML = `
                <div>
                    <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--accent-primary); font-weight: 600; letter-spacing: 0.05em; margin-bottom: 4px;">
                        Quick Query
                    </div>
                    <h3 style="font-size: 1rem; font-weight: 600; line-height: 1.3;">${escapeHtml(subject.name)}</h3>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 12px; display: flex; align-items: center; justify-content: space-between;">
                    <span>Launch Assistant</span>
                    <span>→</span>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        grid.innerHTML = `<p style="color: var(--text-tertiary); grid-column: 1/-1;">Failed to load active subjects.</p>`;
    }
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}