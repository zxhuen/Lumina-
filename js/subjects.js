async function renderSubjects() {
    const container = document.getElementById('subjects-grid');
    if (!container) return;

    try {
        // Fetch live subjects from PostgreSQL via FastAPI
        const subjects = await api.listSubjects();

        if (!subjects || subjects.length === 0) {
            container.innerHTML = `<p style="color: var(--text-tertiary); grid-column: 1/-1;">No subjects found in the database.</p>`;
            return;
        }

        // Render cards using returned 'name' field
        container.innerHTML = subjects.map(s => `
      <div class="card card-hover reveal active">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-primary); font-weight: 600; margin-bottom: 8px; letter-spacing: 0.05em;">
          Course Track
        </div>
        <h3 style="font-size: 1.15rem; line-height: 1.3; font-weight: 600;">${s.name}</h3>
      </div>
    `).join('');

    } catch (err) {
        container.innerHTML = `
      <p style="color: var(--text-tertiary); grid-column: 1/-1;">
        ⚠️ Failed to load subjects from backend API.
      </p>
    `;
    }
}

async function openSubjectModal() {
    const name = prompt("Enter Subject Name:");
    const term = prompt("Enter Term (e.g., 2nd Semester):");

    if (name && term) {
        try {
            await api.addSubject(name, term);
            toast.show('Subject added successfully!', 'success');
            // Re-fetch from API to update UI with fresh DB state
            renderSubjects();
        } catch (err) {
            toast.show('Failed to add subject to database', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderSubjects();
});