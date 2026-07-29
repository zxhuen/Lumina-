import { api } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
    // Create Modal elements
    const openCreateModalBtn = document.getElementById("open-create-modal-btn");
    const createModal = document.getElementById("create-modal");
    const createModalClose = document.getElementById("create-modal-close");
    const createModalCancel = document.getElementById("create-modal-cancel");
    const form = document.getElementById("flashcard-form");
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file");
    const fileLabel = document.getElementById("file-label");
    const submitBtn = document.getElementById("submit-btn");

    // Saved Decks Containers
    const resultsContainer = document.getElementById("results-container");
    const setsGrid = document.getElementById("sets-grid");
    const setCount = document.getElementById("set-count");

    // Study Modal elements
    const studyModal = document.getElementById("study-modal");
    const modalClose = document.getElementById("modal-close");
    const modalSetTitle = document.getElementById("modal-set-title");
    const modalProgress = document.getElementById("modal-progress");
    const progressBarFill = document.getElementById("progress-bar-fill");
    const modalCardWrapper = document.getElementById("modal-card-wrapper");
    const modalCardInner = document.querySelector(".modal-card-inner");
    const modalCardFrontText = document.getElementById("modal-card-front-text");
    const modalCardBackText = document.getElementById("modal-card-back-text");
    const prevCardBtn = document.getElementById("prev-card-btn");
    const nextCardBtn = document.getElementById("next-card-btn");
    const shuffleBtn = document.getElementById("shuffle-btn");

    // State
    let userSets = [];
    let currentCards = [];
    let currentCardIndex = 0;
    let activeSetTitle = "";
    let activeSetId = null;

    // Fetch initial decks on render
    loadUserFlashcards();

    async function loadUserFlashcards() {
        try {
            const data = await api.listFlashcards();
            userSets = data || [];
            renderSetsGrid();
        } catch (err) {
            console.error("Could not fetch user flashcards:", err);
            renderEmptyState("Could not load flashcards.");
        }
    }

    function renderSetsGrid() {
        setsGrid.innerHTML = "";

        if (userSets.length === 0) {
            renderEmptyState("No saved flashcard decks.");
            setCount.textContent = "0 Decks";
            return;
        }

        resultsContainer.style.display = "block";
        setCount.textContent = `${userSets.length} ${userSets.length === 1 ? 'Deck' : 'Decks'}`;

        userSets.forEach((set) => {
            const cardCount = set.flashcards ? set.flashcards.length : 0;
            const setCardEl = document.createElement("div");
            setCardEl.className = "set-card";
            if (set.id) {
                setCardEl.setAttribute("data-set-id", set.id);
            }

            setCardEl.innerHTML = `
                <div class="set-card-meta">
                    <span style="font-size: 0.95rem; font-weight: 500;">${escapeHtml(set.title)}</span>
                    <span class="badge-count">${cardCount} cards</span>
                </div>
                <div style="display: flex; align-items: center; gap: var(--space-sm);">
                    <button class="delete-set-btn" title="Delete Set" aria-label="Delete Set">
                        <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                    <span style="font-size: 0.85rem; color: var(--text-tertiary);">Study &rarr;</span>
                </div>
            `;

            // Delete action
            const deleteBtn = setCardEl.querySelector(".delete-set-btn");
            deleteBtn.addEventListener("click", async(e) => {
                e.stopPropagation(); // Don't trigger modal open

                if (!set.id) {
                    if (typeof toast !== "undefined") toast.show("Cannot delete set without ID.", "error");
                    return;
                }

                if (!confirm(`Are you sure you want to delete "${set.title}"?`)) return;

                try {
                    await api.deleteFlashcardSet(set.id);

                    // Remove locally from state and re-render
                    userSets = userSets.filter((s) => s.id !== set.id);
                    renderSetsGrid();

                    if (typeof toast !== "undefined") {
                        toast.show("Flashcard set deleted.", "success");
                    }
                } catch (err) {
                    console.error("Delete failed:", err);
                    if (typeof toast !== "undefined") {
                        toast.show(err.message || "Failed to delete set.", "error");
                    }
                }
            });

            // Open study modal on card click
            setCardEl.addEventListener("click", () => {
                if (!set.flashcards || set.flashcards.length === 0) return;
                currentCards = [...set.flashcards];
                activeSetTitle = set.title;
                activeSetId = set.id || null;
                currentCardIndex = 0;
                openStudyModal();
            });

            setsGrid.appendChild(setCardEl);
        });
    }

    function renderEmptyState(message) {
        setsGrid.innerHTML = `
            <div style="text-align: center; padding: var(--space-lg); background: var(--bg-secondary); border-radius: var(--radius-md, 12px); border: 1px dashed var(--border-color);">
                <p style="color: var(--text-tertiary); font-size: 0.85rem;">${escapeHtml(message)}</p>
            </div>
        `;
    }

    // --- Create Modal Logic ---
    openCreateModalBtn.addEventListener("click", openCreateModal);
    createModalClose.addEventListener("click", closeCreateModal);
    createModalCancel.addEventListener("click", closeCreateModal);

    createModal.addEventListener("click", (e) => {
        if (e.target === createModal) closeCreateModal();
    });

    function openCreateModal() {
        form.reset();
        fileLabel.textContent = "Drag & drop file or click to browse";
        fileLabel.style.color = "var(--text-secondary)";
        fileLabel.style.fontWeight = "normal";
        createModal.classList.add("active");
    }

    function closeCreateModal() {
        createModal.classList.remove("active");
    }

    // File selection UI feedback
    fileInput.addEventListener("change", () => {
        if (fileInput.files && fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            fileLabel.textContent = fileName;
            fileLabel.style.color = "var(--text-primary)";
            fileLabel.style.fontWeight = "500";

            if (typeof toast !== "undefined") {
                toast.show(`File selected: ${fileName}`, "info");
            }
        }
    });

    // Drag & Drop for upload modal
    ["dragover", "dragenter"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add("drag-over");
        });
    });

    ["dragleave", "drop"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("drag-over");
        });
    });

    dropZone.addEventListener("drop", (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            const event = new Event("change", { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    });

    // Form submission inside Upload Modal
    form.addEventListener("submit", async(e) => {
        e.preventDefault();

        const title = document.getElementById("title").value.trim();
        const file = fileInput.files[0];

        if (!title || !file) {
            if (typeof toast !== "undefined") {
                toast.show("Title and file required.", "error");
            }
            return;
        }

        if (typeof toast !== "undefined") {
            toast.show("Generating flashcards...", "info", 4000);
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Generating...";

        try {
            const data = await api.generateFlashcards(title, file);

            const newCards = data.flashcards || [];
            const newTitle = (data.flashcard_set && data.flashcard_set.title) || title;
            const newId = data.id || (data.flashcard_set && data.flashcard_set.id) || null;

            // Prepend new deck & update view
            userSets.unshift({ id: newId, title: newTitle, flashcards: newCards });
            renderSetsGrid();

            // Close upload modal on success
            closeCreateModal();

            if (typeof toast !== "undefined") {
                toast.show("Flashcards created.", "success");
            }
        } catch (err) {
            console.error(err);
            if (typeof toast !== "undefined") {
                toast.show(err.message || "Failed to generate.", "error");
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Generate Set";
        }
    });

    // --- Study Session Modal Logic ---
    modalClose.addEventListener("click", closeStudyModal);

    studyModal.addEventListener("click", (e) => {
        if (e.target === studyModal) closeStudyModal();
    });

    modalCardWrapper.addEventListener("click", () => {
        modalCardWrapper.classList.toggle("flipped");
    });

    prevCardBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentCardIndex > 0) {
            currentCardIndex--;
            updateModalCard();
        }
    });

    nextCardBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentCardIndex < currentCards.length - 1) {
            currentCardIndex++;
            updateModalCard();
        }
    });

    shuffleBtn.addEventListener("click", () => {
        if (currentCards.length <= 1) return;
        currentCards.sort(() => Math.random() - 0.5);
        currentCardIndex = 0;
        updateModalCard();
        if (typeof toast !== "undefined") {
            toast.show("Deck shuffled", "info");
        }
    });

    // Global key listener
    document.addEventListener("keydown", (e) => {
        if (createModal.classList.contains("active") && e.key === "Escape") {
            closeCreateModal();
            return;
        }

        if (!studyModal.classList.contains("active")) return;

        if (e.key === "ArrowLeft" && currentCardIndex > 0) {
            currentCardIndex--;
            updateModalCard();
        } else if (e.key === "ArrowRight" && currentCardIndex < currentCards.length - 1) {
            currentCardIndex++;
            updateModalCard();
        } else if (e.key === " " || e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            modalCardWrapper.classList.toggle("flipped");
        } else if (e.key === "Escape") {
            closeStudyModal();
        }
    });

    function openStudyModal() {
        modalSetTitle.textContent = activeSetTitle;
        updateModalCard();
        studyModal.classList.add("active");
    }

    function closeStudyModal() {
        studyModal.classList.remove("active");
    }

    function updateModalCard() {
        const isFlipped = modalCardWrapper.classList.contains("flipped");

        if (isFlipped) {
            modalCardInner.style.transition = "none";
            modalCardWrapper.classList.remove("flipped");
            void modalCardInner.offsetHeight; // Force reflow
            modalCardInner.style.transition = "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
        }

        const card = currentCards[currentCardIndex];
        modalCardFrontText.textContent = card.front;
        modalCardBackText.textContent = card.back;

        modalProgress.textContent = `${currentCardIndex + 1} / ${currentCards.length}`;

        const progressPercent = ((currentCardIndex + 1) / currentCards.length) * 100;
        progressBarFill.style.width = `${progressPercent}%`;

        prevCardBtn.disabled = currentCardIndex === 0;
        nextCardBtn.disabled = currentCardIndex === currentCards.length - 1;

        prevCardBtn.style.opacity = currentCardIndex === 0 ? "0.5" : "1";
        nextCardBtn.style.opacity = currentCardIndex === currentCards.length - 1 ? "0.5" : "1";
    }

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
});